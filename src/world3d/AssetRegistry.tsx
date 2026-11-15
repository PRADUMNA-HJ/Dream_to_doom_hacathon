import React, { useRef } from 'react';
import type { AssetType, PhysicsType, InteractionType } from '../shared/schemas/worldSchema';
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
          {/* Ancient gnarled trunk */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.55, 3.6, 8]} />
            <meshStandardMaterial color="#3e2723" roughness={0.9} />
          </mesh>
          {/* Multi-layered luminous foliage globes */}
          <mesh position={[0, 3.8, 0]} castShadow>
            <dodecahedronGeometry args={[1.8, 1]} />
            <meshStandardMaterial
              color={color || '#10b981'}
              emissive={color || '#059669'}
              emissiveIntensity={0.5}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[1.1, 4.4, 0.6]} castShadow>
            <dodecahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial
              color={color || '#34d399'}
              emissive={color || '#10b981'}
              emissiveIntensity={0.6}
              roughness={0.5}
            />
          </mesh>
          <mesh position={[-1.0, 4.2, -0.6]} castShadow>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial
              color={color || '#059669'}
              emissive={color || '#047857'}
              emissiveIntensity={0.4}
              roughness={0.5}
            />
          </mesh>
        </group>
      );

    case 'rock':
      return (
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color={color || '#64748b'} roughness={0.8} metalness={0.2} />
        </mesh>
      );

    case 'crystal':
      return (
        <mesh ref={meshRef} position={[0, 1.0, 0]} castShadow>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color={color || '#00e5ff'}
            emissive={color || '#00b0ff'}
            emissiveIntensity={1.2}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      );

    case 'portal':
      return (
        <group position={[0, 2.0, 0]}>
          {/* Outer ring */}
          <mesh ref={meshRef} castShadow>
            <torusGeometry args={[1.6, 0.2, 12, 32]} />
            <meshStandardMaterial
              color={color || '#d500f9'}
              emissive={color || '#aa00ff'}
              emissiveIntensity={1.5}
              roughness={0.2}
            />
          </mesh>
          {/* Inner swirl disc */}
          <mesh>
            <circleGeometry args={[1.4, 24]} />
            <meshBasicMaterial color="#1a0033" opacity={0.7} transparent />
          </mesh>
        </group>
      );

    case 'platform':
      return (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
            <boxGeometry args={[4.2, 0.6, 4.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Glowing Neon Edge Trim */}
          <mesh position={[0, 0.3, 2.12]}>
            <boxGeometry args={[4.2, 0.15, 0.05]} />
            <meshBasicMaterial color={color || '#00e5ff'} />
          </mesh>
          <mesh position={[0, 0.3, -2.12]}>
            <boxGeometry args={[4.2, 0.15, 0.05]} />
            <meshBasicMaterial color={color || '#00e5ff'} />
          </mesh>
        </group>
      );

    case 'enemy':
      return (
        <group ref={groupRef} position={[0, 1.8, 0]}>
          {/* Cyber Surveillance Drone Core */}
          <mesh castShadow>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Glowing Red Sensor Visor */}
          <mesh position={[0, 0.1, 0.6]}>
            <boxGeometry args={[0.8, 0.25, 0.2]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {/* Rotor Ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.08, 8, 24]} />
            <meshStandardMaterial
              color={color || '#06b6d4'}
              emissive={color || '#0891b2'}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      );

    case 'house':
      return (
        <group position={[0, 0, 0]}>
          {/* Main Tower Body */}
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 7, 3.2]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Glowing Window Strips */}
          <mesh position={[0, 3.5, 1.62]}>
            <planeGeometry args={[2.6, 5.8]} />
            <meshBasicMaterial color={color || '#00e5ff'} wireframe transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 3.5, -1.62]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.6, 5.8]} />
            <meshBasicMaterial color={color || '#00e5ff'} wireframe transparent opacity={0.6} />
          </mesh>
          {/* Upper Setback Tier */}
          <mesh position={[0, 7.8, 0]} castShadow>
            <boxGeometry args={[2.2, 2.2, 2.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Communications Mast & Spire */}
          <mesh position={[0, 9.5, 0]}>
            <cylinderGeometry args={[0.06, 0.12, 2.4, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0, 10.7, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ff0055" />
          </mesh>
        </group>
      );

    case 'mushroom':
      return (
        <group position={[0, 0, 0]}>
          {/* Curved bioluminescent stalk */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.38, 2.4, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} emissive="#38bdf8" emissiveIntensity={0.2} />
          </mesh>
          {/* Giant bioluminescent umbrella cap */}
          <mesh position={[0, 2.4, 0]} castShadow>
            <sphereGeometry args={[1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial
              color={color || '#ec4899'}
              emissive={color || '#db2777'}
              emissiveIntensity={0.9}
              roughness={0.2}
            />
          </mesh>
          {/* Glowing spots on cap */}
          <mesh position={[0.7, 2.8, 0.7]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.6, 2.9, 0.6]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.1, 3.1, -0.8]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      );

    case 'lamp':
      return (
        <group position={[0, 0, 0]}>
          {/* Industrial metal street pole */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 4.4, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Holographic Glowing Light Tube */}
          <mesh position={[0, 4.2, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 1.4, 12]} />
            <meshStandardMaterial
              color={color || '#00e5ff'}
              emissive={color || '#00b0ff'}
              emissiveIntensity={1.8}
            />
          </mesh>
          <pointLight position={[0, 4.2, 0]} color={color || '#00e5ff'} intensity={3} distance={12} />
        </group>
      );

    case 'cloud':
      return (
        <group ref={groupRef} position={[0, 2, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[1.2, 10, 10]} />
            <meshStandardMaterial color="#eceff1" opacity={0.85} transparent roughness={0.9} />
          </mesh>
          <mesh position={[1.0, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.9, 10, 10]} />
            <meshStandardMaterial color="#eceff1" opacity={0.85} transparent roughness={0.9} />
          </mesh>
          <mesh position={[-0.9, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.8, 10, 10]} />
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

export interface AssetDefinition {
  type: AssetType;
  name: string;
  collider: 'ball' | 'cuboid' | 'hull';
  defaultPhysics: PhysicsType;
  defaultInteraction: InteractionType;
  defaultScale: { x: number; y: number; z: number };
  description: string;
}

export const ASSET_DEFINITIONS: Record<AssetType, AssetDefinition> = {
  tree: {
    type: 'tree',
    name: 'Conifer Tree',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Trunk and double canopy foliage cones with castShadow',
  },
  rock: {
    type: 'rock',
    name: 'Granite Boulder',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Polyhedral dodecahedron rock geometry',
  },
  house: {
    type: 'house',
    name: 'Alpine Cottage',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Timber box base with 45° pitched pyramidal roof',
  },
  portal: {
    type: 'portal',
    name: 'Mystic Gateway',
    collider: 'cuboid',
    defaultPhysics: 'sensor',
    defaultInteraction: 'portal',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Emissive rotating torus ring with swirl disc',
  },
  crystal: {
    type: 'crystal',
    name: 'Aether Crystal',
    collider: 'ball',
    defaultPhysics: 'sensor',
    defaultInteraction: 'collectible',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Floating octahedron crystal with cyan emissive glow',
  },
  enemy: {
    type: 'enemy',
    name: 'Hazard Drone',
    collider: 'ball',
    defaultPhysics: 'dynamic',
    defaultInteraction: 'hazard',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Icosahedron hazard bot with crimson emissive core',
  },
  platform: {
    type: 'platform',
    name: 'Floating Deck',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Flattened 3x0.5x3 box platform',
  },
  mushroom: {
    type: 'mushroom',
    name: 'Giant Fungi',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Cylindrical stipe with hemisphere fungal cap',
  },
  lamp: {
    type: 'lamp',
    name: 'Street Lantern',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Iron lamppost with dynamic point light and emissive bulb',
  },
  cloud: {
    type: 'cloud',
    name: 'Cumulus Formation',
    collider: 'cuboid',
    defaultPhysics: 'fixed',
    defaultInteraction: 'none',
    defaultScale: { x: 1, y: 1, z: 1 },
    description: 'Cluster of translucent spheres with float animation',
  },
};

/**
 * Central Asset Registry satisfying Part 14 interface requirements.
 */
export const AssetRegistry = {
  getAssetRenderer: (assetType: AssetType): React.FC<{ color?: string }> => {
    return ({ color }: { color?: string }) => <ProceduralAsset asset={assetType} color={color} />;
  },
  getAssetCollider: (assetType: AssetType): 'ball' | 'cuboid' | 'hull' => {
    return ASSET_DEFINITIONS[assetType]?.collider ?? 'cuboid';
  },
  getDefaultPhysics: (assetType: AssetType): PhysicsType => {
    return ASSET_DEFINITIONS[assetType]?.defaultPhysics ?? 'fixed';
  },
  getDefaultInteraction: (assetType: AssetType): InteractionType => {
    return ASSET_DEFINITIONS[assetType]?.defaultInteraction ?? 'none';
  },
  getDefaultScale: (assetType: AssetType): { x: number; y: number; z: number } => {
    return ASSET_DEFINITIONS[assetType]?.defaultScale ?? { x: 1, y: 1, z: 1 };
  },
  getDefinition: (assetType: AssetType): AssetDefinition | undefined => {
    return ASSET_DEFINITIONS[assetType];
  },
  getAllTypes: (): AssetType[] => {
    return Object.keys(ASSET_DEFINITIONS) as AssetType[];
  },
};
