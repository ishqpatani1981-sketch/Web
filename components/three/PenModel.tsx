'use client';

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';

export type PenFinish = {
  body: string;
  trim: string;
  nib: string;
  /** 0 = mirror lacquer, higher = satin */
  bodyRoughness?: number;
  bodyMetalness?: number;
};

export const FINISHES: Record<string, PenFinish> = {
  midnight: { body: '#0a0a0c', trim: '#dcdee3', nib: '#d9b77e' },
  burgundy: { body: '#4a0c18', trim: '#d6b57c', nib: '#d9b77e' },
  titanium: { body: '#7d8189', trim: '#e4e6ea', nib: '#d9b77e', bodyRoughness: 0.32, bodyMetalness: 0.9 },
  obsidian: { body: '#050506', trim: '#d39a86', nib: '#d9a58f' },
  champagne: { body: '#b8955a', trim: '#e7e9ee', nib: '#e9e9ee', bodyRoughness: 0.24, bodyMetalness: 1 },
  pearl: { body: '#d7d6d1', trim: '#dcdee3', nib: '#d9b77e' },
  green: { body: '#0d3324', trim: '#d6b57c', nib: '#d9b77e' },
  sapphire: { body: '#0f2156', trim: '#dcdee3', nib: '#d9b77e' },
};

/** Live, mutable animation state read every frame (no React re-renders). */
export type PenState = {
  /** How far the cap is pulled off the nib along the pen axis (0 = capped). */
  capOff: number;
  /** 0 = assembled, 1 = fully exploded into components. */
  explode: number;
};

const SEG = 96;

function lathe(points: [number, number][]) {
  const g = new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    SEG,
  );
  g.computeVertexNormals();
  return g;
}

/** Smooth rounded dome profile (radius r) from y0 upward by height h. */
function dome(r: number, y0: number, h: number, steps = 14): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push([Math.max(0.0001, r * Math.cos(a)), y0 + h * Math.sin(a)]);
  }
  return pts;
}

function useGeometries() {
  return useMemo(() => {
    // Barrel: from section joint (y=-1.0) to end (y=1.1), gentle cigar taper.
    const barrel = lathe([
      [0.0001, -1.0],
      [0.148, -1.0],
      [0.156, -0.85],
      [0.162, -0.2],
      [0.161, 0.4],
      [0.154, 0.9],
      [0.146, 1.08],
      [0.14, 1.1],
      [0.0001, 1.1],
    ]);
    // End cap / finial on the barrel end.
    const endCap = lathe([[0.0001, 1.1], [0.142, 1.1], [0.145, 1.13], ...dome(0.145, 1.13, 0.09).slice(1)]);
    // Trim ring between barrel and section.
    const ring = lathe([
      [0.0001, -1.06],
      [0.15, -1.06],
      [0.156, -1.04],
      [0.156, -1.01],
      [0.15, -0.995],
      [0.0001, -0.995],
    ]);
    // Grip section: concave waist, lip at the front.
    const section = lathe([
      [0.0001, -1.62],
      [0.112, -1.62],
      [0.124, -1.6],
      [0.122, -1.52],
      [0.114, -1.38],
      [0.118, -1.2],
      [0.134, -1.08],
      [0.138, -1.06],
      [0.0001, -1.06],
    ]);
    // Cap shell (local: opening at y=0, closed end toward -y).
    const cap = lathe([
      [0.0001, -1.24],
      [0.152, -1.24],
      [0.168, -1.2],
      [0.174, -0.9],
      [0.176, -0.3],
      [0.176, -0.09],
      [0.168, -0.08],
      [0.168, 0],
      [0.15, 0],
      [0.15, -1.15],
      [0.0001, -1.15],
    ]);
    const capBand = lathe([
      [0.0001, -0.085],
      [0.17, -0.085],
      [0.181, -0.07],
      [0.181, -0.012],
      [0.172, 0],
      [0.15, 0],
      [0.15, -0.085],
    ]);
    const finial = lathe([[0.0001, -1.24], [0.15, -1.24], [0.15, -1.26], ...dome(0.15, -1.26, -0.085).slice(1)]);

    // Nib: shaped outline with breather hole, extruded thin and wrapped onto a cylinder.
    const shape = new THREE.Shape();
    shape.moveTo(-0.112, 0);
    shape.bezierCurveTo(-0.122, -0.12, -0.112, -0.24, -0.07, -0.37);
    shape.bezierCurveTo(-0.04, -0.46, -0.012, -0.52, 0, -0.56);
    shape.bezierCurveTo(0.012, -0.52, 0.04, -0.46, 0.07, -0.37);
    shape.bezierCurveTo(0.112, -0.24, 0.122, -0.12, 0.112, 0);
    shape.lineTo(-0.112, 0);
    const hole = new THREE.Path();
    hole.absarc(0, -0.2, 0.017, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const nib = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2, curveSegments: 48 });
    const pos = nib.attributes.position as THREE.BufferAttribute;
    const R = 0.118;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Taper the wrap radius towards the tip so the nib converges like a real one.
      const t = Math.min(1, Math.max(0, -y / 0.56));
      const r = R * (1 - 0.55 * t) + z;
      const theta = x / R;
      pos.setXYZ(i, r * Math.sin(theta), y, r * Math.cos(theta) - R * 0.35 * t);
    }
    nib.computeVertexNormals();

    const feed = new THREE.CylinderGeometry(0.085, 0.07, 0.42, 48, 1, false, Math.PI * 0.5, Math.PI);
    return { barrel, endCap, ring, section, cap, capBand, finial, nib, feed };
  }, []);
}

function useMaterials(f: PenFinish) {
  return useMemo(() => {
    const body = new THREE.MeshPhysicalMaterial({
      color: f.body,
      roughness: f.bodyRoughness ?? 0.14,
      metalness: f.bodyMetalness ?? 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 1.25,
    });
    const trim = new THREE.MeshPhysicalMaterial({ color: f.trim, metalness: 1, roughness: 0.13, envMapIntensity: 1.6 });
    const nib = new THREE.MeshPhysicalMaterial({ color: f.nib, metalness: 1, roughness: 0.2, envMapIntensity: 1.7, side: THREE.DoubleSide });
    const resin = new THREE.MeshPhysicalMaterial({ color: '#040405', roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 });
    const matte = new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.75 });
    return { body, trim, nib, resin, matte };
  }, [f.body, f.trim, f.nib, f.bodyRoughness, f.bodyMetalness]);
}

const damp = THREE.MathUtils.damp;

/** Anatomy label anchors (rendered as DOM by the showcase, projected from 3D each frame). */
export const PEN_LABELS = [
  { key: 'endCap', text: 'End cap', below: true },
  { key: 'barrel', text: 'Barrel', below: false },
  { key: 'ring', text: 'Trim ring', below: true },
  { key: 'section', text: 'Grip section', below: false },
  { key: 'nib', text: 'Nib', below: true },
  { key: 'cap', text: 'Cap & clip', below: false },
  { key: 'finial', text: 'Finial', below: true },
] as const;

export type PenAnchors = MutableRefObject<Record<string, THREE.Object3D | null>>;

function Anchor({ id, anchors, position }: { id: string; anchors?: PenAnchors; position: [number, number, number] }) {
  if (!anchors) return null;
  return (
    <object3D
      position={position}
      ref={(o) => {
        anchors.current[id] = o;
      }}
    />
  );
}

/**
 * A procedurally modelled fountain pen. Axis runs along Y with the nib at -Y.
 * Animation is driven through `state` (a mutable ref) for zero React overhead.
 */
export function PenModel({ finish = FINISHES.midnight, state, anchors }: { finish?: PenFinish; state: MutableRefObject<PenState>; anchors?: PenAnchors }) {
  const g = useGeometries();
  const m = useMaterials(finish);
  const cap = useRef<THREE.Group>(null);
  const clip = useRef<THREE.Group>(null);
  const endCap = useRef<THREE.Mesh>(null);
  const section = useRef<THREE.Group>(null);
  const nib = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const finial = useRef<THREE.Mesh>(null);
  const current = useRef<PenState>({ ...state.current });

  useFrame((_, dt) => {
    const c = current.current;
    const s = state.current;
    const lambda = 5;
    c.capOff = damp(c.capOff, s.capOff, lambda, dt);
    c.explode = damp(c.explode, s.explode, lambda, dt);
    const e = c.explode;
    // Exploded: the cap travels clear past the nib tip so every component is visible.
    if (cap.current) cap.current.position.y = -0.985 - c.capOff - 2.05 * e;
    if (finial.current) finial.current.position.y = -0.38 * e;
    if (clip.current) {
      clip.current.position.x = 0.34 * e;
      clip.current.rotation.z = -0.12 * e;
    }
    if (endCap.current) endCap.current.position.y = 0.42 * e;
    if (ring.current) ring.current.position.y = -0.16 * e;
    if (section.current) section.current.position.y = -0.36 * e;
    if (nib.current) nib.current.position.y = -0.62 * e;
  });

  return (
    <group>
      {/* Barrel */}
      <mesh geometry={g.barrel} material={m.body} castShadow />
      <mesh ref={endCap} geometry={g.endCap} material={m.trim}>
        <Anchor id="endCap" anchors={anchors} position={[0, 1.18, 0]} />
      </mesh>
      <mesh ref={ring} geometry={g.ring} material={m.trim}>
        <Anchor id="ring" anchors={anchors} position={[0, -1.03, 0]} />
      </mesh>
      <Anchor id="barrel" anchors={anchors} position={[0, 0.15, 0]} />

      {/* Grip section */}
      <group ref={section}>
        <mesh geometry={g.section} material={m.resin} />
        <Anchor id="section" anchors={anchors} position={[0, -1.36, 0]} />
      </group>

      {/* Nib + feed */}
      <group ref={nib}>
        <mesh geometry={g.feed} material={m.matte} position={[0, -1.82, -0.01]} />
        <mesh geometry={g.nib} material={m.nib} position={[0, -1.56, 0]} />
        <Anchor id="nib" anchors={anchors} position={[0, -1.86, 0]} />
        {/* Slit from the breather hole to the tip, following the nib's curved centreline */}
        <mesh position={[0, -1.95, 0.062]} rotation={[0.187, 0, 0]}>
          <boxGeometry args={[0.004, 0.34, 0.01]} />
          <meshBasicMaterial color="#2a2112" />
        </mesh>
      </group>

      {/* Cap (local origin = cap opening) */}
      <group ref={cap} position={[0, -0.985, 0]}>
        <mesh geometry={g.cap} material={m.body} />
        <mesh geometry={g.capBand} material={m.trim} />
        <mesh ref={finial} geometry={g.finial} material={m.trim}>
          <Anchor id="finial" anchors={anchors} position={[0, -1.3, 0]} />
        </mesh>
        <Anchor id="cap" anchors={anchors} position={[0, -0.62, 0]} />
        <group ref={clip}>
          <RoundedBox args={[0.058, 0.9, 0.032]} radius={0.014} smoothness={4} position={[0, -0.71, 0.205]} material={m.trim} />
          <mesh position={[0, -0.26, 0.205]} material={m.trim}>
            <sphereGeometry args={[0.036, 32, 32]} />
          </mesh>
          <mesh position={[0, -1.13, 0.185]} material={m.trim}>
            <boxGeometry args={[0.058, 0.06, 0.05]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
