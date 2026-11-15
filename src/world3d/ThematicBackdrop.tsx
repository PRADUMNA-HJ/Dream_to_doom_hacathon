import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BiomeType, GameMood } from '../shared/schemas/worldSchema';

interface ThematicBackdropProps {
  biome: BiomeType;
  mood: GameMood;
  accentColor: string;
}

// 1. Cyberpunk High-Rise City Skyline Backdrop
const CyberpunkSkyline: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const vehicleRef1 = useRef<THREE.Group>(null);
  const vehicleRef2 = useRef<THREE.Group>(null);
  const vehicleRef3 = useRef<THREE.Group>(null);

  // Animate flying spinner vehicles zooming across the futuristic metropolis
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (vehicleRef1.current) {
      vehicleRef1.current.position.x = ((time * 7) % 100) - 50;
      vehicleRef1.current.position.y = 14 + Math.sin(time * 2) * 0.6;
    }
    if (vehicleRef2.current) {
      vehicleRef2.current.position.x = 50 - ((time * 9) % 100);
      vehicleRef2.current.position.y = 20 + Math.cos(time * 1.6) * 0.8;
    }
    if (vehicleRef3.current) {
      vehicleRef3.current.position.z = ((time * 6) % 90) - 55;
      vehicleRef3.current.position.y = 16 + Math.sin(time * 1.8) * 0.5;
    }
  });

  // Perimeter skyscrapers with varied heights, widths, and neon window matrices
  const buildings = [
    { x: -36, z: -38, w: 10, h: 32, d: 9, col: '#030712', winCol: '#00e5ff' },
    { x: -22, z: -42, w: 8, h: 42, d: 8, col: '#020617', winCol: '#e040fb' },
    { x: -7, z: -45, w: 11, h: 36, d: 9, col: '#0f172a', winCol: '#ffd600' },
    { x: 12, z: -42, w: 9, h: 30, d: 8, col: '#030712', winCol: '#00e5ff' },
    { x: 28, z: -38, w: 10, h: 40, d: 10, col: '#020617', winCol: '#ff4081' },
    { x: 42, z: -25, w: 8, h: 33, d: 8, col: '#0f172a', winCol: '#00e5ff' },
    { x: 44, z: -6, w: 9, h: 38, d: 9, col: '#030712', winCol: '#e040fb' },
    { x: 40, z: 14, w: 10, h: 29, d: 8, col: '#020617', winCol: '#76ff03' },
    { x: 26, z: 32, w: 9, h: 34, d: 8, col: '#0f172a', winCol: '#00e5ff' },
    { x: -8, z: 36, w: 10, h: 31, d: 9, col: '#030712', winCol: '#ffd600' },
    { x: -28, z: 30, w: 8, h: 28, d: 8, col: '#020617', winCol: '#ff4081' },
    { x: -42, z: 12, w: 9, h: 35, d: 8, col: '#0f172a', winCol: '#00e5ff' },
    { x: -44, z: -14, w: 8, h: 37, d: 9, col: '#030712', winCol: '#e040fb' },
  ];

  return (
    <group>
      {/* Perimeter Skyscrapers with Illuminated Window Matrices */}
      {buildings.map((b, idx) => (
        <group key={idx} position={[b.x, b.h / 2 - 1, b.z]}>
          {/* Main Tower Mass */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.col} roughness={0.3} metalness={0.85} />
          </mesh>

          {/* Glowing Window Grid Layer */}
          <mesh position={[0, 0, b.d / 2 + 0.05]}>
            <planeGeometry args={[b.w * 0.88, b.h * 0.82]} />
            <meshBasicMaterial
              color={b.winCol}
              wireframe
              transparent
              opacity={0.45}
            />
          </mesh>

          {/* Roof Communications Mast & Red Warning Beacon */}
          <mesh position={[0, b.h / 2 + 2.0, 0]}>
            <cylinderGeometry args={[0.08, 0.16, 4.0, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0, b.h / 2 + 4.1, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}

      {/* Rooftop Helipad Decals / Glowing Perimeter Rings on Main Floor */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[8.5, 9.0, 36]} />
        <meshBasicMaterial color={accentColor || '#00e5ff'} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.2, 4.5, 36]} />
        <meshBasicMaterial color="#e040fb" />
      </mesh>

      {/* Rooftop Edge Safety Barrier Railings */}
      {[-24, 24].map((zPos, idx) => (
        <group key={`rail-z-${idx}`} position={[0, 0.7, zPos]}>
          <mesh>
            <boxGeometry args={[48, 0.08, 0.08]} />
            <meshBasicMaterial color={accentColor || '#00e5ff'} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[48, 0.6, 0.05]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
          </mesh>
        </group>
      ))}
      {[-24, 24].map((xPos, idx) => (
        <group key={`rail-x-${idx}`} position={[xPos, 0.7, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[48, 0.08, 0.08]} />
            <meshBasicMaterial color={accentColor || '#00e5ff'} />
          </mesh>
          <mesh position={[0, -0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[48, 0.6, 0.05]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Flying Spinner Vehicle 1 */}
      <group ref={vehicleRef1} position={[0, 14, -28]}>
        <mesh castShadow>
          <boxGeometry args={[3.0, 0.7, 1.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.6, 0, 0]}>
          <boxGeometry args={[0.2, 0.35, 1.0]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <mesh position={[-1.7, 0, 0]}>
          <boxGeometry args={[0.8, 0.25, 0.9]} />
          <meshBasicMaterial color="#ff0055" />
        </mesh>
      </group>

      {/* Flying Spinner Vehicle 2 */}
      <group ref={vehicleRef2} position={[0, 20, -35]}>
        <mesh castShadow>
          <boxGeometry args={[3.4, 0.8, 1.5]} />
          <meshStandardMaterial color="#1e1b4b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-1.8, 0, 0]}>
          <boxGeometry args={[0.2, 0.35, 1.1]} />
          <meshBasicMaterial color="#ffd600" />
        </mesh>
        <mesh position={[1.8, 0, 0]}>
          <boxGeometry args={[0.9, 0.25, 1.0]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
      </group>

      {/* Flying Spinner Vehicle 3 (Cross trajectory) */}
      <group ref={vehicleRef3} position={[-20, 16, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.8, 0.65, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[0.2, 0.3, 0.9]} />
          <meshBasicMaterial color="#76ff03" />
        </mesh>
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.7, 0.2, 0.8]} />
          <meshBasicMaterial color="#d500f9" />
        </mesh>
      </group>
    </group>
  );
};

// 2. Cosmic Space & Nebula Backdrop (Giant Ringed Planet & Floating Asteroids)
const CosmicSpaceBackdrop: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const planetRef = useRef<THREE.Group>(null);
  const asteroidsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (planetRef.current) {
      planetRef.current.rotation.y = time * 0.04;
    }
    if (asteroidsRef.current) {
      asteroidsRef.current.rotation.y = time * 0.015;
    }
  });

  const asteroids = [
    { x: -30, y: 15, z: -35, s: 4.2 },
    { x: 32, y: 19, z: -38, s: 4.8 },
    { x: -20, y: 24, z: -26, s: 3.2 },
    { x: 24, y: 11, z: -30, s: 3.5 },
    { x: 0, y: 28, z: -44, s: 5.5 },
    { x: -35, y: 8, z: -15, s: 3.8 },
    { x: 34, y: 14, z: -10, s: 4.0 },
  ];

  return (
    <group>
      {/* Giant Ringed Celestial Planet in the Sky */}
      <group ref={planetRef} position={[26, 26, -50]} rotation={[0.4, 0.2, -0.3]}>
        <mesh>
          <sphereGeometry args={[11, 32, 32]} />
          <meshStandardMaterial
            color="#2e1065"
            emissive="#3b0764"
            emissiveIntensity={0.5}
            roughness={0.6}
          />
        </mesh>
        {/* Planetary Dust Rings */}
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[14, 22, 48]} />
          <meshBasicMaterial
            color={accentColor || '#d500f9'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* Floating Asteroids in Zero Gravity */}
      <group ref={asteroidsRef}>
        {asteroids.map((ast, idx) => (
          <mesh key={idx} position={[ast.x, ast.y, ast.z]}>
            <dodecahedronGeometry args={[ast.s, 0]} />
            <meshStandardMaterial color="#334155" roughness={0.9} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// 3. Floating Islands Sky Backdrop (Inverted Mountain Peaks & Floating Rocks)
const FloatingIslandsBackdrop: React.FC = () => {
  const islands = [
    { x: -32, y: -4, z: -32, r: 9, h: 12 },
    { x: 34, y: -2, z: -34, r: 10, h: 14 },
    { x: 0, y: -8, z: -44, r: 13, h: 16 },
    { x: -26, y: 4, z: 24, r: 8, h: 10 },
    { x: 28, y: 6, z: 22, r: 8, h: 11 },
  ];

  return (
    <group>
      {islands.map((isl, idx) => (
        <group key={idx} position={[isl.x, isl.y, isl.z]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[isl.r, isl.h, 7]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[isl.r * 0.95, 12]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// 4. Enchanted Forest Backdrop (Colossal Glowing Mushroom Trees on Perimeter)
const EnchantedForestBackdrop: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const forestItems = [
    { x: -30, z: -30, h: 14, capR: 5.5, col: '#ec4899' },
    { x: -16, z: -38, h: 18, capR: 6.8, col: '#10b981' },
    { x: 6, z: -40, h: 16, capR: 6.0, col: '#38bdf8' },
    { x: 25, z: -32, h: 15, capR: 5.8, col: '#ec4899' },
    { x: 34, z: -14, h: 17, capR: 6.2, col: '#a855f7' },
    { x: -34, z: -12, h: 16, capR: 6.0, col: '#34d399' },
  ];

  return (
    <group>
      {forestItems.map((item, idx) => (
        <group key={idx} position={[item.x, 0, item.z]}>
          {/* Towering Stalk */}
          <mesh position={[0, item.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.7, 1.2, item.h, 8]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.4} emissive={accentColor} emissiveIntensity={0.2} />
          </mesh>
          {/* Giant Bioluminescent Cap */}
          <mesh position={[0, item.h, 0]} castShadow>
            <sphereGeometry args={[item.capR, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial
              color={item.col}
              emissive={item.col}
              emissiveIntensity={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const ThematicBackdrop: React.FC<ThematicBackdropProps> = ({ biome, mood, accentColor }) => {
  if (biome === 'dark_castle') {
    return <CyberpunkSkyline accentColor={accentColor} />;
  }

  if (biome === 'cosmic_void' || mood === 'surreal') {
    return <CosmicSpaceBackdrop accentColor={accentColor} />;
  }

  if (biome === 'floating_islands') {
    return <FloatingIslandsBackdrop />;
  }

  if (biome === 'enchanted_forest' || biome === 'crystal_cave') {
    return <EnchantedForestBackdrop accentColor={accentColor} />;
  }

  return null;
};
