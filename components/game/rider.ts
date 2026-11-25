import * as THREE from "three";
import { BIKE_POINTS } from "@/components/three/bikeModel";

/*
 * A low-poly rider in full kit (helmet with visor, glasses, jersey, gloves,
 * knee pads, shoes, hydration pack), built in code to sit on the shared
 * mountain bike. Legs follow the pedals with two-bone IK; arms hold the bar.
 * Same origin as the bike: ground, midway between the tyres, +x forward.
 */

export type RiderMaterials = Record<"jersey" | "shorts" | "skin" | "helmet" | "gear" | "shoe", THREE.Material>;

const V = (x: number, y: number) => new THREE.Vector2(x, y);
const HIP = V(BIKE_POINTS.saddle.x + 0.01, BIKE_POINTS.saddle.y + 0.02);
const SHOULDER = V(0.06, 1.42);
const HAND = V(BIKE_POINTS.bar.x, BIKE_POINTS.bar.y + 0.01);
const BB = V(BIKE_POINTS.bb.x, BIKE_POINTS.bb.y);
const CRANK = 0.17;
const THIGH = 0.47;
const SHIN = 0.46;
const UPPER_ARM = 0.31;
const FOREARM = 0.29;

const UP = new THREE.Vector3(0, 1, 0);

/** A unit-height cylinder stretched between two points (z fixed per limb). */
function limb(radius: number, mat: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.85, 1, 8), mat);
  return {
    mesh,
    set(a: THREE.Vector2, b: THREE.Vector2, z: number) {
      const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, 0);
      const len = dir.length();
      mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
      mesh.scale.set(1, len, 1);
      mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
    },
  };
}

/**
 * Two-bone IK in the side plane: the joint between `root` and `end`, bent
 * towards `bendSign` (+1 bends the joint forward/up, −1 back/down).
 */
function solveJoint(root: THREE.Vector2, end: THREE.Vector2, a: number, b: number, bendSign: number) {
  const d = Math.min(root.distanceTo(end), a + b - 1e-4);
  const base = Math.atan2(end.y - root.y, end.x - root.x);
  const offset = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const ang = base + bendSign * offset;
  return V(root.x + Math.cos(ang) * a, root.y + Math.sin(ang) * a);
}

export function buildRider(m: RiderMaterials) {
  const group = new THREE.Group();

  // Torso (jersey) from hip to shoulder, with a hydration pack on the back.
  const torsoDir = new THREE.Vector3(SHOULDER.x - HIP.x, SHOULDER.y - HIP.y, 0);
  const torsoLen = torsoDir.length();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, torsoLen - 0.1, 4, 10), m.jersey);
  torso.position.set((HIP.x + SHOULDER.x) / 2, (HIP.y + SHOULDER.y) / 2, 0);
  torso.quaternion.setFromUnitVectors(UP, torsoDir.clone().normalize());
  torso.scale.set(1, 1, 1.25);
  group.add(torso);

  const back = new THREE.Vector3(-torsoDir.y, torsoDir.x, 0).normalize(); // perpendicular, pointing up/back
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.26), m.gear);
  pack.position.copy(torso.position).addScaledVector(back, 0.13);
  pack.quaternion.copy(torso.quaternion);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.36, 0.28), m.helmet);
  strap.position.copy(pack.position).addScaledVector(back, -0.05);
  strap.quaternion.copy(torso.quaternion);
  group.add(pack, strap);

  // Head, helmet with visor, glasses.
  const headC = new THREE.Vector3(SHOULDER.x + 0.14, SHOULDER.y + 0.2, 0);
  const neck = limb(0.045, m.skin);
  neck.set(SHOULDER, V(headC.x - 0.04, headC.y - 0.06), 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), m.skin);
  head.position.copy(headC);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), m.helmet);
  helmet.position.copy(headC).add(new THREE.Vector3(-0.01, 0.015, 0));
  helmet.rotation.z = -0.25;
  helmet.scale.set(1.15, 1, 1);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.2), m.gear);
  visor.position.copy(headC).add(new THREE.Vector3(0.12, 0.055, 0));
  visor.rotation.z = -0.35;
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.19), m.gear);
  glasses.position.copy(headC).add(new THREE.Vector3(0.09, 0.0, 0));
  group.add(neck.mesh, head, helmet, visor, glasses);

  // Limbs for both sides: z > 0 faces the camera.
  const side = (z: number) => {
    const thigh = limb(0.075, m.shorts);
    const shin = limb(0.055, m.skin);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), m.gear);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.09), m.shoe);
    const upper = limb(0.05, m.jersey);
    const fore = limb(0.042, m.skin);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), m.gear);
    group.add(thigh.mesh, shin.mesh, pad, shoe, upper.mesh, fore.mesh, glove);
    return { thigh, shin, pad, shoe, upper, fore, glove, z };
  };
  const right = side(0.11);
  const left = side(-0.11);

  // Arms don't depend on pedalling: solve once.
  for (const s of [right, left]) {
    const hand = HAND;
    const elbow = solveJoint(SHOULDER, hand, UPPER_ARM, FOREARM, -1);
    s.upper.set(SHOULDER, elbow, s.z * 1.9);
    s.fore.set(elbow, hand, s.z * 2.1);
    s.glove.position.set(hand.x, hand.y, s.z * 2.2);
  }

  /** Pose the legs for a crank angle (radians). */
  const pose = (crank: number) => {
    for (const [s, phase] of [
      [right, 0],
      [left, Math.PI],
    ] as const) {
      const a = crank + phase;
      const pedal = V(BB.x + Math.cos(a) * CRANK, BB.y + Math.sin(a) * CRANK);
      const foot = V(pedal.x, pedal.y + 0.04);
      const knee = solveJoint(HIP, foot, THIGH, SHIN, 1);
      s.thigh.set(HIP, knee, s.z);
      s.shin.set(knee, foot, s.z);
      s.pad.position.set(knee.x + 0.02, knee.y, s.z);
      s.shoe.position.set(foot.x + 0.03, foot.y - 0.02, s.z);
    }
  };
  pose(0);

  return { group, pose };
}
