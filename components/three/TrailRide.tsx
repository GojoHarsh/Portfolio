"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BIKE_WHEEL_R, BIKE_WHEELBASE, buildMountainBike } from "./bikeModel";

/*
 * A low-poly mountain bike riding a dirt trail, rendered on demand (no idle
 * render loop): Work updates `progress` from its scroll position and calls
 * the invalidate function it receives through `onReady`.
 *
 * Everything is generated in code: no downloaded models or textures.
 */

// ---------------------------------------------------------------------------
// Trail
const TRAIL_START = -8;
const TRAIL_END = 52;
const RIDE_FROM = 1;
const RIDE_TO = 40;
const TRAIL_W = 1.5;

/** Height and sideways wander of the trail at x. */
const trailY = (x: number) => 0.2 * Math.sin(x * 0.33) + 0.08 * Math.sin(x * 0.95 + 1.3);
const trailZ = (x: number) => 0.45 * Math.sin(x * 0.21 + 0.4);

/** A ribbon following the trail centreline, offset sideways from `from` to `to`. */
function ribbon(from: number, to: number, lift = 0, segments = 420) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = TRAIL_START + ((TRAIL_END - TRAIL_START) * i) / segments;
    const dz = trailZ(x + 0.01) - trailZ(x - 0.01);
    const len = Math.hypot(0.02, dz);
    // Sideways direction in the ground plane (perpendicular to the heading).
    const nx = -dz / len;
    const nz = 0.02 / len;
    const y = trailY(x) + lift;
    const z = trailZ(x);
    pos.push(x + nx * from, y, z + nz * from, x + nx * to, y, z + nz * to);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// ---------------------------------------------------------------------------
// Bike: the shared low-poly mountain bike (components/three/bikeModel).
const WHEEL_R = BIKE_WHEEL_R;
const WHEELBASE = BIKE_WHEELBASE;

// ---------------------------------------------------------------------------
type Materials = Record<"frame" | "tyre" | "metal" | "dark" | "dirt" | "edge" | "ground" | "pebble", THREE.MeshStandardMaterial>;

function readPalette() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    bg: v("--bg") || "#f3ede2",
    accent: v("--accent") || "#1e46e0",
    dirt: dark ? "#3d3448" : "#e2d3b8",
    edge: dark ? "#54486a" : "#cdb593",
    ground: dark ? "#1f1b28" : "#e9dfcd",
    pebble: dark ? "#6a5e78" : "#bba98a",
    tyre: dark ? "#0b090e" : "#211c18",
    metal: dark ? "#cfc8bd" : "#8c857c",
    dark: dark ? "#26222c" : "#2a2420",
  };
}

function Scene({ progress, onReady }: { progress: React.RefObject<number>; onReady: (invalidate: () => void) => void }) {
  const { invalidate, camera, scene } = useThree();
  const bike = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);

  const mats = useMemo<Materials>(() => {
    const m = (flat = true) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, flatShading: flat });
    return { frame: m(false), tyre: m(), metal: m(false), dark: m(false), dirt: m(), edge: m(), ground: m(), pebble: m() };
  }, []);

  const model = useMemo(() => buildMountainBike(mats), [mats]);

  const geo = useMemo(() => {
    const rand = seeded(7);
    const pebbles: { p: [number, number, number]; s: number; r: number }[] = [];
    for (let i = 0; i < 140; i++) {
      const x = TRAIL_START + rand() * (TRAIL_END - TRAIL_START);
      const side = rand() > 0.5 ? 1 : -1;
      const off = side * (TRAIL_W / 2 + 0.05 + rand() * 0.9);
      pebbles.push({ p: [x, trailY(x) + 0.01, trailZ(x) + off], s: 0.03 + rand() * 0.07, r: rand() * Math.PI });
    }
    return {
      dirt: ribbon(-TRAIL_W / 2, TRAIL_W / 2, 0.004),
      edgeL: ribbon(-TRAIL_W / 2 - 0.06, -TRAIL_W / 2, 0.008),
      edgeR: ribbon(TRAIL_W / 2, TRAIL_W / 2 + 0.06, 0.008),
      ground: ribbon(-14, 14, -0.004, 200),
      pebbles,
    };
  }, []);

  // Colours follow the site theme.
  useEffect(() => {
    const apply = () => {
      const p = readPalette();
      mats.frame.color.set(p.accent);
      mats.tyre.color.set(p.tyre);
      mats.metal.color.set(p.metal);
      mats.dark.color.set(p.dark);
      mats.dirt.color.set(p.dirt);
      mats.edge.color.set(p.edge);
      mats.ground.color.set(p.ground);
      mats.pebble.color.set(p.pebble);
      scene.fog = new THREE.Fog(p.bg, 4.5, 12);
      invalidate();
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [mats, scene, invalidate]);

  useEffect(() => onReady(invalidate), [onReady, invalidate]);

  useFrame(() => {
    const t = Math.min(1, Math.max(0, progress.current ?? 0));
    const x = RIDE_FROM + (RIDE_TO - RIDE_FROM) * t;
    const xr = x - WHEELBASE / 2;
    const xf = x + WHEELBASE / 2;
    const yr = trailY(xr);
    const yf = trailY(xf);
    const z = trailZ(x);
    const heading = Math.atan2(trailZ(x + 0.05) - trailZ(x - 0.05), 0.1);
    if (bike.current) {
      bike.current.position.set(x, (yr + yf) / 2, z);
      bike.current.rotation.set(0, -heading, Math.atan2(yf - yr, WHEELBASE), "YXZ");
    }
    if (shadow.current) shadow.current.position.set(x, trailY(x) + 0.012, z);
    const wheelAngle = -((x - RIDE_FROM) / WHEEL_R);
    model.rearSpin.rotation.z = wheelAngle;
    model.frontSpin.rotation.z = wheelAngle;
    // Camera rides alongside, a little above and ahead.
    camera.position.set(x - 0.35, trailY(x) + 0.95, z + 3.6);
    camera.lookAt(x + 0.55, trailY(x + 0.55) + 0.34, trailZ(x + 0.55));
  });

  return (
    <>
      <hemisphereLight args={["#ffffff", "#8a7a66", 1.25]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} />
      <mesh geometry={geo.ground} material={mats.ground} />
      <mesh geometry={geo.dirt} material={mats.dirt} />
      <mesh geometry={geo.edgeL} material={mats.edge} />
      <mesh geometry={geo.edgeR} material={mats.edge} />
      {geo.pebbles.map((pb, i) => (
        <mesh key={i} material={mats.pebble} position={pb.p} rotation={[pb.r, pb.r * 2, 0]} scale={pb.s}>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} scale={[1.7, 0.5, 1]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={bike}>
        <primitive object={model.group} />
      </group>
    </>
  );
}

export default function TrailRide({
  progress,
  onReady,
}: {
  progress: React.RefObject<number>;
  onReady: (invalidate: () => void) => void;
}) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ fov: 32, near: 0.1, far: 40, position: [0, 1.3, 4.4] }}
      aria-hidden="true"
    >
      <Scene progress={progress} onReady={onReady} />
    </Canvas>
  );
}
