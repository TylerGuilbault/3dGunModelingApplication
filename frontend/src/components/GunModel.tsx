// frontend/src/components/GunModel.tsx
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

type Props = {
  url: string;
  /** Map of part key -> hex color */
  partColors: Record<string, string>;
} & JSX.IntrinsicElements["group"];

/** Map part keys to name matchers (extend as you add named meshes in Blender) */
const PART_MATCHERS: Record<string, RegExp> = {
  slide: /slide_main/i,
  frame: /frame_main/i,
  trigger: /trigger/i,
  magazine: /mag|magazine/i,
  // sightsFront: /sights?_front/i,
  // sightsRear: /sights?_rear/i,
  // barrel: /barrel/i,
  // safety: /safety/i,
  // magRelease: /mag[_-]?release/i,
};

export default function GunModel({ url, partColors, ...props }: Props) {
  const gltf = useGLTF(url);
  const { invalidate } = useThree();

  // Clone once so we can safely mutate without touching the GLTF cache
  const root = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    // Pre-create THREE.Colors for performance
    const colorMap = Object.fromEntries(
      Object.entries(partColors).map(([k, hex]) => [k, new THREE.Color(hex)])
    );

    root.traverse((o) => {
      if (!(o as any).isMesh) return;
      const mesh = o as THREE.Mesh;
      const name = (mesh.name || "").toLowerCase();

      // Find the first matching part key for this mesh
      let matchedKey: string | null = null;
      for (const [key, rx] of Object.entries(PART_MATCHERS)) {
        if (rx.test(name)) {
          matchedKey = key;
          break;
        }
      }

      // If no match, leave material as-is
      if (!matchedKey) return;

      // Ensure unique materials per mesh to avoid cross-tinting between parts
      const srcMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const mats = srcMats.map((m) =>
        m instanceof THREE.MeshStandardMaterial ? m.clone() : new THREE.MeshStandardMaterial()
      );

      const tint = colorMap[matchedKey];

      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        if (tint) std.color.copy(tint);
        std.metalness = 0.25;
        std.roughness = 0.6;
        std.needsUpdate = true;
      });

      mesh.material = Array.isArray(mesh.material) ? (mats as any) : mats[0];
      mesh.castShadow = mesh.receiveShadow = true;
    });

    invalidate(); // trigger re-render after tinting pass
  }, [root, partColors, invalidate]);

  return (
    <group {...props}>
      <primitive object={root} />
    </group>
  );
}

// Optional fixed-path preload
// useGLTF.preload("/models/canik_mete_sft_threaded.glb");
