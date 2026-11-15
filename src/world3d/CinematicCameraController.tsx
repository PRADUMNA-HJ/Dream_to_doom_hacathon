import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDreamStore } from '../store/useDreamStore';

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * 10-Second Cinematic Drone Tour Controller.
 * Animates a 3-act cinematic camera choreography across the generated 3D world:
 * Act 1 (0.0s - 3.2s): High aerial establishing orbit over the terrain and atmosphere.
 * Act 2 (3.2s - 6.8s): Low glide tracking through glowing trees, platforms, and crystals.
 * Act 3 (6.8s - 10.0s): Hero reveal & portal ascent toward the cosmic horizon.
 */
export const CinematicCameraController: React.FC = () => {
  const { camera } = useThree();
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 0));

  const viewMode = useDreamStore((state) => state.viewMode);
  const cinematicProgress = useDreamStore((state) => state.cinematicProgress);
  const isCinematicPlaying = useDreamStore((state) => state.isCinematicPlaying);
  const setCinematicProgress = useDreamStore((state) => state.setCinematicProgress);
  const setCinematicPlaying = useDreamStore((state) => state.setCinematicPlaying);

  useFrame((state, delta) => {
    if (viewMode !== 'cinematic') return;

    let time = cinematicProgress;

    // Advance playback timeline
    if (isCinematicPlaying) {
      time = Math.min(10.0, cinematicProgress + delta);
      setCinematicProgress(time);

      if (time >= 10.0) {
        setCinematicPlaying(false);
      }
    }

    const targetPos = new THREE.Vector3();
    const targetFocus = new THREE.Vector3();

    if (time < 3.2) {
      // --- ACT 1: Aerial Establishing Orbit (0s - 3.2s) ---
      const u = smoothstep(0, 3.2, time);
      // High sweeping curve around the perimeter
      const startX = 0;
      const startY = 16.0;
      const startZ = 24.0;

      const endX = 14.0;
      const endY = 10.0;
      const endZ = 16.0;

      targetPos.set(
        THREE.MathUtils.lerp(startX, endX, u),
        THREE.MathUtils.lerp(startY, endY, u),
        THREE.MathUtils.lerp(startZ, endZ, u)
      );

      // Focus on the center monument and ground
      targetFocus.set(0, 1.8, 0);
    } else if (time < 6.8) {
      // --- ACT 2: Low Drone Glide Through Environment (3.2s - 6.8s) ---
      const u = smoothstep(3.2, 6.8, time);
      // Sweeps low between trees and glowing crystals
      const startX = 14.0;
      const startY = 10.0;
      const startZ = 16.0;

      const midX = 4.0;
      const midY = 3.6;
      const midZ = 4.0;

      const endX = -7.0;
      const endY = 2.8;
      const endZ = -6.0;

      // Quadratic bezier curve interpolation for natural swoop
      const invU = 1 - u;
      const x = invU * invU * startX + 2 * invU * u * midX + u * u * endX;
      const y = invU * invU * startY + 2 * invU * u * midY + u * u * endY;
      const z = invU * invU * startZ + 2 * invU * u * midZ + u * u * endZ;

      targetPos.set(x, y, z);

      // Target crystal cluster and center platforms
      targetFocus.set(
        THREE.MathUtils.lerp(2, -3, u),
        THREE.MathUtils.lerp(2.2, 2.5, u),
        THREE.MathUtils.lerp(-2, -10, u)
      );
    } else {
      // --- ACT 3: Hero Reveal & Portal Ascent (6.8s - 10.0s) ---
      const u = smoothstep(6.8, 10.0, Math.min(10.0, time));
      // Sweeps past player and rises up facing the luminous portal
      const startX = -7.0;
      const startY = 2.8;
      const startZ = -6.0;

      const midX = -2.0;
      const midY = 4.5;
      const midZ = -14.0;

      const endX = 0;
      const endY = 7.5;
      const endZ = -16.0;

      const invU = 1 - u;
      const x = invU * invU * startX + 2 * invU * u * midX + u * u * endX;
      const y = invU * invU * startY + 2 * invU * u * midY + u * u * endY;
      const z = invU * invU * startZ + 2 * invU * u * midZ + u * u * endZ;

      targetPos.set(x, y, z);

      // Focus up into the portal gateway and sky horizon
      targetFocus.set(
        0,
        THREE.MathUtils.lerp(2.5, 4.8, u),
        THREE.MathUtils.lerp(-10, -26, u)
      );

      // Subtle post-completion cinematic breathing float
      if (time >= 10.0) {
        const floatTime = state.clock.getElapsedTime();
        targetPos.x += Math.sin(floatTime * 0.5) * 0.4;
        targetPos.y += Math.cos(floatTime * 0.4) * 0.2;
      }
    }

    // Smoothly apply camera transformation
    camera.position.lerp(targetPos, 0.12);
    currentLookAt.current.lerp(targetFocus, 0.12);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
