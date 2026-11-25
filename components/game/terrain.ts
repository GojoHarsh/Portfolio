// Procedural riverbank trail for the ride: endless and deterministic per seed.
// It is built from features (hills, rollers, ghat steps, wooden kickers,
// ledges and gaps over water) that grow bigger and closer together with
// distance. The first stretch is scripted so each feature is met once,
// gently, before the random trail starts.
//
// The ground is one continuous polyline, generated lazily ahead of the
// rider. A gap is a water-filled trench in that line, so physics and
// rendering never have to deal with holes.

export type Surface = "dirt" | "stone" | "wood";
export type Kind = "flat" | "hill" | "rollers" | "stairs" | "kicker" | "ledge" | "takeoff" | "gap" | "landing";
export type Point = { x: number; y: number };
export type Segment = {
  kind: Kind;
  surface: Surface;
  /** Ground profile, x increasing; neighbouring segments share end points. */
  pts: Point[];
  x0: number;
  x1: number;
  /** Wooden ramps sit on the ground at this height. */
  base?: number;
  /** Gaps: water level in the trench. */
  water?: number;
  /** Where a jump takes off (marked in the scene). */
  lip?: Point;
};
export type Bottle = { x: number; y: number; taken: boolean };

const OPENING_END = 140; // the scripted part of the trail
const RAMP_UP = 700; // metres over which the random trail reaches full difficulty
const WALL = 0.03; // horizontal run of a vertical face, so x keeps increasing
const Y_MIN = 0;
const Y_MAX = 11;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Trail {
  readonly segments: Segment[] = [];
  readonly bottles: Bottle[] = [];
  private rand: () => number;
  private x = -60; // a little trail behind the start, too
  private y = 0;
  private nextBottle = 60;
  private script: (() => void)[];

  constructor(seed: number) {
    this.rand = mulberry32(seed);
    // One of everything, small, in a sensible order.
    this.script = [
      () => this.flat(82),
      () => this.hill(12, 1.6),
      () => this.flat(6),
      () => this.rollers(3, 5.5, 0.3),
      () => this.flat(6),
      () => this.stairs(5, 0.15, 1.05, 1),
      () => this.flat(8),
      () => this.hill(14, -2.4),
      () => this.flat(8),
      () => this.kicker(3, 0.5, 0.3),
      () => this.flat(12),
      () => this.gap(2.6, 0.3),
      () => this.flat(10),
    ];
  }

  /** How far into the random trail we are, 0 → 1. */
  difficulty(x: number) {
    return Math.min(1, Math.max(0, (x - OPENING_END) / RAMP_UP));
  }

  /** Generate the trail at least as far as x. */
  ensure(x: number) {
    while (this.x < x) {
      const next = this.script.shift();
      if (next) next();
      else this.feature();
    }
  }

  /** Index of the segment under x. */
  indexAt(x: number) {
    this.ensure(x + 1);
    const s = this.segments;
    let lo = 0;
    let hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid].x0 <= x) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  segmentAt(x: number) {
    return this.segments[this.indexAt(x)];
  }

  /** Ground height at x (the trench bed inside a gap). */
  height(x: number) {
    return profileAt(this.segmentAt(x), x);
  }

  // ---------------------------------------------------------------------------
  // Features. Each appends one or more segments from the current end point.

  private add(kind: Kind, surface: Surface, pts: Point[], extra: Partial<Segment> = {}) {
    const all = [{ x: this.x, y: this.y }, ...pts];
    const end = all[all.length - 1];
    const seg: Segment = { kind, surface, pts: all, x0: this.x, x1: end.x, ...extra };
    this.segments.push(seg);
    this.x = end.x;
    this.y = end.y;
    return seg;
  }

  /** Sample y0 + dy·f(t) for t in (0, 1] every `step` metres. */
  private curve(len: number, step: number, f: (t: number) => number, dy = 1) {
    const n = Math.max(2, Math.round(len / step));
    const pts: Point[] = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      pts.push({ x: this.x + len * t, y: this.y + dy * f(t) });
    }
    return pts;
  }

  private flat(len: number) {
    const d = this.difficulty(this.x);
    const bumps = Math.max(1, Math.round(len / 3));
    const amp = (0.03 + 0.06 * d) * (this.rand() < 0.5 ? 1 : -1);
    const seg = this.add("flat", "dirt", this.curve(len, 1, (t) => Math.sin(Math.PI * bumps * t), amp));
    // Water bottles wait on flat ground, a little further apart each time.
    if (len >= 3 && this.nextBottle <= seg.x1 - 1.5) {
      const x = Math.max(this.nextBottle, seg.x0 + 1.5);
      this.bottles.push({ x, y: profileAt(seg, x) + 1.1, taken: false });
      this.nextBottle = x + 70 + 90 * d + this.rand() * 20;
    }
  }

  private hill(len: number, dy: number) {
    this.add("hill", "dirt", this.curve(len, 0.5, (t) => (1 - Math.cos(Math.PI * t)) / 2, dy));
  }

  private rollers(count: number, wavelength: number, amp: number) {
    this.add("rollers", "dirt", this.curve(wavelength * count, 0.25, (t) => (1 - Math.cos(2 * Math.PI * count * t)) / 2, amp));
  }

  /** Ghat steps: stone treads with vertical risers, up (+1) or down (−1). */
  private stairs(count: number, rise: number, tread: number, dir: 1 | -1) {
    const pts: Point[] = [];
    let x = this.x;
    let y = this.y;
    for (let i = 0; i < count; i++) {
      if (dir > 0) {
        pts.push({ x: x + WALL, y: y + rise });
        x += tread;
        y += rise;
        pts.push({ x, y });
      } else {
        x += tread;
        pts.push({ x, y });
        x += WALL;
        y -= rise;
        pts.push({ x, y });
      }
    }
    this.add("stairs", "stone", pts);
  }

  /** A wooden kicker: a concave ramp, then straight down past where it started. */
  private kicker(len: number, rise: number, drop: number) {
    const base = this.y;
    const pts = this.curve(len, 0.25, (t) => Math.pow(t, 1.7), rise);
    const lip = pts[pts.length - 1];
    pts.push({ x: lip.x + WALL, y: base - drop });
    this.add("kicker", "wood", pts, { base, lip: { ...lip } });
  }

  /** A ledge: the trail simply drops. */
  private ledge(height: number) {
    const lip = { x: this.x, y: this.y };
    this.add("ledge", "dirt", [{ x: this.x + WALL, y: this.y - height }], { lip });
  }

  /** A takeoff ramp, a trench of water `len` wide, then a landing slope. */
  private gap(len: number, landingDrop: number) {
    const d = this.difficulty(this.x);
    const ramp = this.curve(3.6, 0.25, (t) => Math.pow(t, 1.7), 0.6 + 0.2 * d);
    const lip = ramp[ramp.length - 1];
    const land = lip.y - landingDrop;
    const water = Math.min(lip.y, land) - 1.2;
    const bed = water - 1;
    ramp.push({ x: lip.x + WALL, y: bed });
    this.add("takeoff", "dirt", ramp, { lip: { ...lip } });
    this.add("gap", "dirt", [{ x: lip.x + len - WALL, y: bed }], { water });
    // Up the far wall, then a gentle downslope to land on.
    const from = { x: lip.x + len, y: land };
    this.add("landing", "dirt", [from]);
    this.add("landing", "dirt", this.curve(4, 0.5, (t) => (1 - Math.cos(Math.PI * t)) / 2, -0.6));
  }

  /** Pick the next feature at random, weighted by how far along we are. */
  private feature() {
    const r = this.rand;
    const d = this.difficulty(this.x);
    // Lean back towards the middle when the trail has wandered high or low.
    const up = this.y < Y_MIN + 1.5 ? 1 : this.y > Y_MAX - 2 ? -1 : r() < 0.5 ? 1 : -1;
    const options: [number, () => void][] = [
      [2.2 - 1.2 * d, () => this.flat(7 + r() * 8 - 3 * d)],
      [
        3,
        () => {
          const len = 8 + r() * 8;
          // Climbs up to ~30°, descents up to ~38°.
          const max = up > 0 ? 0.33 * len : 0.47 * len;
          this.hill(len, up * Math.min(max, 0.8 + r() * (1.2 + 2.4 * d)));
        },
      ],
      [1 + 1.5 * d, () => this.rollers(2 + Math.floor(r() * (2 + 3 * d)), 4.6 - 1.2 * d * r(), 0.35 + 0.1 * r() + 0.4 * d * r())],
      [
        0.6 + 1.4 * d,
        () => {
          this.kicker(2.6 + r(), 0.6 + 0.1 * r() + 0.5 * d * r(), this.y > Y_MIN + 1 ? r() * (0.3 + 0.9 * d) : 0);
          this.flat(6 + r() * 4);
        },
      ],
      [
        0.5 + 1.8 * d,
        () => {
          this.flat(9 + r() * 4 - 3 * d); // run-up
          this.gap(2.6 + 0.5 * r() + 3.5 * d * r(), r() * (0.3 + 0.5 * d));
          this.flat(6 + r() * 4);
        },
      ],
      [
        0.8 + 0.8 * d,
        () => {
          const count = 3 + Math.floor(r() * (3 + 4 * d));
          if (up > 0) this.stairs(count, 0.12 + r() * (0.03 + 0.06 * d), 0.9 + r() * 0.3, 1);
          else this.stairs(count, 0.18 + r() * (0.05 + 0.15 * d), 0.8 + r() * 0.4, -1);
          this.flat(4 + r() * 3);
        },
      ],
      [
        this.y > Y_MIN + 1 ? 0.5 + d : 0,
        () => {
          this.ledge(Math.min(this.y - Y_MIN, 0.5 + 0.2 * r() + 0.9 * d * r()));
          this.flat(6 + r() * 4);
        },
      ],
    ];
    let pick = r() * options.reduce((sum, [w]) => sum + Math.max(0, w), 0);
    for (const [w, make] of options) {
      pick -= Math.max(0, w);
      if (pick <= 0) return make();
    }
    options[0][1]();
  }
}

/** Height of a segment's profile at x (clamped to its ends). */
export function profileAt(seg: Segment, x: number) {
  const p = seg.pts;
  if (x <= p[0].x) return p[0].y;
  let lo = 0;
  let hi = p.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p[mid].x <= x) lo = mid;
    else hi = mid;
  }
  const a = p[lo];
  const b = p[hi];
  if (x >= b.x) return b.y;
  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
}
