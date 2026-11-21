'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { PenModel, FINISHES, type PenState } from '@/components/three/PenModel';
import { StudioLighting } from '@/components/three/StudioLighting';
import { NibMark } from '@/components/brand/Logo';

type Props = { finish: string; tilt: number; spin: number; cap: number; scale: number; x: number; y: number; warm: boolean; og: boolean };

export function StudioRender({ finish, tilt, spin, cap, scale, x, y, warm, og }: Props) {
  const state = useRef<PenState>({ capOff: cap, explode: 0 });
  const [ready, setReady] = useState(false);
  const f = FINISHES[finish] ?? FINISHES.midnight;
  return (
    <div className="fixed inset-0 overflow-hidden bg-ink" data-ready={ready ? '1' : '0'} id="studio">
      <div className={`absolute inset-0 ${warm ? 'bg-[radial-gradient(60%_60%_at_55%_45%,rgba(220,199,161,0.3),transparent_72%)]' : 'bg-[radial-gradient(60%_60%_at_55%_45%,rgba(255,255,255,0.17),transparent_72%)]'}`} />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
      <Canvas
        dpr={2}
        camera={{ position: [0, 0, 7.2], fov: 30 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.35;
          setTimeout(() => setReady(true), 1500);
        }}
      >
        <StudioLighting animate={false} warm={warm ? 2 : 1} />
        <group position={[x, y, 0]} rotation={[0.2, 0, tilt]} scale={scale}>
          <group rotation={[0, spin, 0]}>
            {/* centre of the assembly: top of end cap (1.22) to cap finial (-2.32 - cap) */}
            <group position={[0, 0.55 + cap * 0.5, 0]}>
              <PenModel finish={f} state={state} />
            </group>
          </group>
        </group>
        <Sparkles count={40} scale={[9, 6, 4]} size={2} speed={0} opacity={0.45} color="#f3e3c3" />
      </Canvas>
      {og && (
        <div className="absolute inset-y-0 left-0 flex w-[62%] flex-col justify-center pl-16">
          <div className="flex items-center gap-3">
            <NibMark className="h-10 w-10" />
            <span className="whitespace-nowrap text-base font-medium tracking-[0.42em] text-paper">PENS OUTLET</span>
          </div>
          <p className="display mt-8 w-max whitespace-nowrap text-[48px] text-metal">The art of the</p>
          <p className="mt-2 font-serif text-[58px] italic leading-none text-champagne">signature.</p>
        </div>
      )}
    </div>
  );
}
