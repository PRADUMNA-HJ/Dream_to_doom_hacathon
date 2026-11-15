import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WeatherType } from '../shared/schemas/worldSchema';

interface AtmosphericWeatherEffectProps {
  weatherType: WeatherType;
  color?: string;
}

/**
 * High-performance procedural atmospheric weather particle system.
 * Renders high-speed vertical neon rain streaks or gentle snowflakes.
 */
export const AtmosphericWeatherEffect: React.FC<AtmosphericWeatherEffectProps> = ({
  weatherType,
  color,
}) => {
  const rainCount = 450;
  const snowCount = 280;

  const pointsRef = useRef<THREE.Points>(null);

  // Rain particle positions and velocity buffers
  const { positions, velocities } = useMemo(() => {
    const count = weatherType === 'rain' ? rainCount : snowCount;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60; // X spread: -30 to 30
      pos[i * 3 + 1] = Math.random() * 30 + 1; // Y height: 1 to 31
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 5; // Z depth: -35 to 25
      vel[i] = weatherType === 'snow' ? 1.5 + Math.random() * 2 : 18 + Math.random() * 12; // Fall speed
    }

    return { positions: pos, velocities: vel };
  }, [weatherType]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    if (!posAttr) return;

    const count = weatherType === 'rain' ? rainCount : snowCount;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idxY = i * 3 + 1;
      const speed = velocities[i];
      array[idxY] -= speed * delta;

      // Subtle horizontal drift for wind
      if (weatherType === 'rain') {
        array[i * 3] += 1.2 * delta; // slight wind push
      } else {
        array[i * 3] += Math.sin(state.clock.getElapsedTime() + i) * 0.4 * delta;
      }

      // Recycle particles when they hit the floor
      if (array[idxY] < 0.2) {
        array[idxY] = 28 + Math.random() * 4;
        array[i * 3] = (Math.random() - 0.5) * 60;
        array[i * 3 + 2] = (Math.random() - 0.5) * 60 - 5;
      }
    }

    posAttr.needsUpdate = true;
  });

  if (weatherType === 'clear' || weatherType === 'fog') {
    return null;
  }

  const particleColor = weatherType === 'rain' ? color || '#00e5ff' : '#f8fafc';

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={weatherType === 'snow' ? 0.25 : 0.18}
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
