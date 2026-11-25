/*
 * The loader's opening scene, in SVG units (viewBox "40 22 320 138"): a rider
 * with one foot on a floor pump, pumping up the bike's flat back tyre.
 * pose() sets every moving part from two numbers: k, how far the handle is
 * pushed down (0 up, 1 down), and air, the tyre's pressure (0 flat, 1 full).
 */

export const GROUND = 150;
export const BIKE_SCALE = 2.3;
export const BIKE_X = 262; // bike origin: on the ground, between the tyres
export const PUMP_X = 150;

const R = 11 * BIKE_SCALE; // wheel radius
const REAR = BIKE_X - 22 * BIKE_SCALE;
const FRONT = BIKE_X + 22 * BIKE_SCALE; // the front contact patch: pivot for the tilt
const BARREL_TOP = GROUND - 40;
const HANDLE_UP = GROUND - 66;
const HANDLE_DOWN = GROUND - 40;

type P = [number, number];
const pt = (p: P) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

/** Two-bone IK in the drawing plane: where the joint between root and end sits. */
function joint(root: P, end: P, a: number, b: number, bend: 1 | -1): P {
  const dx = end[0] - root[0];
  const dy = end[1] - root[1];
  const d = Math.min(Math.hypot(dx, dy), a + b - 0.01);
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const ang = Math.atan2(dy, dx) + bend * off;
  return [root[0] + Math.cos(ang) * a, root[1] + Math.sin(ang) * a];
}

export type Part =
  | "bike" | "tyre" | "knobs" | "rim" | "puff" | "hose" | "rod" | "handle" | "needle"
  | "leg-back" | "leg-front" | "torso" | "arm" | "arm-far" | "head" | "helmet";

type Attrs = Record<string, string>;
const n = (v: number) => v.toFixed(2);

/** Every moving part's SVG attributes for a pose (also used for the first paint). */
export function geometry(k: number, air: number): Record<Part, Attrs> {
  // Tyre: the less air, the more it sags and spreads (the ground line clips
  // its bottom flat) and the lower the back of the bike sits.
  const flat = 1 - air;
  const phi = -Math.atan2(6 * flat, FRONT - REAR);
  const [ox, oy] = [REAR - FRONT, -R];
  const hub: P = [FRONT + ox * Math.cos(phi) - oy * Math.sin(phi), GROUND + ox * Math.sin(phi) + oy * Math.cos(phi)];

  // The valve sits low on the rim, towards the pump; the hose runs to it.
  const valve: P = [hub[0] - (R - 6) * 0.72, hub[1] + (R - 6) * 0.69];

  // Pump: the rod and T-handle slide; the gauge needle reads the pressure.
  const hy = HANDLE_UP + (HANDLE_DOWN - HANDLE_UP) * k;
  const a = ((-60 + 120 * air) * Math.PI) / 180;
  const gauge: P = [PUMP_X, GROUND - 16];

  // Rider: front foot on the pump's base, hinging at the hips and pushing
  // the handle down with body weight; the knees give a little at the bottom.
  const hip: P = [PUMP_X - 26 - 3 * k, GROUND - 61 + 12 * k];
  const lean = ((34 + 26 * k) * Math.PI) / 180;
  const shoulder: P = [hip[0] + Math.sin(lean) * 33, hip[1] - Math.cos(lean) * 33];
  const tilt = lean * 0.55 + 0.25;
  const neck: P = [shoulder[0] + Math.sin(tilt) * 5, shoulder[1] - Math.cos(tilt) * 5];
  const head: P = [shoulder[0] + Math.sin(tilt) * 13, shoulder[1] - Math.cos(tilt) * 13];
  const backFoot: P = [PUMP_X - 48, GROUND];
  const frontFoot: P = [PUMP_X - 11, GROUND - 3];
  const hand: P = [PUMP_X - 5, hy + 1.5];
  const farShoulder: P = [shoulder[0] + 2, shoulder[1]];
  const farHand: P = [hand[0] + 5, hand[1]];

  return {
    bike: { transform: `rotate(${n((phi * 180) / Math.PI)} ${FRONT} ${GROUND}) translate(${BIKE_X} ${GROUND})` },
    tyre: { cx: n(hub[0]), cy: n(hub[1]), rx: n(R - 1.4 + 6 * flat), ry: n(R - 1.4 - 2.1 * flat) },
    knobs: { cx: n(hub[0]), cy: n(hub[1]), rx: n(R + 0.9 + 6 * flat), ry: n(R + 0.9 - 2.1 * flat) },
    rim: { transform: `translate(${pt(hub)})` },
    puff: { transform: `translate(${pt(valve)})` },
    hose: { d: `M${PUMP_X + 4} ${GROUND - 5} C ${PUMP_X + 26} ${GROUND + 2}, ${pt([valve[0] - 24, valve[1] + 12])}, ${pt(valve)}` },
    rod: { d: `M${PUMP_X} ${BARREL_TOP} V${n(hy)}` },
    handle: { d: `M${PUMP_X - 13} ${n(hy)} H${PUMP_X + 13}` },
    needle: { d: `M${pt(gauge)} L${pt([gauge[0] + Math.sin(a) * 5.6, gauge[1] - Math.cos(a) * 5.6])}` },
    "leg-back": { d: `M${pt(hip)} L${pt(joint(hip, backFoot, 31, 31, -1))} L${pt(backFoot)} l-6 0` },
    "leg-front": { d: `M${pt(hip)} L${pt(joint(hip, frontFoot, 31, 31, -1))} L${pt(frontFoot)} l7 0` },
    torso: { d: `M${pt(hip)} L${pt(shoulder)} L${pt(neck)}` },
    arm: { d: `M${pt(shoulder)} L${pt(joint(shoulder, hand, 20, 19, 1))} L${pt(hand)}` },
    "arm-far": { d: `M${pt(farShoulder)} L${pt(joint(farShoulder, farHand, 20, 19, 1))} L${pt(farHand)}` },
    head: { cx: n(head[0]), cy: n(head[1]) },
    helmet: { transform: `translate(${pt(head)}) rotate(${n((tilt * 180) / Math.PI)})` },
  };
}

/** Apply a pose to the scene's elements. */
export function pose(part: (name: Part) => Element, k: number, air: number) {
  const g = geometry(k, air);
  for (const name of Object.keys(g) as Part[]) {
    const el = part(name);
    for (const [key, value] of Object.entries(g[name])) el.setAttribute(key, value);
  }
}
