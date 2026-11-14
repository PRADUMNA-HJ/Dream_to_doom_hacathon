import React, { useRef } from 'react';
import type { AssetType } from '../shared/schemas/worldSchema';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

interface ProceduralAssetProps {
  asset: AssetType;
  color?: string;
}

/**
 * Beautiful procedural fallback 3D primitives for all 10 allowlisted assets.
 * Ensures the scene always renders instantly with 60 FPS even before GLTF binaries are downloaded.
 */
export const ProceduralAsset: React.FC<ProceduralAssetProps> = ({ asset, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Subtle floating/rotation animations for certain fantasy assets
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      if (asset === 'crystal') {
        meshRef.current.position.y += Math.sin(time * 2) * 0.002;
        meshRef.current.rotation.y += 0.01;
      } else if (asset === 'portal') {
        meshRef.current.rotation.z += 0.015;
      }
    }
    if (groupRef.current && asset === 'cloud') {
      groupRef.current.position.y = 2 + Math.sin(time * 1.5) * 0.15;
    }
  });

  switch (asset) {
    case 'tree':
      return (
        <group>
          {/* Trunk */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.5, 6]} />
            <meshStandardMaterial color="#5d4037" roughness={0.9} />
          </mesh>
          {/* Foliage Cone 1 */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <coneGeometry args={[1.2, 1.5, 6]} />
            <meshStandardMaterial color={color || '#2e7d32'} roughness={0.6} />
          </mesh>
          {/* Foliage Cone 2 */}
          <mesh position={[0, 2.6, 0]} castShadow>
            <coneGeometry args={[0.8, 1.2, 6]} />
            <meshStandardMaterial color={color || '#388e3c'} roughness={0.6} />
          </mesh>
        </group>
      );

    case 'rock':
      return (
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color={color || '#78909c'} roughness={0.9} metalness={0.1} />
        </mesh>
      );

    case 'crystal':
      return (
        <mesh ref={meshRef} position={[0, 0.8, 0]} castShadow>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={color || '#00e5ff'}
            emissive={color || '#00b0ff'}
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>
      );

    case 'portal':
      return (
        <group position={[0, 1.5, 0]}>
          {/* Outer ring */}
          <mesh ref={meshRef} castShadow>
            <torusGeometry args={[1.2, 0.15, 8, 24]} />
            <meshStandardMaterial
              color={color || '#d500f9'}
              emissive={color || '#aa00ff'}
              emissiveIntensity={0.8}
              roughness={0.2}
            />
          </mesh>
          {/* Inner swirl disc */}
          <mesh>
            <circleGeometry args={[1.1, 16]} />
            <meshBasicMaterial color="#1a0033" opacity={0.7} transparent />
          </mesh>
        </group>
      );

    case 'platform':
      return (
        <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[3, 0.5, 3]} />
          <meshStandardMaterial color={color || '#37474f'} roughness={0.7} metalness={0.2} />
        </mesh>
      );

    case 'enemy':
      return (
        <mesh ref={meshRef} position={[0, 0.7, 0]} castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={color || '#ff1744'}
            emissive="#b71c1c"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      );

    case 'house':
      return (
        <group position={[0, 1, 0]}>
          {/* Base */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 1.8, 2]} />
            <meshStandardMaterial color={color || '#8d6e63'} roughness={0.8} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.7, 1.2, 4]} />
            <meshStandardMaterial color="#c62828" roughness={0.5} />
          </mesh>
        </group>
      );

    case 'mushroom':
      return (
        <group position={[0, 0.4, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
            <meshStandardMaterial color="#fff8e1" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <sphereGeometry args={[0.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color || '#e91e63'} roughness={0.4} />
          </mesh>
        </group>
      );

    case 'lamp':
      return (
        <group position={[0, 1.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.12, 2.4, 8]} />
            <meshStandardMaterial color="#424242" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial
              color={color || '#ffeb3b'}
              emissive={color || '#fbc02d'}
              emissiveIntensity={1.2}
            />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color={color || '#fff9c4'} intensity={2} distance={8} />
        </group>
      );

    case 'cloud':
      return (
        <group ref={groupRef} position={[0, 2, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#eceff1" opacity={0.85} transparent roughness={0.9} />
          </mesh>
          <mesh position={[0.8, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.7, 10, 10]} />
            <meshStandardMaterial color="#eceff1" opacity={0.85} transparent roughness={0.9} />
          </mesh>
          <mesh position={[-0.7, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.6, 10, 10]} />
            <meshStandardMaterial color="#eceff1" opacity={0.85} transparent roughness={0.9} />
          </mesh>
        </group>
      );

    default:
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color || '#9e9e9e'} />
        </mesh>
      );
  }
};
