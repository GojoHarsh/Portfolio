import * as THREE from "three";
import { buildMountainBike, BIKE_WHEEL_R } from "@/components/three/bikeModel";
import { buildRider } from "./rider";
import type { RideSim } from "./sim";

/*
 * Three.js view of the ride: a side-on camera following the bike along a
 * riverbank trail, with the Ganga behind it: ghats and temples on the far
 * bank, boats on the water, crows and egrets overhead. Light theme is a
 * warm afternoon; dark theme is evening, with diyas lit on the ghats.
 * The trail itself has stone ghat steps, timber kickers and water-filled
 * gaps. Everything is built in code (no downloaded models).
 */

const TRAIL_FRONT = 1.3; // trail surface spans z ∈ [-1.6, TRAIL_FRONT]
const TRAIL_BACK = -1.6;
const MEADOW_Y = -5.5;
const RIVER_Y = -6;

type Palette = {
  fog: string;
  dirt: string;
  dirtSide: string;
  stone: string;
  stoneSide: string;
  wood: string;
  woodSide: string;
  grass: string;
  meadow: string;
  river: string;
  riverHi: string;
  waterFace: string;
  sand: string;
  ghat: string;
  temple: string;
  tree: string;
  boat: string;
  crow: string;
  egret: string;
  sun: string;
  lamp: string;
  accent: string;
  ink: string;
  sky: number; // hemisphere light intensity
};

const DAY: Palette = {
  fog: "#efdcc2",
  dirt: "#c9a978",
  dirtSide: "#9c7a52",
  stone: "#e6d2ad",
  stoneSide: "#b99d76",
  wood: "#b4773f",
  woodSide: "#835530",
  grass: "#9aa865",
  meadow: "#b7b77c",
  river: "#86a3a6",
  riverHi: "#cfdcd6",
  waterFace: "#5d8791",
  sand: "#e3cfa6",
  ghat: "#d8b88a",
  temple: "#e08b3c",
  tree: "#6a8550",
  boat: "#7b5232",
  crow: "#1d1a19",
  egret: "#faf7f0",
  sun: "#ffd28a",
  lamp: "#ffb347",
  accent: "#1e46e0",
  ink: "#1c1814",
  sky: 1.25,
};

const DUSK: Palette = {
  fog: "#2c2543",
  dirt: "#5a4636",
  dirtSide: "#46372c",
  stone: "#8a7765",
  stoneSide: "#62534a",
  wood: "#6f4a31",
  woodSide: "#4c3223",
  grass: "#3f4c33",
  meadow: "#36402f",
  river: "#3a4867",
  riverHi: "#7e8db0",
  waterFace: "#283657",
  sand: "#5a4c45",
  ghat: "#7a6656",
  temple: "#a8603a",
  tree: "#2b3a2b",
  boat: "#3b2a1f",
  crow: "#0d0b10",
  egret: "#dcd6cd",
  sun: "#f2a066",
  lamp: "#ffae42",
  accent: "#7a9bff",
  ink: "#ece8df",
  sky: 0.75,
};

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...extra });

export class GameScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  private palette: Palette;
  private m: Record<string, THREE.Material>;
  private segments = new Map<number, THREE.Group>(); // trail segment index → meshes
  private backdrop = new THREE.Group();
  private farObjects: { group: THREE.Group; slot: number }[] = [];
  private boats: THREE.Group[] = [];
  private birds: { group: THREE.Group; wings: THREE.Mesh[]; speed: number; phase: number; flap: number }[] = [];
  private bottles: THREE.Group[] = [];
  private drops: { mesh: THREE.Mesh; vx: number; vy: number }[] = [];
  private splashed = false;
  private bike: ReturnType<typeof buildMountainBike>;
  private bikeRoot = new THREE.Group();
  private rider: ReturnType<typeof buildRider>;
  private riderRoot = new THREE.Group();
  private camX = 0;
  private camY = 0;
  private crank = 0;
  private sim: RideSim;
  private clock = 0;

  constructor(canvas: HTMLCanvasElement, sim: RideSim, dark: boolean) {
    this.sim = sim;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.palette = dark ? DUSK : DAY;
    const p = this.palette;

    this.m = {
      dirt: mat(p.dirt),
      dirtSide: mat(p.dirtSide),
      stone: mat(p.stone),
      stoneSide: mat(p.stoneSide),
      wood: mat(p.wood),
      woodSide: mat(p.woodSide),
      grass: mat(p.grass),
      water: mat(p.river, { roughness: 0.3, metalness: 0.1, flatShading: false, transparent: true, opacity: 0.92 }),
      waterFace: new THREE.MeshBasicMaterial({ color: p.waterFace, transparent: true, opacity: 0.84 }),
      flag: new THREE.MeshBasicMaterial({ color: p.temple }),
      meadow: mat(p.meadow),
      river: mat(p.river, { roughness: 0.35, metalness: 0.1, flatShading: false }),
      riverHi: mat(p.riverHi, { emissive: p.riverHi, emissiveIntensity: 0.15 }),
      sand: mat(p.sand),
      ghat: mat(p.ghat),
      temple: mat(p.temple),
      tree: mat(p.tree),
      boat: mat(p.boat),
      crow: mat(p.crow),
      egret: mat(p.egret),
      sun: new THREE.MeshBasicMaterial({ color: p.sun, fog: false }),
      lamp: new THREE.MeshBasicMaterial({ color: p.lamp }),
      bottle: mat("#3e8fd6", { roughness: 0.3, flatShading: false, emissive: "#1d4f8a", emissiveIntensity: dark ? 0.6 : 0.15 }),
      cap: mat(p.accent),
      // Bike and rider
      frame: mat(p.accent, { flatShading: false, roughness: 0.6 }),
      tyre: mat("#1c1916"),
      metal: mat("#a8a29a", { flatShading: false, metalness: 0.3, roughness: 0.5 }),
      dark: mat("#2a2622", { flatShading: false }),
      jersey: mat(p.accent, { flatShading: false }),
      shorts: mat("#24211f", { flatShading: false }),
      skin: mat("#b97c52", { flatShading: false }),
      helmet: mat("#f3ede2", { flatShading: false, roughness: 0.5 }),
      gear: mat("#1f1c1a", { flatShading: false }),
      shoe: mat("#e9e2d6", { flatShading: false }),
    };
    // Trail meshes are seen from both sides (front faces, trench walls).
    for (const k of ["dirt", "dirtSide", "stone", "stoneSide", "wood", "woodSide", "grass", "water", "waterFace", "flag"]) this.m[k].side = THREE.DoubleSide;

    this.scene.fog = new THREE.Fog(p.fog, 70, 300);
    this.scene.add(new THREE.HemisphereLight("#ffffff", "#7d6a55", p.sky));
    const sun = new THREE.DirectionalLight(dark ? "#ffc39a" : "#fff1dc", dark ? 0.9 : 1.6);
    sun.position.set(-6, 10, 8);
    this.scene.add(sun);

    this.buildBackdrop();
    this.buildFarBank();
    this.buildBoats();
    this.buildBirds();
    this.buildBottles();
    const drop = new THREE.SphereGeometry(0.07, 6, 5);
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(drop, this.m.riverHi);
      mesh.visible = false;
      this.drops.push({ mesh, vx: 0, vy: 0 });
      this.scene.add(mesh);
    }

    this.bike = buildMountainBike({ frame: this.m.frame, tyre: this.m.tyre, metal: this.m.metal, dark: this.m.dark });
    this.bike.group.position.y = -BIKE_WHEEL_R; // physics origin is the axle line
    this.bikeRoot.add(this.bike.group);
    this.rider = buildRider({
      jersey: this.m.jersey,
      shorts: this.m.shorts,
      skin: this.m.skin,
      helmet: this.m.helmet,
      gear: this.m.gear,
      shoe: this.m.shoe,
    });
    this.riderRoot.add(this.rider.group);
    this.rider.group.position.y = -BIKE_WHEEL_R;
    this.bikeRoot.add(this.riderRoot);
    this.scene.add(this.bikeRoot);
  }

  // -------------------------------------------------------------------------
  // Static-ish backdrop that follows the camera along x.
  private buildBackdrop() {
    const plane = (w: number, d: number, material: THREE.Material, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, y, z);
      this.backdrop.add(mesh);
      return mesh;
    };
    plane(600, 14, this.m.meadow, MEADOW_Y, -17);
    plane(600, 86, this.m.river, RIVER_Y, -67);
    plane(600, 30, this.m.sand, MEADOW_Y + 0.4, -125);
    // Shimmer lines on the water
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(4 + hash(i) * 10, 0.12), this.m.riverHi);
      s.rotation.x = -Math.PI / 2;
      s.position.set((hash(i + 1) - 0.5) * 300, RIVER_Y + 0.02, -28 - hash(i + 2) * 70);
      s.userData.drift = 0.3 + hash(i + 3) * 0.6;
      this.backdrop.add(s);
    }
    // Low sun (or setting sun at dusk)
    const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 40), this.m.sun);
    sun.position.set(30, this.palette === DUSK ? 4 : 22, -260);
    this.backdrop.add(sun);
    this.scene.add(this.backdrop);
  }

  /** Far-bank pieces: ghat steps with a temple, houses, trees. Recycled along x. */
  private buildFarBank() {
    const dark = this.palette === DUSK;
    const ghat = () => {
      const g = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 3 - i * 0.4), this.m.ghat);
        step.position.set(0, RIVER_Y + 0.3 + i * 0.6, -110 - i * 1.2);
        g.add(step);
      }
      // Temple: base, shikhara spire, saffron flag
      const base = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), this.m.ghat);
      base.position.set(2, RIVER_Y + 5.1, -120);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.4, 6.5, 4), this.m.temple);
      spire.position.set(2, RIVER_Y + 9.8, -120);
      spire.rotation.y = Math.PI / 4;
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), this.m.temple);
      flag.position.set(2.7, RIVER_Y + 13.7, -120);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6), this.m.boat);
      pole.position.set(2, RIVER_Y + 13.4, -120);
      g.add(base, spire, flag, pole);
      // Evening aarti: small lamps along the steps
      if (dark) {
        for (let i = 0; i < 9; i++) {
          const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.m.lamp);
          lamp.position.set(-6 + i * 1.5, RIVER_Y + 0.75 + (i % 3) * 0.6, -109.2 - (i % 3) * 1.2);
          g.add(lamp);
        }
      }
      return g;
    };
    const houses = () => {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) {
        const h = 2.5 + hash(i * 7) * 4;
        const house = new THREE.Mesh(new THREE.BoxGeometry(3 + hash(i) * 2, h, 3), i % 2 ? this.m.ghat : this.m.sand);
        house.position.set(-6 + i * 4, RIVER_Y + 0.6 + h / 2, -117 - hash(i + 3) * 4);
        g.add(house);
      }
      return g;
    };
    const trees = () => {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const t = new THREE.Mesh(new THREE.SphereGeometry(2 + hash(i + 9) * 1.5, 7, 6), this.m.tree);
        t.position.set(-8 + i * 4, RIVER_Y + 3 + hash(i) * 1.5, -118 - hash(i + 4) * 6);
        t.scale.y = 1.2;
        g.add(t);
      }
      return g;
    };
    const makers = [ghat, houses, trees];
    for (let i = 0; i < 15; i++) {
      const group = makers[i % 3]();
      group.userData.kind = i % 3;
      this.farObjects.push({ group, slot: Number.NaN });
      this.scene.add(group);
    }
  }

  private buildBoats() {
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 6, 10, 1, false, 0, Math.PI), this.m.boat);
      hull.rotation.z = Math.PI / 2;
      hull.rotation.y = Math.PI;
      const person = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 3, 6), this.m.crow);
      person.position.set(1.5, 0.9, 0);
      const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6), this.m.boat);
      oar.position.set(2.2, 0.4, 0);
      oar.rotation.z = 0.6;
      g.add(hull, person, oar);
      g.position.set(i * 60 - 80, RIVER_Y + 0.25, -35 - hash(i) * 40);
      g.userData.speed = (hash(i + 2) - 0.5) * 1.2;
      this.boats.push(g);
      this.scene.add(g);
    }
  }

  private buildBirds() {
    for (let i = 0; i < 14; i++) {
      const egret = i % 5 === 0;
      const material = egret ? this.m.egret : this.m.crow;
      const group = new THREE.Group();
      // Drawn facing the camera (like a gull silhouette) so the wingbeat
      // reads from the side-on view; wings hinge at the shoulders.
      const body = new THREE.Mesh(new THREE.SphereGeometry(egret ? 0.16 : 0.12, 6, 5), material);
      body.scale.set(1, 0.8, 0.8);
      const span = egret ? 1.0 : 0.7;
      const wingGeo = new THREE.BufferGeometry();
      wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0.02, 0, span, 0.14, 0, span * 0.45, -0.07, 0], 3));
      wingGeo.computeVertexNormals();
      const wingMat = new THREE.MeshBasicMaterial({ color: (material as THREE.MeshStandardMaterial).color, side: THREE.DoubleSide });
      const w1 = new THREE.Mesh(wingGeo, wingMat);
      const w2 = new THREE.Mesh(wingGeo, wingMat);
      w2.scale.x = -1;
      group.add(body, w1, w2);
      group.scale.setScalar(egret ? 1.4 : 1.1);
      this.birds.push({ group, wings: [w1, w2], speed: (egret ? 3 : 5) + hash(i) * 3, phase: hash(i + 1) * 6, flap: egret ? 5 : 9 });
      group.userData.seeded = false;
      this.scene.add(group);
    }
  }

  private buildBottles() {
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.42, 12), this.m.bottle);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), this.m.cap);
      cap.position.y = 0.26;
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 6, 30), new THREE.MeshBasicMaterial({ color: "#7cc4ff", transparent: true, opacity: 0.55 }));
      g.add(body, cap, halo);
      g.visible = false;
      this.bottles.push(g);
      this.scene.add(g);
    }
  }

  // -------------------------------------------------------------------------
  /**
   * One trail segment: the riding surface, the face towards the camera and a
   * bank down to the meadow behind. Timber ramps show their side down to the
   * ground they sit on. A gap is a trench: bed, water, and a back wall.
   */
  private buildSegment(i: number) {
    const trail = this.sim.terrain;
    const seg = trail.segments[i];
    const m = this.m;
    const group = new THREE.Group();
    const pts = seg.pts;
    // A strip through pairs of vertices, one pair per profile point.
    const strip = (pairs: number[][], material: THREE.Material) => {
      const idx: number[] = [];
      for (let k = 0; k < pairs.length - 1; k++) idx.push(k * 2, k * 2 + 2, k * 2 + 1, k * 2 + 1, k * 2 + 2, k * 2 + 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pairs.flat(), 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      group.add(new THREE.Mesh(geo, material));
    };
    const deep = (y: number) => Math.min(y, MEADOW_Y) - 14;
    const F = TRAIL_FRONT;
    const B = TRAIL_BACK;

    const top = seg.kind === "gap" ? m.dirtSide : seg.surface === "stone" ? m.stone : seg.surface === "wood" ? m.wood : m.dirt;
    strip(pts.map((p) => [p.x, p.y, F, p.x, p.y, B]), top);

    if (seg.kind === "gap") {
      const lipY = trail.segments[i - 1].lip!.y;
      const after = trail.segments[i + 1];
      const landY = after.pts[after.pts.length - 1].y;
      const rim = (x: number) => lipY + ((landY - lipY) * (x - seg.x0)) / (seg.x1 - seg.x0);
      const water = seg.water!;
      const bed = pts[0].y;
      strip(pts.map((p) => [p.x, p.y, F, p.x, deep(p.y), F]), m.dirtSide);
      strip(pts.map((p) => [p.x, rim(p.x), B, p.x, p.y, B]), m.dirtSide);
      strip(pts.map((p) => [p.x, rim(p.x), B, p.x, MEADOW_Y, -10]), m.grass);
      strip([[seg.x0, water, F, seg.x0, water, B], [seg.x1, water, F, seg.x1, water, B]], m.water);
      strip([[seg.x0, water, F + 0.01, seg.x0, bed, F + 0.01], [seg.x1, water, F + 0.01, seg.x1, bed, F + 0.01]], m.waterFace);
      strip([[seg.x0, water + 0.02, F + 0.02, seg.x0, water - 0.07, F + 0.02], [seg.x1, water + 0.02, F + 0.02, seg.x1, water - 0.07, F + 0.02]], m.riverHi);
    } else if (seg.base !== undefined) {
      const base = seg.base;
      strip(pts.map((p) => [p.x, p.y, F, p.x, Math.min(p.y, base), F]), m.woodSide);
      strip(pts.map((p) => [p.x, Math.min(p.y, base), F, p.x, deep(p.y), F]), m.dirtSide);
      strip(pts.map((p) => [p.x, Math.min(p.y, base), B, p.x, MEADOW_Y, -10]), m.grass);
    } else {
      strip(pts.map((p) => [p.x, p.y, F, p.x, deep(p.y), F]), seg.surface === "stone" ? m.stoneSide : m.dirtSide);
      strip(pts.map((p) => [p.x, p.y, B, p.x, MEADOW_Y, -10]), m.grass);
      // A grassy lip along the front edge of dirt trail.
      if (seg.surface === "dirt") strip(pts.map((p) => [p.x, p.y + 0.015, F + 0.01, p.x, p.y - 0.16, F + 0.01]), m.grass);
    }

    // A pennant on a pole where a jump takes off, so it can be seen coming.
    if (seg.lip) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), m.boat);
      pole.position.set(seg.lip.x, seg.lip.y + 0.7, B + 0.25);
      const pennant = new THREE.BufferGeometry();
      pennant.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, -0.32, 0, 0.46, -0.16, 0], 3));
      const flag = new THREE.Mesh(pennant, m.flag);
      flag.position.set(seg.lip.x + 0.02, seg.lip.y + 1.4, B + 0.25);
      group.add(pole, flag);
    }
    return group;
  }

  private updateSegments(x: number) {
    const trail = this.sim.terrain;
    const first = trail.indexAt(x - 40);
    const last = trail.indexAt(x + 120);
    for (let i = first; i <= last; i++) {
      if (this.segments.has(i)) continue;
      const g = this.buildSegment(i);
      this.segments.set(i, g);
      this.scene.add(g);
    }
    for (const [i, g] of this.segments) {
      if (i < first - 1 || i > last + 1) {
        this.scene.remove(g);
        g.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
        this.segments.delete(i);
      }
    }
  }

  /** Spray when he goes into the water, then let it fall back. */
  private updateSplash(dt: number) {
    const sim = this.sim;
    const pos = sim.chassis.getPosition();
    if (sim.crashed === "river" && !this.splashed && sim.river !== null && pos.y < sim.river + 0.5) {
      this.splashed = true;
      const vx = sim.chassis.getLinearVelocity().x;
      this.drops.forEach((d, k) => {
        d.mesh.visible = true;
        d.mesh.position.set(pos.x + (hash(k) - 0.5) * 0.9, sim.river!, (hash(k + 7) - 0.4) * 1.6);
        d.vx = (hash(k + 3) - 0.5) * 3 + vx * 0.25;
        d.vy = 2 + hash(k + 5) * 3.5;
      });
    }
    for (const d of this.drops) {
      if (!d.mesh.visible) continue;
      d.vy -= 10 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      if (d.vy < 0 && sim.river !== null && d.mesh.position.y < sim.river) d.mesh.visible = false;
    }
  }

  private updateFarBank(x: number) {
    const spacing = 26;
    const first = Math.floor((x - 120) / spacing);
    const last = Math.floor((x + 200) / spacing);
    const wanted = new Map<number, number>();
    for (let s = first; s <= last; s++) wanted.set(s, Math.floor(hash(s) * 3));
    // Free objects whose slot left the window.
    for (const o of this.farObjects) if (!wanted.has(o.slot)) o.slot = Number.NaN;
    for (const [slot, kind] of wanted) {
      if (this.farObjects.some((o) => o.slot === slot)) continue;
      const free = this.farObjects.find((o) => Number.isNaN(o.slot) && o.group.userData.kind === kind) ?? this.farObjects.find((o) => Number.isNaN(o.slot));
      if (!free) continue;
      free.slot = slot;
      free.group.position.x = slot * spacing + hash(slot + 0.5) * 8;
    }
    for (const o of this.farObjects) o.group.visible = !Number.isNaN(o.slot);
  }

  private updateLife(x: number, dt: number) {
    // Water shimmer drifts slowly
    this.backdrop.position.x = x;
    for (const c of this.backdrop.children) {
      if (c.userData.drift) {
        c.position.x += c.userData.drift * dt;
        if (c.position.x > 150) c.position.x -= 300;
      }
    }
    for (const b of this.boats) {
      b.position.x += b.userData.speed * dt;
      if (b.position.x < x - 140) b.position.x += 280;
      if (b.position.x > x + 140) b.position.x -= 280;
    }
    for (const [i, bird] of this.birds.entries()) {
      const g = bird.group;
      if (!g.userData.seeded || g.position.x < x - 50) {
        g.userData.seeded = true;
        // Enter from ahead of the camera, in loose flocks.
        g.position.set(x + 40 + hash(i + this.clock) * 60, this.camY + 3 + hash(i * 3 + this.clock) * 7, -6 - hash(i * 5) * 26);
      }
      g.position.x -= bird.speed * dt;
      g.position.y += Math.sin(this.clock * 0.8 + bird.phase) * 0.004;
      const flap = Math.sin(this.clock * bird.flap + bird.phase) * 0.55;
      bird.wings[0].rotation.z = flap;
      bird.wings[1].rotation.z = -flap;
    }
    // Bottles near the rider bob and spin
    let k = 0;
    for (const b of this.sim.bottles) {
      if (k >= this.bottles.length) break;
      if (b.taken || b.x < x - 20 || b.x > x + 70) continue;
      const g = this.bottles[k++];
      g.visible = true;
      g.position.set(b.x, b.y + Math.sin(this.clock * 3 + b.x) * 0.08, 0);
      g.rotation.y = this.clock * 2;
    }
    for (; k < this.bottles.length; k++) this.bottles[k].visible = false;
  }

  update(dt: number, pedalling: boolean) {
    this.clock += dt;
    const sim = this.sim;
    const pos = sim.chassis.getPosition();

    // Bike follows the chassis; wheels follow their own bodies (suspension).
    this.bikeRoot.position.set(pos.x, pos.y, 0);
    this.bikeRoot.rotation.z = sim.chassis.getAngle();
    const [rearW, frontW] = [sim.rear, sim.front].map((w) => sim.chassis.getLocalPoint(w.getPosition()));
    const wheelGroups = [this.bike.rearSpin.parent!, this.bike.frontSpin.parent!];
    wheelGroups[0].position.set(rearW.x, rearW.y + BIKE_WHEEL_R, 0);
    wheelGroups[1].position.set(frontW.x, frontW.y + BIKE_WHEEL_R, 0);
    this.bike.rearSpin.rotation.z = sim.rear.getAngle();
    this.bike.frontSpin.rotation.z = sim.front.getAngle();
    this.bike.rear.setSpeed(sim.rear.getAngularVelocity());
    this.bike.front.setSpeed(sim.front.getAngularVelocity());

    // Pedals turn only while pedalling (freewheel otherwise), at a cadence
    // that tops out around 100 rpm.
    if (pedalling && !sim.crashed) this.crank += sim.rear.getAngularVelocity() * 0.35 * dt;
    this.rider.pose(this.crank);

    // After a crash the rider tumbles on his own body.
    if (sim.riderBody) {
      if (this.riderRoot.parent !== this.scene) {
        this.bikeRoot.remove(this.riderRoot);
        this.scene.add(this.riderRoot);
        this.rider.group.position.set(0, -(0.9 + BIKE_WHEEL_R), 0);
      }
      const rp = sim.riderBody.getPosition();
      this.riderRoot.position.set(rp.x, rp.y, 0.3);
      this.riderRoot.rotation.z = sim.riderBody.getAngle();
    }

    // Camera: ahead of the rider, smoothed, wider on portrait screens.
    const aspect = this.camera.aspect;
    const dist = 10.5 * Math.max(1, 1.25 / aspect);
    // On squarer screens aim a little higher, so the trail sits low in the
    // frame and the river and sky get the space instead of the dirt.
    const lift = Math.max(0, 1.4 - aspect) * 1.8;
    this.camX += (pos.x + 2.6 - this.camX) * Math.min(1, dt * 4);
    this.camY += (pos.y + 1.1 - this.camY) * Math.min(1, dt * 3);
    this.camera.position.set(this.camX, this.camY + 1.2 + lift, dist);
    this.camera.lookAt(this.camX, this.camY + 0.2 + lift, 0);

    this.updateSegments(pos.x);
    this.updateFarBank(this.camX);
    this.updateLife(this.camX, dt);
    this.updateSplash(dt);
  }

  /** Put everything back at the start for a new ride (same scene objects). */
  reset(sim: RideSim) {
    this.sim = sim;
    for (const [, g] of this.segments) {
      this.scene.remove(g);
      g.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    }
    this.segments.clear();
    this.splashed = false;
    for (const d of this.drops) d.mesh.visible = false;
    if (this.riderRoot.parent !== this.bikeRoot) {
      this.scene.remove(this.riderRoot);
      this.bikeRoot.add(this.riderRoot);
      this.riderRoot.position.set(0, 0, 0);
      this.riderRoot.rotation.set(0, 0, 0);
      this.rider.group.position.set(0, -BIKE_WHEEL_R, 0);
    }
    const pos = sim.chassis.getPosition();
    this.camX = pos.x + 2.6;
    this.camY = pos.y + 1.1;
    this.crank = 0;
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
    });
    Object.values(this.m).forEach((x) => x.dispose());
    this.renderer.dispose();
  }
}
