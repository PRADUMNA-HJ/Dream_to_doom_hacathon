import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DragonBattleVignetteProps {
  active: boolean;
}

const DragonModel: React.FC<{
  color: string;
  emissiveColor: string;
  wingColor: string;
  isFacingLeft: boolean;
  timeOffset: number;
}> = ({ color, emissiveColor, wingColor, isFacingLeft, timeOffset }) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + timeOffset;

    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(time * 2.5) * 0.6;
      rootRef.current.rotation.z = Math.sin(time * 1.8) * 0.08;
      rootRef.current.rotation.x = 0.15 + Math.sin(time * 2) * 0.05;
    }

    const wingFlap = Math.sin(time * 5.5) * 0.65;
    if (leftWingRef.current) leftWingRef.current.rotation.z = wingFlap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -wingFlap;

    if (neckRef.current) {
      neckRef.current.rotation.x = -0.2 + Math.sin(time * 3) * 0.2;
    }

    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * 4) * 0.45;
    }
  });

  const flipX = isFacingLeft ? -1 : 1;

  return (
    <group ref={rootRef} scale={[flipX, 1, 1]}>
      {/* Muscular Dragon Torso */}
      <mesh castShadow position={[0, 0, 0]} rotation={[0.2, 0, 0]}>
        <coneGeometry args={[1.2, 3.2, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Spine Spikes */}
      {[-0.8, -0.2, 0.4, 1.0].map((z, idx) => (
        <mesh key={idx} position={[0, 0.8, z]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.15, 0.6, 4]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Neck & Head */}
      <group ref={neckRef} position={[0, 0.6, -1.4]} rotation={[-0.3, 0, 0]}>
        <mesh position={[0, 0.8, -0.6]} rotation={[-0.4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.65, 1.8, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.7} />
        </mesh>

        <group position={[0, 1.6, -1.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.6, 1.2]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.15, -0.8]} castShadow>
            <boxGeometry args={[0.55, 0.35, 0.9]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[-0.36, 0.15, -0.2]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <mesh position={[0.36, 0.15, -0.2]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <mesh position={[-0.3, 0.4, 0.3]} rotation={[-0.6, -0.2, -0.3]}>
            <coneGeometry args={[0.12, 1.2, 6]} />
            <meshStandardMaterial color={emissiveColor} metalness={0.9} />
          </mesh>
          <mesh position={[0.3, 0.4, 0.3]} rotation={[-0.6, 0.2, 0.3]}>
            <coneGeometry args={[0.12, 1.2, 6]} />
            <meshStandardMaterial color={emissiveColor} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.7, 0.6, -0.2]}>
        <mesh position={[-1.6, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.1, 0.18, 3.4, 6]} />
          <meshStandardMaterial color={color} metalness={0.8} />
        </mesh>
        <mesh position={[-1.7, -0.6, 0.4]} rotation={[0.2, 0, 0.3]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshStandardMaterial
            color={wingColor}
            emissive={emissiveColor}
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.7, 0.6, -0.2]}>
        <mesh position={[1.6, 0.2, 0]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.1, 0.18, 3.4, 6]} />
          <meshStandardMaterial color={color} metalness={0.8} />
        </mesh>
        <mesh position={[1.7, -0.6, 0.4]} rotation={[0.2, 0, -0.3]}>
          <planeGeometry args={[3.2, 2.0]} />
          <meshStandardMaterial
            color={wingColor}
            emissive={emissiveColor}
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* Tail */}
      <group ref={tailRef} position={[0, -0.2, 1.4]} rotation={[0.3, 0, 0]}>
        <mesh position={[0, -0.2, 1.2]} rotation={[0.4, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.4, 2.6, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.1, 2.5]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.4, 0.8, 4]} />
          <meshStandardMaterial color={emissiveColor} emissive={emissiveColor} emissiveIntensity={0.7} />
        </mesh>
      </group>
    </group>
  );
};

export const DragonBattleVignette: React.FC<DragonBattleVignetteProps> = ({ active }) => {
  const clashSparkRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!active) return;
    const time = state.clock.getElapsedTime();
    if (clashSparkRef.current) {
      const pulse = 1.0 + Math.sin(time * 12) * 0.35;
      clashSparkRef.current.scale.set(pulse, pulse, pulse);
      clashSparkRef.current.rotation.z += 0.08;
    }
  });

  if (!active) return null;

  return (
    <group position={[0, 0, -14]}>
      {/* DRAGON 1: Crimson Fire Drake */}
      <group position={[-6.5, 7.5, 0]} rotation={[0, 0.7, 0]}>
        <DragonModel
          color="#991b1b"
          emissiveColor="#ef4444"
          wingColor="#ea580c"
          isFacingLeft={false}
          timeOffset={0}
        />
        {/* Fire Breath */}
        <mesh position={[2.8, 1.2, -1.2]} rotation={[0, 0, -Math.PI / 2.8]}>
          <coneGeometry args={[0.7, 4.5, 12]} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.75} />
        </mesh>
        <pointLight position={[2.5, 1.2, -1.2]} color="#ff4500" intensity={5} distance={15} />
      </group>

      {/* DRAGON 2: Cobalt Frost Drake */}
      <group position={[6.5, 8.5, -2]} rotation={[0, -0.8, 0]}>
        <DragonModel
          color="#1e3a8a"
          emissiveColor="#00e5ff"
          wingColor="#38bdf8"
          isFacingLeft={true}
          timeOffset={1.5}
        />
        {/* Frost / Lightning Breath */}
        <mesh position={[-2.8, 1.2, 1.0]} rotation={[0, 0, Math.PI / 2.8]}>
          <coneGeometry args={[0.7, 4.5, 12]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.75} />
        </mesh>
        <pointLight position={[-2.5, 1.2, 1.0]} color="#00e5ff" intensity={5} distance={15} />
      </group>

      {/* Energy Clash Shockwave */}
      <group ref={clashSparkRef} position={[0, 8.2, -1.2]}>
        <mesh>
          <sphereGeometry args={[1.3, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.4, 2.5, 24]} />
          <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <pointLight color="#ffffff" intensity={8} distance={20} />
      </group>
    </group>
  );
};

