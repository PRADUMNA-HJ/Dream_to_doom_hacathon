import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { eventBus } from '../shared/events/eventBus';

interface PlayerControllerProps {
  spawnPoint: { x: number; y: number; z: number };
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ spawnPoint }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const speed = 7.0;
    const linvel = rigidBodyRef.current.linvel();
    let moveX = 0;
    let moveZ = 0;

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveZ -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveZ += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveX -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveX += 1;

    // Normalize diagonal movement
    if (moveX !== 0 && moveZ !== 0) {
      moveX *= 0.7071;
      moveZ *= 0.7071;
    }

    // Apply horizontal velocity
    rigidBodyRef.current.setLinvel(
      { x: moveX * speed, y: linvel.y, z: moveZ * speed },
      true
    );

    // Jump handling (only if close to ground, velocity.y ~ 0)
    if (keys.current['Space'] && Math.abs(linvel.y) < 0.1) {
      rigidBodyRef.current.applyImpulse({ x: 0, y: 7.5, z: 0 }, true);
      eventBus.publish({ type: 'player-jump' });
      keys.current['Space'] = false; // Prevent repeat jump in single keydown
    }

    // Smoothly update camera to follow player in third-person view
    const translation = rigidBodyRef.current.translation();
    const targetCameraPos = new THREE.Vector3(
      translation.x,
      translation.y + 4.5,
      translation.z + 8.0
    );
    camera.position.lerp(targetCameraPos, 0.1);
    camera.lookAt(translation.x, translation.y + 1.2, translation.z);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[spawnPoint.x, spawnPoint.y + 1, spawnPoint.z]}
      colliders="ball"
      enabledRotations={[false, false, false]}
      mass={1}
      friction={0.5}
    >
      {/* Player Character Avatar */}
      <group>
        {/* Glowing Head / Core */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00b0ff"
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
          <meshStandardMaterial color="#1a237e" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>
    </RigidBody>
  );
};
