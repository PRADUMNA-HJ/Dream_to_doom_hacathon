import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AnimatedChaseVignetteProps {
  active: boolean;
  mode?: 'boy_chases_dog' | 'dog_chases_boy';
}

/**
 * Animated "Boy & Dog Chase" 3D Vignette
 * Dynamically supports both:
 * 1. "Boy chasing dog": Dog runs in front, Boy runs behind trying to catch the dog!
 * 2. "Dog chasing boy": Boy runs in front, Dog runs behind chasing the boy!
 */
export const AnimatedChaseVignette: React.FC<AnimatedChaseVignetteProps> = ({
  active,
  mode = 'boy_chases_dog',
}) => {
  const boyRef = useRef<THREE.Group>(null);
  const boyLeftLegRef = useRef<THREE.Group>(null);
  const boyRightLegRef = useRef<THREE.Group>(null);
  const boyLeftArmRef = useRef<THREE.Group>(null);
  const boyRightArmRef = useRef<THREE.Group>(null);
  const boyHeadRef = useRef<THREE.Group>(null);

  const dogRef = useRef<THREE.Group>(null);
  const dogLegFLRef = useRef<THREE.Group>(null);
  const dogLegFRRef = useRef<THREE.Group>(null);
  const dogLegBLRef = useRef<THREE.Group>(null);
  const dogLegBRRef = useRef<THREE.Group>(null);
  const dogTailRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!active) return;
    const time = state.clock.getElapsedTime();

    // Loop trajectory along the central parkway (Z: +8m down to -24m)
    const runCycle = (time * 3.4) % 32;
    const leadZ = 6 - runCycle;
    const followerZ = leadZ + 2.8;

    const boyZ = mode === 'boy_chases_dog' ? followerZ : leadZ;
    const dogZ = mode === 'boy_chases_dog' ? leadZ : followerZ;

    // --- ANIMATE BOY ---
    if (boyRef.current) {
      // If boy is chasing the dog, lean forward slightly
      const leanAngle = mode === 'boy_chases_dog' ? 0.18 : 0.08;
      boyRef.current.rotation.x = leanAngle;
      boyRef.current.position.set(0, 0, boyZ);
      // Run bobbing
      boyRef.current.position.y = Math.abs(Math.sin(time * 11)) * 0.12;
    }

    const stride = Math.sin(time * 11);
    if (boyLeftLegRef.current) boyLeftLegRef.current.rotation.x = stride * 0.8;
    if (boyRightLegRef.current) boyRightLegRef.current.rotation.x = -stride * 0.8;

    if (boyLeftArmRef.current) {
      // Reaching forward if chasing, swinging if running away
      boyLeftArmRef.current.rotation.x =
        mode === 'boy_chases_dog' ? -0.7 + stride * 0.4 : -stride * 0.85;
    }
    if (boyRightArmRef.current) {
      boyRightArmRef.current.rotation.x =
        mode === 'boy_chases_dog' ? -0.8 - stride * 0.4 : stride * 0.85;
    }

    if (boyHeadRef.current) {
      // Look back if dog is behind, look forward if chasing dog
      if (mode === 'dog_chases_boy') {
        const glance = Math.sin(time * 1.8);
        boyHeadRef.current.rotation.y = glance > 0.4 ? 0.7 : 0;
      } else {
        boyHeadRef.current.rotation.y = 0;
      }
    }

    // --- ANIMATE DOG ---
    if (dogRef.current) {
      // Dog weaves playfully as it runs
      const dogX = Math.sin(time * 4) * 0.35;
      dogRef.current.position.set(dogX, 0, dogZ);
      dogRef.current.position.y = Math.abs(Math.sin(time * 14)) * 0.1;
    }

    // 4-legged gallop
    const dogGallop1 = Math.sin(time * 15);
    const dogGallop2 = Math.cos(time * 15);
    if (dogLegFLRef.current) dogLegFLRef.current.rotation.x = dogGallop1 * 0.75;
    if (dogLegFRRef.current) dogLegFRRef.current.rotation.x = -dogGallop1 * 0.75;
    if (dogLegBLRef.current) dogLegBLRef.current.rotation.x = dogGallop2 * 0.75;
    if (dogLegBRRef.current) dogLegBRRef.current.rotation.x = -dogGallop2 * 0.75;

    // Tail wagging happily
    if (dogTailRef.current) {
      dogTailRef.current.rotation.y = Math.sin(time * 24) * 0.7;
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Central Cobblestone Park Pathway */}
      <mesh position={[0, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.2, 38]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {/* Stone Curbs */}
      <mesh position={[-2.15, 0.08, -8]}>
        <boxGeometry args={[0.2, 0.15, 38]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <mesh position={[2.15, 0.08, -8]}>
        <boxGeometry args={[0.2, 0.15, 38]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* --- RUNNING BOY --- */}
      <group ref={boyRef} position={[0, 0, 6]}>
        {/* Torso (Red Hoodie) */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.5, 0.65, 0.32]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>

        {/* Head & Hair */}
        <group ref={boyHeadRef} position={[0, 1.75, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.1, -0.04]} castShadow>
            <sphereGeometry args={[0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>

        {/* Arms */}
        <group ref={boyLeftArmRef} position={[-0.32, 1.45, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>
        <group ref={boyRightArmRef} position={[0.32, 1.45, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
        </group>

        {/* Legs & Shoes */}
        <group ref={boyLeftLegRef} position={[-0.16, 0.92, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.7, 8]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.72, 0.06]} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>
        <group ref={boyRightLegRef} position={[0.16, 0.92, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.08, 0.7, 8]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.72, 0.06]} castShadow>
            <boxGeometry args={[0.13, 0.12, 0.26]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>
        </group>
      </group>

      {/* --- DOG (Golden Retriever / Beagle) --- */}
      <group ref={dogRef} position={[0, 0, 8.8]}>
        {/* Dog Torso */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[0.38, 0.36, 0.82]} />
          <meshStandardMaterial color="#d97706" roughness={0.7} />
        </mesh>

        {/* Dog Neck */}
        <mesh position={[0, 0.68, -0.32]} rotation={[0.4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.36, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.7} />
        </mesh>

        {/* Red Collar */}
        <mesh position={[0, 0.72, -0.34]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.18, 0.03, 8, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* Dog Head */}
        <group position={[0, 0.88, -0.44]}>
          <mesh castShadow>
            <boxGeometry args={[0.28, 0.26, 0.32]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.04, -0.22]} castShadow>
            <boxGeometry args={[0.16, 0.14, 0.2]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.01, -0.32]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          {/* Panting Tongue */}
          <mesh position={[0, -0.11, -0.24]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.09, 0.02, 0.14]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
          {/* Floppy Ears */}
          <mesh position={[-0.16, 0.02, 0.02]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.06, 0.24, 0.14]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[0.16, 0.02, 0.02]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.06, 0.24, 0.14]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>

        {/* 4 Galloping Legs */}
        <group ref={dogLegFLRef} position={[-0.14, 0.38, -0.26]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.42, 6]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
        </group>
        <group ref={dogLegFRRef} position={[0.14, 0.38, -0.26]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.42, 6]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
        </group>
        <group ref={dogLegBLRef} position={[-0.14, 0.38, 0.26]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.04, 0.42, 6]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
        </group>
        <group ref={dogLegBRRef} position={[0.14, 0.38, 0.26]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.04, 0.42, 6]} />
            <meshStandardMaterial color="#b45309" roughness={0.7} />
          </mesh>
        </group>

        {/* Wagging Tail */}
        <group ref={dogTailRef} position={[0, 0.65, 0.4]} rotation={[-0.5, 0, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 0.35, 6]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
