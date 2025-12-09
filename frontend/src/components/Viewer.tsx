import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Center,
  Html,
  useProgress,
  OrbitControls,
  Stars,
} from "@react-three/drei";
import GunModel from "./GunModel";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

type ViewerProps = {
  baseColor: string;
  slideColor: string;
  triggerColor: string;
  magColor: string;
  activePartType?: string | null;
  onPartClick?: (partType: string) => void;
};

const ROOM_SIZE = 4.2;
const ROOM_DIVISIONS = 10; // bigger size -> fewer squares

function RoomGrid() {
  const groupRef = useRef<THREE.Group>(null);

  // gentle hologram drift
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 0.15) * 0.06;
    groupRef.current.rotation.y = Math.sin(t * 0.07) * 0.05;
  });

  const gridColor = new THREE.Color("#dfe4f2");
  const lineOpacity = 0.15; // more transparent

  const makeGrid = () => {
    const grid = new THREE.GridHelper(
      ROOM_SIZE,
      ROOM_DIVISIONS,
      gridColor,
      gridColor
    );
    const mat = grid.material as THREE.Material & {
      opacity?: number;
      transparent?: boolean;
      depthWrite?: boolean;
      depthTest?: boolean;
    };
    mat.transparent = true;
    mat.opacity = lineOpacity;
    mat.depthWrite = false;
    mat.depthTest = true;
    return grid;
  };

  const floor = makeGrid();
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -ROOM_SIZE / 2;

  const backWall = makeGrid();
  backWall.position.z = -ROOM_SIZE / 2;

  const rightWall = makeGrid();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = ROOM_SIZE / 2;

  return (
    <group ref={groupRef}>
      <primitive object={floor} />
      <primitive object={backWall} />
      <primitive object={rightWall} />
    </group>
  );
}

export default function Viewer({
  baseColor,
  slideColor,
  triggerColor,
  magColor,
  activePartType = null,
  onPartClick,
}: ViewerProps) {
  // Legacy MVP model — only used when there’s no DB firearm selected
  const url = "/models/canik_mete_sft_threaded.glb";
  const { progress } = useProgress();
  const isLoading = progress < 100;

  return (
    <Canvas shadows camera={{ position: [2.5, 1.5, 2.9], fov: 45 }}>
      {/* Xbox-ish soft background */}
      <color attach="background" args={["#e4ecf6"]} />

      {/* Galaxy / starfield outside the box */}
      <Stars
        radius={80}
        depth={40}
        count={3500}
        factor={3.2}
        saturation={0}
        fade
        speed={0.4}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 6, 3]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Optical “room” grid box (no ceiling) */}
      <RoomGrid />

      {/* Placeholder while GLB loads */}
      {isLoading && (
        <Center>
          <PlaceholderGun baseColor={baseColor} />
        </Center>
      )}

      {/* Subtle environment reflections */}
      <Environment preset="city" />

      {/* Actual gun */}
      <React.Suspense fallback={<LoadingOverlay />}>
        <Center>
          <GunModel
            url={url}
            partColors={{
              frame: baseColor,
              slide: slideColor,
              trigger: triggerColor,
              magazine: magColor,
            }}
            selectedPartType={activePartType ?? undefined}
            onPartClick={(partType) => {
              onPartClick?.(partType);
            }}
          />
        </Center>
      </React.Suspense>

      <OrbitControls enablePan enableZoom enableRotate />

      {/* Postprocessing: soft bloom on bright stuff (grid/gun highlights) */}
      <EffectComposer disableNormalPass>
        <Bloom
          intensity={0.35}          // slight glow
          mipmapBlur
          luminanceThreshold={0.25} // only brighter bits glow
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  );
}

function PlaceholderGun({ baseColor }: { baseColor: string }) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        metalness: 0.25,
        roughness: 0.6,
      }),
    [baseColor]
  );

  return (
    <mesh material={material} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.7, 0.4]} />
    </mesh>
  );
}

function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          background: "#111",
          color: "#fff",
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        Loading… {progress.toFixed(0)}%
      </div>
    </Html>
  );
}
