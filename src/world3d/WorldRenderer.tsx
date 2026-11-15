import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Sparkles } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import type { WorldSpec } from '../shared/schemas/worldSchema';
import { ModelInstance } from './ModelInstance';
import { PlayerController } from './PlayerController';
import { CinematicCameraController } from './CinematicCameraController';
import { ThematicBackdrop } from './ThematicBackdrop';
import { AtmosphericWeatherEffect } from './AtmosphericWeatherEffect';
import { AnimatedChaseVignette } from './AnimatedChaseVignette';
import { useDreamStore } from '../store/useDreamStore';
import { eventBus } from '../shared/events/eventBus';

interface BurstItem {
  id: string;
  x: number;
  y: number;
  z: number;
  createdAt: number;
}

const SingleBurstEffect: React.FC<{ burst: BurstItem }> = ({ burst }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      const elapsed = (Date.now() - burst.createdAt) / 800;
      const progress = Math.min(1, Math.max(0, elapsed));
      const scale = 1 + progress * 2.8;
      groupRef.current.scale.set(scale, scale, scale);
      groupRef.current.position.y = burst.y + 0.8 + progress * 0.8;
      groupRef.current.rotation.y += 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[burst.x, burst.y + 0.8, burst.z]}>
      <Sparkles count={24} scale={2} size={5} speed={1.5} color="#00e5ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.5, 16]} />
        <meshBasicMaterial
          color="#64ffda"
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

const CollectionBurstManager: React.FC = () => {
  const [bursts, setBursts] = useState<BurstItem[]>([]);

  useEffect(() => {
    const unsub = eventBus.subscribe('item-collected', (event) => {
      const pos = event.payload?.position as
        | { x: number; y: number; z: number }
        | undefined;
      if (pos) {
        const item: BurstItem = {
          id: `burst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          x: pos.x,
          y: pos.y,
          z: pos.z,
          createdAt: Date.now(),
        };
        setBursts((prev) => [...prev, item]);
        setTimeout(() => {
          setBursts((prev) => prev.filter((b) => b.id !== item.id));
        }, 850);
      }
    });

    return () => unsub();
  }, []);

  return (
    <>
      {bursts.map((b) => (
        <SingleBurstEffect key={b.id} burst={b} />
      ))}
    </>
  );
};

interface WorldRendererProps {
  world: WorldSpec;
  worldRevision: number;
}

export const WorldRenderer: React.FC<WorldRendererProps> = ({ world, worldRevision }) => {
  const notifySceneReady = useDreamStore((state) => state.notifySceneReady);
  const notifyPhysicsReady = useDreamStore((state) => state.notifyPhysicsReady);

  useEffect(() => {
    // Handshake: Signal that scene elements and physics bodies are hydrated for this revision
    const timer = setTimeout(() => {
      notifySceneReady(worldRevision);
      notifyPhysicsReady(worldRevision);
    }, 150);

    return () => clearTimeout(timer);
  }, [worldRevision, notifySceneReady, notifyPhysicsReady]);

  const promptLower = (world.title + ' ' + world.description).toLowerCase();
  const isChaseScene =
    promptLower.includes('dog') ||
    promptLower.includes('boy') ||
    promptLower.includes('chase') ||
    promptLower.includes('puppy') ||
    promptLower.includes('pet');
  const chaseMode =
    promptLower.includes('boy chasing dog') ||
    promptLower.includes('boy chase dog') ||
    promptLower.includes('boy chases dog') ||
    promptLower.includes('boy after dog')
      ? 'boy_chases_dog'
      : 'dog_chases_boy';

  const hasSparkles =
    !isChaseScene &&
    (world.biome === 'enchanted_forest' ||
      world.biome === 'crystal_cave' ||
      world.biome === 'cosmic_void' ||
      world.mood === 'dream' ||
      world.mood === 'surreal');

  return (
    <>
      {/* Background & Volumetric Atmosphere */}
      <color attach="background" args={[world.environment.skyColor]} />
      <fog
        attach="fog"
        args={[
          world.environment.fogColor,
          8,
          Math.max(25, 65 / (world.environment.fogDensity * 20 + 1)),
        ]}
      />

      {/* Lighting Rig */}
      <ambientLight intensity={world.lighting.ambientIntensity} />
      <directionalLight
        position={[15, 25, 12]}
        intensity={world.lighting.directionalIntensity}
        color={world.lighting.directionalColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Sky Simulation */}
      <Sky
        sunPosition={
          world.lighting.directionalIntensity > 0.3
            ? [15, 25, 12]
            : [0, -10, 0]
        }
        turbidity={world.weather.type === 'fog' ? 8 : 4}
        rayleigh={world.mood === 'doom' ? 3 : 1}
      />

      {/* Atmospheric Shimmer / Particles */}
      {hasSparkles && (
        <Sparkles
          count={60}
          scale={25}
          size={3}
          speed={0.4}
          color={world.lighting.directionalColor}
        />
      )}

      {/* Atmospheric Weather Particles (Rain, Snow, Storm) */}
      <AtmosphericWeatherEffect
        weatherType={world.weather.type}
        color={world.lighting.directionalColor}
      />

      {/* Thematic Environmental Backdrop (Skyscrapers, Ringed Planets, Floating Islands) */}
      <ThematicBackdrop
        biome={world.biome}
        mood={world.mood}
        accentColor={world.lighting.directionalColor}
      />

      {/* Static Ground Collider */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[120, 1, 120]} />
          <meshStandardMaterial
            color={world.environment.groundColor}
            roughness={world.biome === 'dark_castle' ? 0.25 : 0.8}
            metalness={world.biome === 'dark_castle' ? 0.75 : 0.1}
          />
        </mesh>
      </RigidBody>

      {/* World Boundary Colliders (Invisible walls preventing escape beyond [-50, 50]) */}
      <RigidBody type="fixed">
        <mesh position={[0, 10, 50]}>
          <boxGeometry args={[100, 20, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <mesh position={[0, 10, -50]}>
          <boxGeometry args={[100, 20, 1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <mesh position={[50, 10, 0]}>
          <boxGeometry args={[1, 20, 100]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <mesh position={[-50, 10, 0]}>
          <boxGeometry args={[1, 20, 100]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {/* Interactive Crystal Collection Particle Bursts */}
      <CollectionBurstManager />

      {/* Animated Dog & Boy Chase Vignette */}
      <AnimatedChaseVignette active={isChaseScene} mode={chaseMode} />

      {/* Instanced World Entities */}
      {world.entities.map((entity) => (
        <ModelInstance key={entity.id} entity={entity} />
      ))}

      {/* 10-Second Cinematic Drone Tour Controller */}
      <CinematicCameraController />

      {/* Player Character Controller */}
      <PlayerController spawnPoint={world.spawnPoint} />
    </>
  );
};
