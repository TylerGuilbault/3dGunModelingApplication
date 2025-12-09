// src/components/IllusionRoom.tsx
import React from "react";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

const IllusionRoom: React.FC = () => {
  // Soft, slightly gray/blue-tinted white (360-style)
  const base = "#e7ecf3";
  const lineStrong = "#c0c7d4";
  const lineSoft = "#d6dde8";

  return (
    <group>
      {/* Outer box that we sit *inside* of */}
      <mesh scale={[10, 6, 10]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={base}
          side={THREE.BackSide}
          roughness={0.95}
          metalness={0.0}
        />
        {/* Outer frame edges */}
        <Edges color={lineStrong} />
      </mesh>

      {/* Floor grid */}
      <gridHelper
        args={[8, 16, lineStrong, lineSoft]}
        position={[0, -3, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Back wall grid */}
      <gridHelper
        args={[6, 12, lineStrong, lineSoft]}
        position={[0, 0, -5]}
      />

      {/* Front wall grid (very subtle, mirrors back wall) */}
      <gridHelper
        args={[6, 12, lineStrong, lineSoft]}
        position={[0, 0, 5]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Ceiling grid */}
      <gridHelper
        args={[8, 16, lineStrong, lineSoft]}
        position={[0, 3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
};

export default IllusionRoom;
