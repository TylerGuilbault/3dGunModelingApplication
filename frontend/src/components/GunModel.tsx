import React, { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

type GunModelProps = {
  url: string;
  partColors: Record<string, string>;
  meshToPartMap?: Record<string, string>;
  selectedPartType?: string;
  onPartClick?: (partType: string) => void;
};

export default function GunModel({
  url,
  partColors,
  meshToPartMap = {},
  selectedPartType,
  onPartClick,
}: GunModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Group };

  // 1) Attach partType metadata and clone materials once
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;
      const name = mesh.name || "";

      // Lookup partType from DB map; fall back to name-based guess if needed
      let partType = meshToPartMap[name];
      if (!partType) {
        const lower = name.toLowerCase();
        if (lower.includes("slide")) partType = "slide";
        else if (lower.includes("frame") || lower.includes("grip"))
          partType = "frame";
        else if (lower.includes("trigger")) partType = "trigger";
        else if (lower.includes("mag")) partType = "magazine";
      }
      mesh.userData.partType = partType;

      // Clone material so we don't mutate GLTF cache
      if (!mesh.userData.materialCloned) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mesh.material) {
          mesh.material = mesh.material.clone();
        }
        mesh.userData.materialCloned = true;
      }

      // 🔥 CRITICAL: Remove textures and vertex colors that block color changes
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      
      mats.forEach((m) => {
        if (
          m instanceof THREE.MeshStandardMaterial ||
          m instanceof THREE.MeshPhongMaterial ||
          m instanceof THREE.MeshPhysicalMaterial
        ) {
          // Store original color
          if (!mesh.userData.originalColor) {
            mesh.userData.originalColor = m.color.clone();
          }

          // 🔥 Remove maps that override color
          m.map = null;           // Base color texture
          m.alphaMap = null;      // Alpha texture
          
          // Keep normal/roughness/metalness maps for material feel
          // m.normalMap stays
          // m.roughnessMap stays
          // m.metalnessMap stays

          m.needsUpdate = true;
        } else if (m instanceof THREE.MeshBasicMaterial) {
          if (!mesh.userData.originalColor) {
            mesh.userData.originalColor = m.color.clone();
          }
          m.map = null;
          m.needsUpdate = true;
        }
      });

      // 🔥 Remove vertex colors if present
      if (mesh.geometry.attributes.color) {
        mesh.geometry.deleteAttribute('color');
      }
    });
  }, [scene, meshToPartMap]);

  // 2) Auto-center and auto-scale to a consistent size
  useLayoutEffect(() => {
    if (!groupRef.current) return;

    // Reset any previous transform first
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Largest dimension of the model
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;

    // Target size for the longest axis
    const TARGET_SIZE = 2.4;
    const scale = TARGET_SIZE / maxAxis;
    groupRef.current.scale.setScalar(scale);

    // Move so that the model is centered at the origin
    const scaledCenter = center.multiplyScalar(scale);
    groupRef.current.position.set(
      -scaledCenter.x,
      -scaledCenter.y,
      -scaledCenter.z
    );
  }, [scene]);

  // 3) Apply per-part coloring + selection tint
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;
      const partType: string | undefined = mesh.userData.partType;

      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      mats.forEach((m) => {
        if (
          m instanceof THREE.MeshStandardMaterial ||
          m instanceof THREE.MeshPhongMaterial ||
          m instanceof THREE.MeshPhysicalMaterial ||
          m instanceof THREE.MeshBasicMaterial
        ) {
          // Base color: from partColors, or original if not provided
          const baseHex =
            (partType && partColors[partType]) ||
            mesh.userData.originalColor?.getStyle() ||
            "#444444";
          
          m.color.set(baseHex);

          // Very subtle emissive bump for selected part type
          if (m instanceof THREE.MeshBasicMaterial) {
            // Basic materials don't have emissive
            if (partType && selectedPartType && partType === selectedPartType) {
              m.color.set(new THREE.Color(baseHex).offsetHSL(0, 0, 0.1));
            }
          } else {
            if (partType && selectedPartType && partType === selectedPartType) {
              m.emissive = new THREE.Color(0x111111);
              m.emissiveIntensity = 0.35;
            } else {
              m.emissive = new THREE.Color(0x000000);
              m.emissiveIntensity = 0;
            }
          }

          m.needsUpdate = true;
        }
      });
    });
  }, [scene, partColors, selectedPartType]);

  // 4) Clicking a mesh => report its partType
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const obj = event.object as THREE.Object3D;
    const partType: string | undefined = obj.userData.partType;
    if (partType && onPartClick) {
      onPartClick(partType);
    }
  };

  return (
    <group ref={groupRef}>
      <primitive object={scene} onPointerDown={handlePointerDown} />
    </group>
  );
}

// Optional: preload hook
useGLTF.preload("/uploads/models/ak-47.glb");