import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { eventBus } from '../shared/events/eventBus';
import { useDreamStore } from '../store/useDreamStore';

interface PlayerControllerProps {
  spawnPoint: { x: number; y: number; z: number };
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ spawnPoint }) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const avatarGroupRef = useRef<THREE.Group>(null);
  const currentHeading = useRef<number>(0);
  const { camera } = useThree();
  const [isWarping, setIsWarping] = useState(false);

  const lifecyclePhase = useDreamStore((state) => state.lifecyclePhase);
  const isPaused = useDreamStore((state) => state.isPaused);
  const playerHealth = useDreamStore((state) => state.playerHealth);
  const viewMode = useDreamStore((state) => state.viewMode);

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

      // Prevent page scrolling when Space is pressed for gameplay jump
      if (e.code === 'Space') {
        e.preventDefault();
      }

      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleBlur = () => {
      // Clear key state when browser loses focus to prevent stuck movement
      keys.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Subscribe to portal teleportation events
    const unsubPortal = eventBus.subscribe('portal-entered', (event) => {
      const dest = event.payload?.destination as
        | { x: number; y: number; z: number }
        | undefined;
      if (dest && rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation({ x: dest.x, y: dest.y, z: dest.z }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        setIsWarping(true);
        setTimeout(() => setIsWarping(false), 900);
      }
    });

    // Subscribe to restart game events for instant player respawn
    const unsubRestart = eventBus.subscribe('game-started', (event) => {
      if (event.payload?.action === 'restart' && rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(
          { x: spawnPoint.x, y: spawnPoint.y + 1, z: spawnPoint.z },
          true
        );
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      unsubPortal();
      unsubRestart();
    };
  }, [spawnPoint]);

  useFrame((state) => {
    if (!rigidBodyRef.current) return;

    // Disabled movement during loading, pause, or death
    const isPlayable =
      (lifecyclePhase === 'ready' || lifecyclePhase === 'playing') &&
      !isPaused &&
      playerHealth > 0;

    const linvel = rigidBodyRef.current.linvel();
    const translation = rigidBodyRef.current.translation();

    // Boundary Fallback: prevent infinite falling if player escapes bounds
    if (translation.y < -10) {
      rigidBodyRef.current.setTranslation(
        { x: spawnPoint.x, y: spawnPoint.y + 1, z: spawnPoint.z },
        true
      );
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    if (!isPlayable || viewMode === 'cinematic') {
      // Retain vertical gravity velocity but zero out horizontal velocity in cinematic or non-playable mode
      rigidBodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);

      // Subtle idle breathing animation for character in cinematic mode
      if (avatarGroupRef.current && viewMode === 'cinematic') {
        const time = state.clock.getElapsedTime();
        avatarGroupRef.current.position.y = Math.sin(time * 2.0) * 0.03;
      }
      return;
    }

    // Sprint support: Shift key increases velocity
    const isSprinting = Boolean(keys.current['ShiftLeft'] || keys.current['ShiftRight']);
    const speed = isSprinting ? 10.5 : 7.0;
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

    // Character Orientation: face the direction of movement
    if (avatarGroupRef.current && (moveX !== 0 || moveZ !== 0)) {
      const targetAngle = Math.atan2(moveX, moveZ);
      currentHeading.current = THREE.MathUtils.lerp(
        currentHeading.current,
        targetAngle,
        0.2
      );
      avatarGroupRef.current.rotation.y = currentHeading.current;
    }

    // Character Stride / Hover Bobbing Animation
    if (avatarGroupRef.current) {
      const time = state.clock.getElapsedTime();
      const isMoving = moveX !== 0 || moveZ !== 0;
      const bob = isMoving ? Math.sin(time * 12) * 0.08 : Math.sin(time * 2.5) * 0.02;
      avatarGroupRef.current.position.y = bob;
    }

    // Jump handling (only if grounded: vertical velocity near 0)
    const isGrounded = Math.abs(linvel.y) < 0.15;
    if (keys.current['Space'] && isGrounded) {
      rigidBodyRef.current.applyImpulse({ x: 0, y: 8.0, z: 0 }, true);
      eventBus.publish({ type: 'player-jump' });
      keys.current['Space'] = false; // Prevent repeat jump in single keydown
    }

    // Smooth third-person camera follow (only in Interactive mode; Cinematic mode uses CinematicCameraController)
    if (viewMode === 'interactive') {
      const targetCameraPos = new THREE.Vector3(
        translation.x,
        translation.y + 4.2,
        translation.z + 7.5
      );
      camera.position.lerp(targetCameraPos, 0.08);
      camera.lookAt(translation.x, translation.y + 1.2, translation.z);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={[spawnPoint.x, spawnPoint.y + 1, spawnPoint.z]}
      colliders="ball"
      enabledRotations={[false, false, false]}
      mass={1}
      friction={0.6}
    >
      {/* Player Character Avatar */}
      <group ref={avatarGroupRef}>
        {/* Glowing Visor / Helmet */}
        <mesh position={[0, 0.95, 0.05]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color="#00e5ff"
            emissive="#00b0ff"
            emissiveIntensity={1.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Armored Cyber Torso */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.26, 0.45, 4, 8]} />
          <meshStandardMaterial color="#1a237e" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Back Power Core / Jetpack */}
        <mesh position={[0, 0.5, -0.22]} castShadow>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          <meshStandardMaterial
            color="#4a148c"
            emissive="#d500f9"
            emissiveIntensity={0.8}
            metalness={0.7}
          />
        </mesh>

        {/* Thruster Rings / Hover Feet */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <torusGeometry args={[0.22, 0.04, 8, 16]} />
          <meshStandardMaterial
            color="#ffab00"
            emissive="#ff6d00"
            emissiveIntensity={0.9}
          />
        </mesh>

        {/* Teleport / Warp Energy Shield Aura */}
        {isWarping && (
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[1.2, 16, 16]} />
            <meshStandardMaterial
              color="#e040fb"
              emissive="#d500f9"
              emissiveIntensity={2.0}
              transparent
              opacity={0.6}
              wireframe
            />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
};
