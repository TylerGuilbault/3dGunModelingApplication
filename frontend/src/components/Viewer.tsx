import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Center, Html, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useMemo } from "react";
import GunModel from "./GunModel";
import ErrorBoundary from "./ErrorBoundary";

function LoadingOverlay() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ background: "#111", color: "#fff", padding: "6px 10px", borderRadius: 8 }}>
        Loading… {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

function PlaceholderGun({ baseColor }: { baseColor: string }) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color(baseColor), metalness: 0.25, roughness: 0.6 }),
    [baseColor]
  );
  return (
    <mesh material={material} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.7, 0.4]} />
    </mesh>
  );
}

export default function Viewer({
  baseColor,
  slideColor,
  triggerColor,
  magColor,
}: {
  baseColor: string;
  slideColor: string;
  triggerColor: string;
  magColor: string;
}) {
  const url = "/models/canik_mete_sft_threaded.glb";
  const { progress } = useProgress(); // 0..100
  const isLoading = progress < 100;

  return (
    <Canvas shadows camera={{ position: [2.5, 1.5, 2.5], fov: 45 }}>
      <color attach="background" args={["#f7f7f7"]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 3]} intensity={1} castShadow />

      {/* Show placeholder ONLY while loading */}
      {isLoading && (
        <Center>
          <PlaceholderGun baseColor={baseColor} />
        </Center>
      )}

      {/* Keep Environment OUTSIDE Suspense to avoid setState-in-render warning */}
      <Environment preset="city" />

      {/* Load model; any error is contained; overlay shows progress */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={<LoadingOverlay />}>
          <Center>
            <GunModel
              url={url}
              partColors={{
                frame: baseColor,
                slide: slideColor,
                trigger: triggerColor,
                magazine: magColor,
              }}
            />
          </Center>
        </Suspense>
      </ErrorBoundary>

      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
