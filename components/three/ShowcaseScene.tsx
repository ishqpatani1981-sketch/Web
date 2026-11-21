'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { PenModel, FINISHES, type PenAnchors, type PenState } from './PenModel';
import { StudioLighting } from './StudioLighting';

type LabelEls = MutableRefObject<Record<string, HTMLElement | null>>;

function Rig({ state, spin, mobile, anchors }: { state: MutableRefObject<PenState>; spin: MutableRefObject<number>; mobile: boolean; anchors: PenAnchors }) {
  const group = useRef<THREE.Group>(null);
  const centre = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // Keep the assembly centred as it expands (exploded length grows towards the nib end).
    if (centre.current) centre.current.position.y = THREE.MathUtils.damp(centre.current.position.y, 0.55 + 1.0 * state.current.explode, 5, dt);
    // Spin around the pen's own long axis as the visitor scrolls.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, 0.35 + spin.current * Math.PI * 2, 4, dt);
    const s = mobile ? 0.43 : 0.8;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x || s, s * (1 - state.current.explode * 0.12), 4, dt));
  });
  return (
    // Desktop: lay the pen horizontally (end cap right, nib left). Mobile: keep it upright.
    <group rotation={[0.1, 0, mobile ? 0 : -Math.PI / 2]} position={[mobile ? -0.1 : 0.3, mobile ? -0.72 : -0.42, 0]}>
      <group ref={group}>
        <group ref={centre} position={[0, 0.55, 0]}>
          <PenModel finish={FINISHES.burgundy} state={state} anchors={anchors} />
        </group>
      </group>
    </group>
  );
}

/** Projects the 3D anchor points to screen space and moves the DOM labels there. */
function LabelProjector({ anchors, labelEls }: { anchors: PenAnchors; labelEls: LabelEls }) {
  const { camera, size } = useThree();
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    for (const [key, obj] of Object.entries(anchors.current)) {
      const el = labelEls.current[key];
      if (!obj || !el) continue;
      obj.getWorldPosition(v.current).project(camera);
      const x = ((v.current.x + 1) / 2) * size.width;
      const y = ((1 - v.current.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
  });
  return null;
}

export default function ShowcaseScene({
  state,
  spin,
  mobile,
  reducedMotion,
  labelEls,
}: {
  state: MutableRefObject<PenState>;
  spin: MutableRefObject<number>;
  mobile: boolean;
  reducedMotion: boolean;
  labelEls: LabelEls;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const anchors = useRef<Record<string, THREE.Object3D | null>>({});
  const [active, setActive] = useState(false);
  const [dpr, setDpr] = useState(mobile ? 1.25 : 1.75);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={dpr}
        frameloop={active ? (reducedMotion ? 'demand' : 'always') : 'never'}
        camera={{ position: [0, 0, 7], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
        aria-hidden="true"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <StudioLighting animate={!reducedMotion} warm={1.4} />
        <Rig state={state} spin={spin} mobile={mobile} anchors={anchors} />
        <LabelProjector anchors={anchors} labelEls={labelEls} />
      </Canvas>
    </div>
  );
}
