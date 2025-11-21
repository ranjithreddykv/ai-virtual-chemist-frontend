// LabScene.jsx - 3D Scene with Lighting and Environment

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from "@react-three/drei";
import Beaker from "./Beaker";

export default function LabScene({ beakers, activeBeaker, onBeakerClick }) {
  return (
    <div className="w-full h-full bg-linear-to-b from-slate-900 to-slate-800">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.5, 3]} fov={50} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight
          position={[0, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        {/* Environment */}
        <Suspense fallback={null}>
          <Environment preset="studio" />
        </Suspense>

        {/* Lab Table */}
        <mesh
          receiveShadow
          position={[0, -0.51, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial
            color="#2c3e50"
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>

        {/* Beakers */}
        {beakers.map((beaker, index) => {
          const xPos = (index - (beakers.length - 1) / 2) * 0.8;
          return (
            <Beaker
              key={beaker.id}
              position={[xPos, 0, 0]}
              liquidColor={beaker.liquidColor}
              fillLevel={beaker.fillLevel}
              isActive={activeBeaker === beaker.id}
              onClick={() => onBeakerClick(beaker.id)}
              label={beaker.label}
              showBubbles={beaker.showBubbles}
              showPrecipitate={beaker.showPrecipitate}
              precipitateColor={beaker.precipitateColor}
              bubbleIntensity={beaker.bubbleIntensity}
            />
          );
        })}

        {/* Contact Shadows */}
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.5}
          scale={10}
          blur={2}
          far={4}
        />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}
