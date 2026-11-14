import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, OrbitControls } from '@react-three/drei';
import { useDreamStore } from '../store/useDreamStore';
import { WorldRenderer } from './WorldRenderer';

export const SceneContainer: React.FC = () => {
  const world = useDreamStore((state) => state.world);
  const worldRevision = useDreamStore((state) => state.worldRevision);
  const isGameStarted = useDreamStore((state) => state.isGameStarted);

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
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 15, 10]} intensity={1.0} color="#818cf8" />
                <Sky sunPosition={[0, -10, 0]} />
                <mesh position={[0, -0.5, 0]}>
                  <boxGeometry args={[60, 1, 60]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
                {!isGameStarted && <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} />}
              </>
            )}
          </Physics>
        </Suspense>
      </Canvas>
    </div>
  );
};
