'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BAR_COUNT = 72;

function WaveBars() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => ({
      x: (i / BAR_COUNT - 0.5) * 14,
      z: (Math.random() - 0.5) * 3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.2,
      height: 0.25 + Math.random() * 0.55,
    }));
  }, []);

  useFrame((state) => {
    const inst = mesh.current;
    if (!inst) return;
    const t = state.clock.elapsedTime;

    seeds.forEach((s, i) => {
      const pulse = 0.35 + Math.abs(Math.sin(t * s.speed + s.phase)) * s.height;
      dummy.position.set(s.x, Math.sin(t * 0.35 + s.phase) * 0.25, s.z);
      dummy.scale.set(0.06, pulse, 0.06);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BAR_COUNT]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#7C3AED" transparent opacity={0.22} toneMapped={false} />
    </instancedMesh>
  );
}

function AccentOrbs() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <group ref={group}>
      <mesh position={[-3.5, 1.2, -2]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.12} toneMapped={false} />
      </mesh>
      <mesh position={[3.8, -0.8, -1.5]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color="#A78BFA" transparent opacity={0.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Full-screen transparent WebGL canvas — mount only via dynamic import. */
export default function HeroWebGLScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7.5], fov: 48 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <WaveBars />
      <AccentOrbs />
    </Canvas>
  );
}
