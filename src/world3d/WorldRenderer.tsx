import React, { useEffect } from 'react';
import { Sky, Sparkles } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import type { WorldSpec } from '../shared/schemas/worldSchema';
import { ModelInstance } from './ModelInstance';
import { PlayerController } from './PlayerController';
import { useDreamStore } from '../store/useDreamStore';

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

  const hasSparkles =
    world.biome === 'enchanted_forest' ||
    world.biome === 'crystal_cave' ||
    world.biome === 'cosmic_void' ||
    world.mood === 'dream' ||
    world.mood === 'surreal';

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

      {/* Static Ground Collider */}
      <RigidBody type="fixed" friction={1}>
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[120, 1, 120]} />
          <meshStandardMaterial
            color={world.environment.groundColor}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      </RigidBody>

      {/* Instanced World Entities */}
      {world.entities.map((entity) => (
        <ModelInstance key={entity.id} entity={entity} />
      ))}

      {/* Player Character Controller */}
      <PlayerController spawnPoint={world.spawnPoint} />
    </>
  );
};
