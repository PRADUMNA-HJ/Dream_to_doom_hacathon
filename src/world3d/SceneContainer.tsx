import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, OrbitControls, Sparkles } from '@react-three/drei';
import { useDreamStore } from '../store/useDreamStore';
import { WorldRenderer } from './WorldRenderer';

export const SceneContainer: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const worldRevision = useDreamStore((state) => state.worldRevision);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 select-none">
      <Canvas
        shadows
        camera={{ position: [0, 4, 9], fov: 60 }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            {world ? (
              <WorldRenderer world={world} worldRevision={worldRevision} />
            ) : (
              // Standby / Initial Ambient Scene before generation
              <>
                <color attach="background" args={['#030712']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 15, 10]} intensity={1.5} color="#818cf8" />
                <Sky sunPosition={[0, 10, 0]} turbidity={6} />
                <Sparkles count={80} scale={20} size={4} speed={0.6} color="#00e5ff" />
                <mesh position={[0, -0.5, 0]}>
                  <boxGeometry args={[60, 1, 60]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.7} />
                </mesh>
                <mesh position={[0, 2, 0]} rotation={[0.4, 0.4, 0]}>
                  <octahedronGeometry args={[1.2, 0]} />
                  <meshStandardMaterial
                    color="#00e5ff"
                    emissive="#00b0ff"
                    emissiveIntensity={1.2}
                    metalness={0.9}
                    roughness={0.1}
                  />
                </mesh>
                <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.8} />
              </>
            )}
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
};
