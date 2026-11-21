'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, Sparkles } from '@react-three/drei';
import { PenModel, FINISHES, type PenState } from './PenModel';
import { StudioLighting } from './StudioLighting';

type Props = {
  /** 0 → hero at rest, 1 → hero scrolled out of view. Written by GSAP ScrollTrigger. */
  progress: MutableRefObject<number>;
  reducedMotion: boolean;
  mobile: boolean;
  onReady?: () => void;
};

function Rig({ progress, reducedMotion, mobile }: Omit<Props, 'onReady'>) {
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const state = useRef<PenState>({ capOff: reducedMotion ? 0.9 : 0.05, explode: 0 });
  const intro = useRef(reducedMotion ? 1 : 0);
  const { camera, size } = useThree();

  useEffect(() => {
    if (mobile || reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mobile, reducedMotion]);

  useFrame(({ clock }, dt) => {
    const g = tilt.current;
    const sp = spin.current;
    if (!g || !sp) return;
    const t = reducedMotion ? 0 : clock.getElapsedTime();
    const p = progress.current;
    // Cinematic intro: the pen rises into frame and the cap slides away from the nib.
    intro.current = THREE.MathUtils.damp(intro.current, 1, 1.2, dt);
    const i = intro.current;
    state.current.capOff = reducedMotion ? 1.0 : 0.02 + 0.98 * i + 0.5 * p;

    // Outer group: diagonal presentation tilt (+ pointer parallax, + scroll roll).
    const baseTilt = mobile ? -0.72 : -0.92;
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, baseTilt + p * 0.5 + pointer.current.x * 0.05, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.22 + pointer.current.y * 0.06 - p * 0.3, 3, dt);
    // Inner group: slow turn around the pen's own axis so light glides along the body.
    // Sway (rather than spin) so the gold nib mostly faces the camera; scrolling adds a full turn.
    sp.rotation.y = reducedMotion ? 0.35 : Math.sin(t * 0.32) * 0.75 + p * Math.PI * 1.2;

    const aspect = size.width / size.height;
    const targetY = (mobile ? 0.95 : 0.08) + Math.sin(t * 0.7) * 0.05 + (1 - i) * -0.5 + p * 0.7;
    g.position.y = THREE.MathUtils.damp(g.position.y, targetY, 4, dt);
    g.position.x = mobile ? 0 : Math.min(1.45, 0.62 * aspect) - p * 0.3;
    const s = (mobile ? 0.4 : 0.8) * (0.9 + 0.1 * i) * (1 - p * 0.15);
    g.scale.setScalar(s);

    // Slow camera drift around the pen.
    if (!reducedMotion) {
      camera.position.x = Math.sin(t * 0.09) * 0.5;
      camera.position.y = Math.cos(t * 0.07) * 0.2;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={tilt}>
      <group ref={spin}>
        {/* Re-centre the assembly (cap pulled off below the nib) around the pivot. */}
        <group position={[0, 1.04, 0]}>
          <PenModel finish={FINISHES.midnight} state={state} />
        </group>
      </group>
    </group>
  );
}

export default function HeroScene({ progress, reducedMotion, mobile, onReady }: Props) {
  const [dpr, setDpr] = useState<number>(mobile ? 1.25 : 1.75);
  const [active, setActive] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);

  // Stop rendering entirely when the hero is off-screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={reducedMotion ? 'demand' : active ? 'always' : 'never'}
        camera={{ position: [0, 0, 7.2], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          onReady?.();
        }}
        aria-hidden="true"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <StudioLighting animate={!reducedMotion} />
        <Rig progress={progress} reducedMotion={reducedMotion} mobile={mobile} />
        {!reducedMotion && <Sparkles count={mobile ? 28 : 70} scale={[9, 6, 4]} size={mobile ? 1.6 : 2.1} speed={0.22} opacity={0.55} color="#f3e3c3" noise={0.6} />}
      </Canvas>
    </div>
  );
}
