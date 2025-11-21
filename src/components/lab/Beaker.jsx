/* eslint-disable no-unused-vars */
// Beaker.jsx - Improved 3D Beaker Component

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function Beaker({
  position = [0, 0, 0],
  liquidColor = "#4A90E2",
  fillLevel = 0.5,
  isActive = false,
  onClick,
  label = "Beaker",
  showBubbles = false,
  showPrecipitate = false,
  precipitateColor = "#FFFFFF",
  bubbleIntensity = "none",
  temperature = 20, // Celsius - affects bubble intensity
  contents = "water", // Affects visual properties
  onInteract, // New callback for interactions
}) {
  const beakerRef = useRef();
  const liquidRef = useRef();
  const bubblesRef = useRef();
  const precipitateRef = useRef();
  const groupRef = useRef();

  // State for interactive animations
  const [hovered, setHovered] = useState(false);

  // Material configurations based on contents
  const materialConfigs = useMemo(
    () => ({
      water: {
        opacity: 0.7,
        transmission: 0.9,
        roughness: 0.1,
        metalness: 0.0,
      },
      oil: {
        opacity: 0.8,
        transmission: 0.3,
        roughness: 0.3,
        metalness: 0.1,
      },
      chemical: {
        opacity: 0.6,
        transmission: 0.7,
        roughness: 0.2,
        metalness: 0.0,
      },
    }),
    []
  );

  const currentMaterial = materialConfigs[contents] || materialConfigs.water;

  // Enhanced bubble system with temperature influence
  const bubbles = useMemo(() => {
    if (bubbleIntensity === "none" && temperature < 50) return null;

    // Temperature affects bubble count and speed
    const tempFactor = Math.max(0, (temperature - 20) / 80);
    const baseCount =
      bubbleIntensity === "high" ? 40 : bubbleIntensity === "medium" ? 25 : 15;
    const count = Math.floor(baseCount + baseCount * tempFactor);

    const positions = new Float32Array(count * 3);
    const velocities = [];
    const sizes = new Float32Array(count);
    const lifetimes = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.12 + 0.03; // More natural distribution

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.35 + Math.random() * 0.1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const baseSpeed = 0.015 + tempFactor * 0.02;
      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: baseSpeed + Math.random() * 0.01,
        z: (Math.random() - 0.5) * 0.008,
      });

      sizes[i] = Math.random() * 0.02 + 0.01;
      lifetimes.push(Math.random() * 2 + 1);
    }

    return { positions, velocities, sizes, lifetimes, count };
  }, [bubbleIntensity, temperature]);

  // Improved precipitate system
  const precipitate = useMemo(() => {
    if (!showPrecipitate) return null;

    const count = 60;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const color = new THREE.Color(precipitateColor);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.14;
      const heightVariation = Math.random() * 0.1;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.38 + heightVariation;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      sizes[i] = Math.random() * 0.015 + 0.008;

      // Color variation
      colors[i * 3] = color.r * (0.8 + Math.random() * 0.2);
      colors[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
      colors[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
    }

    return { positions, sizes, colors, count };
  }, [showPrecipitate, precipitateColor]);

  // Initialize particle system
  useEffect(() => {
    if (bubbles && bubblesRef.current) {
      const geometry = bubblesRef.current.geometry;
      geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(bubbles.sizes, 1)
      );
    }
  }, [bubbles]);

  // Enhanced animations with physics
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Improved bubble animation with delta time
    if (bubbles && bubblesRef.current) {
      const geometry = bubblesRef.current.geometry;
      const positions = geometry.attributes.position.array;

      for (let i = 0; i < bubbles.count; i++) {
        const idx = i * 3;

        // Apply velocity with delta time for consistent speed
        positions[idx] += bubbles.velocities[i].x * delta * 60;
        positions[idx + 1] += bubbles.velocities[i].y * delta * 60;
        positions[idx + 2] += bubbles.velocities[i].z * delta * 60;

        // Reset bubble with some randomness when it reaches top
        if (positions[idx + 1] > 0.15 + fillLevel * 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.12 + 0.03;
          positions[idx] = Math.cos(angle) * radius;
          positions[idx + 1] = -0.35 + Math.random() * 0.05;
          positions[idx + 2] = Math.sin(angle) * radius;
        }
      }

      geometry.attributes.position.needsUpdate = true;
    }

    // Realistic liquid movement based on fill level and activity
    if (liquidRef.current) {
      const liquid = liquidRef.current;
      const waveFactor = isActive ? 1.5 : 1.0;
      const fillFactor = 0.5 + (1 - fillLevel) * 0.5; // Less movement when fuller

      liquid.position.y =
        Math.sin(time * 1.5) * 0.001 * waveFactor * fillFactor;
      liquid.position.x = Math.sin(time * 2) * 0.0005 * waveFactor;
    }

    // Interactive hover and active animations
    if (groupRef.current) {
      const hoverY = hovered ? 0.05 : 0;
      const activeY = isActive ? 0.1 : 0;
      const targetY = Math.max(hoverY, activeY);

      groupRef.current.position.y +=
        (targetY - groupRef.current.position.y) * 0.1;

      // Gentle rotation when active
      if (isActive) {
        groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
      } else {
        groupRef.current.rotation.y += (0 - groupRef.current.rotation.y) * 0.1;
      }

      // Scale effect
      const targetScale = hovered ? 1.05 : 1.0;
      groupRef.current.scale.x +=
        (targetScale - groupRef.current.scale.x) * 0.1;
      groupRef.current.scale.y +=
        (targetScale - groupRef.current.scale.y) * 0.1;
      groupRef.current.scale.z +=
        (targetScale - groupRef.current.scale.z) * 0.1;
    }
  });

  // Event handlers
  const handleClick = (event) => {
    event.stopPropagation();
    onClick?.(event);
    onInteract?.({ type: "click", position: event.point });
  };

  const handlePointerEnter = () => {
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  // Calculate liquid height with meniscus effect
  const liquidHeight = fillLevel * 0.8;
  const liquidPositionY = -0.4 + liquidHeight / 2;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Enhanced Beaker Glass with thickness variation */}
      <mesh ref={beakerRef} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.18, 0.8, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transparent
          opacity={0.2}
          roughness={0.05}
          metalness={0.1}
          transmission={0.95}
          thickness={0.1}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beaker Bottom with inner surface */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[0.178, 0.178, 0.02, 32]} />
        <meshPhysicalMaterial
          color="#e2e8f0"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>

      {/* Liquid with meniscus effect */}
      <group>
        <mesh ref={liquidRef} position={[0, liquidPositionY, 0]} castShadow>
          <cylinderGeometry args={[0.188, 0.168, liquidHeight, 32]} />
          <meshPhysicalMaterial
            color={liquidColor}
            transparent
            opacity={currentMaterial.opacity}
            roughness={currentMaterial.roughness}
            metalness={currentMaterial.metalness}
            transmission={currentMaterial.transmission}
            thickness={0.3}
            envMapIntensity={1}
          />
        </mesh>

        {/* Liquid surface */}
        <mesh
          position={[0, -0.4 + liquidHeight, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.185, 32]} />
          <meshPhysicalMaterial
            color={liquidColor}
            transparent
            opacity={0.8}
            roughness={0.05}
            metalness={0.2}
          />
        </mesh>
      </group>

      {/* Enhanced Bubbles with size variation */}
      {bubbles && (
        <points ref={bubblesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={bubbles.count}
              array={bubbles.positions}
              itemSize={3}
            />
            {bubbles.sizes && (
              <bufferAttribute
                attach="attributes-size"
                count={bubbles.count}
                array={bubbles.sizes}
                itemSize={1}
              />
            )}
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color="#E8F4F8"
            transparent
            opacity={0.8}
            sizeAttenuation
            alphaTest={0.1}
          />
        </points>
      )}

      {/* Enhanced Precipitate with color variation */}
      {precipitate && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={precipitate.count}
              array={precipitate.positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={precipitate.count}
              array={precipitate.colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={precipitate.count}
              array={precipitate.sizes}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.02}
            transparent
            opacity={0.9}
            sizeAttenuation
            vertexColors
            alphaTest={0.1}
          />
        </points>
      )}

      {/* Enhanced Label - Fixed without TextGeometry */}
      {isActive && (
        <group position={[0, 0.5, 0]}>
          {/* Label Background */}
          <mesh>
            <planeGeometry args={[0.5, 0.12]} />
            <meshBasicMaterial
              color="#1e293b"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Simple text representation using geometry */}
          <mesh position={[0, 0, 0.01]} scale={[0.8, 0.8, 1]}>
            <planeGeometry args={[0.4, 0.08]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Glow effect when active */}
      {isActive && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.2, 0.85, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}
