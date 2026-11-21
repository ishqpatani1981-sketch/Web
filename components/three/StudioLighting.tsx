'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';

/**
 * Product-photography lighting built from procedural light panels (no HDR download):
 * a long overhead strip, cool and warm side strips, plus a key light that slowly travels
 * across the scene so highlights glide along the metal.
 */
export function StudioLighting({ animate = true, warm = 1 }: { animate?: boolean; warm?: number }) {
  const key = useRef<THREE.DirectionalLight>(null);
  useFrame(({ clock }) => {
    if (!animate || !key.current) return;
    const t = clock.getElapsedTime();
    key.current.position.set(Math.sin(t * 0.35) * 4, 3 + Math.cos(t * 0.21) * 0.8, 3.2);
  });
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight ref={key} position={[2, 3, 3]} intensity={2.2} color="#ffffff" />
      <pointLight position={[-3, -2, 2]} intensity={6} color="#dcc7a1" distance={10} decay={2} />
      <Environment resolution={256} frames={1}>
        <group rotation={[0, 0, 0]}>
          <Lightformer form="rect" intensity={3.2} position={[0, 4.5, -1]} rotation-x={Math.PI / 2} scale={[12, 0.9, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[0, 2.5, 4]} rotation-x={Math.PI / 4} scale={[8, 0.35, 1]} />
          <Lightformer form="rect" intensity={2.2} position={[-5, 0.5, 0]} rotation-y={Math.PI / 2} scale={[10, 0.5, 1]} color="#dfe6ff" />
          <Lightformer form="rect" intensity={1.4 * warm} position={[5, -0.5, 0]} rotation-y={-Math.PI / 2} scale={[10, 1.2, 1]} color="#f1d6a6" />
          <Lightformer form="ring" intensity={0.8} position={[0, -3, -4]} scale={3} color="#ffffff" />
        </group>
      </Environment>
    </>
  );
}
