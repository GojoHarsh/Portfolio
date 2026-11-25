import * as THREE from "three";

/*
 * The low-poly mountain bike, built from the same geometry as the 2D line
 * drawing (components/ui/Bike). Shared by the Work-section ride and the game.
 * Origin: on the ground, midway between the tyres; +x is forward.
 */

const S = 0.34 / 11; // drawing units → metres (wheel radius 0.34)
const P = (x: number, y: number) => new THREE.Vector3(x * S, -y * S, 0);
export const BIKE_WHEEL_R = 11 * S;
export const BIKE_WHEELBASE = 44 * S;

/** Key points of the frame, in metres (useful for placing a rider). */
export const BIKE_POINTS = {
  rearAxle: P(-22, -11),
  frontAxle: P(22, -11),
  bb: P(-2, -9),
  seat: P(-7, -26),
  saddle: P(-9, -32),
  headTop: P(13, -29),
  bar: P(15, -32),
};

export type BikeMaterials = Record<"frame" | "tyre" | "metal" | "dark", THREE.Material>;

function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, z = 0) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), mat);
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  mesh.position.z += z;
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

/*
 * Wheels and the wagon-wheel effect: evenly spaced spokes or knobs look
 * frozen (or backwards) when the wheel turns about one spacing per frame.
 * So each wheel carries one coloured rim mark, which can't alias at any
 * speed, and at speed the spokes and tread give way to a motion-blur disc.
 */
function wheel(x: number, mats: BikeMaterials) {
  const group = new THREE.Group();
  group.position.set(x * S, 11 * S, 0);
  group.add(new THREE.Mesh(new THREE.TorusGeometry(BIKE_WHEEL_R - 0.04, 0.045, 8, 28), mats.tyre));

  // Everything that should visibly turn sits in `spin`.
  const spin = new THREE.Group();
  const knobs = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.1), mats.tyre);
    knob.position.set(Math.cos(a) * BIKE_WHEEL_R, Math.sin(a) * BIKE_WHEEL_R, 0);
    knob.rotation.z = a;
    knobs.add(knob);
  }
  const rimR = BIKE_WHEEL_R - 0.09;
  const spokes = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(rimR - 0.03, 0.008, 0.008), mats.metal);
    spoke.position.set(Math.cos(a) * (rimR + 0.03) * 0.5, Math.sin(a) * (rimR + 0.03) * 0.5, 0);
    spoke.rotation.z = a;
    spokes.add(spoke);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.014, 6, 28), mats.metal);
  // The one asymmetric mark: a coloured sticker on the rim.
  const mark = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.024, 6, 10, Math.PI / 3), mats.frame);
  spin.add(knobs, spokes, rim, mark);
  group.add(spin);

  const blurMat = new THREE.MeshBasicMaterial({ color: "#8f897f", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const blur = new THREE.Mesh(new THREE.RingGeometry(0.04, BIKE_WHEEL_R - 0.02, 28), blurMat);
  group.add(blur);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10), mats.dark);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  /** Motion blur for an angular speed (rad/s): tread first, then spokes. */
  const setSpeed = (omega: number) => {
    const w = Math.abs(omega);
    knobs.visible = w < 9;
    spokes.visible = w < 21;
    blurMat.opacity = Math.min(0.42, Math.max(0, (w - 8) / 30));
    blur.visible = blurMat.opacity > 0.01;
  };

  return { group, spin, setSpeed };
}

export function buildMountainBike(mats: BikeMaterials) {
  const bike = new THREE.Group();
  const rear = wheel(-22, mats);
  const front = wheel(22, mats);
  bike.add(rear.group, front.group);

  const p = {
    rear: P(-22, -11),
    front: P(22, -11),
    bb: P(-2, -9),
    seat: P(-7, -26),
    headTop: P(13, -29),
    headBottom: P(15, -23),
    forkMid: P(18, -17),
    stay: P(-12, -21),
    shockEnd: P(-6, -20),
    post: P(-8.5, -31),
    stem: P(15, -32),
  };
  // Main triangle and head tube
  bike.add(
    tube(p.bb, p.seat, 0.024, mats.frame),
    tube(p.seat, p.headTop, 0.026, mats.frame),
    tube(p.bb, p.headTop, 0.03, mats.frame),
    tube(p.headTop, p.headBottom, 0.032, mats.frame),
  );
  // Rear triangle and fork, both sides
  for (const z of [-0.05, 0.05]) {
    bike.add(
      tube(p.rear, p.bb, 0.014, mats.frame, z),
      tube(p.rear, p.stay, 0.014, mats.frame, z),
      tube(p.headBottom, p.forkMid, 0.02, mats.metal, z),
      tube(p.forkMid, p.front, 0.026, mats.dark, z),
    );
  }
  // Shock, dropper post, saddle, stem, riser bar, chainring
  bike.add(tube(p.stay, p.shockEnd, 0.03, mats.dark), tube(p.seat, p.post, 0.016, mats.dark), tube(p.headTop, p.stem, 0.016, mats.dark));
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.08), mats.dark);
  saddle.position.set(p.post.x - 0.03, p.post.y + 0.02, 0);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 8), mats.dark);
  bar.position.copy(p.stem);
  bar.rotation.x = Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20), mats.metal);
  ring.position.set(p.bb.x, p.bb.y, 0.07);
  bike.add(saddle, bar, ring);

  return { group: bike, rearSpin: rear.spin, frontSpin: front.spin, rear, front };
}
