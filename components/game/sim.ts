// Physics for the ride: a hill-climb style bicycle on planck.js (Box2D).
// Pure simulation, no rendering. Units are metres, kilograms, seconds.

import { Body, ChainShape, CircleShape, Fixture, PolygonShape, Vec2, WheelJoint, World } from "planck";
import { Trail, type Point } from "./terrain";

export const WHEEL_R = 0.34;
export const HALF_BASE = 0.68; // half the wheelbase
const KEEP_BEHIND = 60;
const BUILD_AHEAD = 140;

const MAX_WHEEL_SPEED = 32; // rad/s ≈ 11 m/s ≈ 39 km/h
const PEDAL_TORQUE = 105;
const BRAKE_TORQUE = 160;
const AIR_TORQUE = 120; // lean control while airborne
const AIR_DAMPING = 2.5; // the rider steadies the bike in the air, so a tap doesn't spin it
// Hitting a slope too fast: losing this much speed within LANDING_WINDOW,
// from above LANDING_FAST, throws the rider (normal landings lose 2–4 m/s).
const LANDING_LIMIT = 6.5;
const LANDING_FAST = 9;
const LANDING_WINDOW = 6; // steps (0.1s at 60Hz)

export const WATER_MAX = 100;
const DRINK_PEDALLING = 3; // per second
const DRINK_RESTING = 0.5;
const BOTTLE_RADIUS = 1.4;

export type CrashReason = "balance" | "landing" | "water" | "river";
export type Input = { pedal: boolean; brake: boolean };

type Tag = "ground" | "wheel" | "frame" | "rider";

const vec = (p: Point) => new Vec2(p.x, p.y);

export class RideSim {
  readonly terrain: Trail;
  readonly world: World;
  readonly chassis: Body;
  readonly rear: Body;
  readonly front: Body;
  readonly startX = 4;
  private rearJoint: WheelJoint;
  private frontJoint: WheelJoint;
  private riderFixtures: Fixture[] = [];
  private grounds = new Map<number, Body>(); // trail segment index → static body
  private wheelContacts = 0;
  private speedHistory: number[] = [];
  private stalled = 0;
  private dryFor = 0;
  private detachRider = false;

  water = WATER_MAX;
  distance = 0;
  crashed: CrashReason | null = null;
  crashTime = 0;
  time = 0;
  /** Water level of the trench he went into, if he did. */
  river: number | null = null;
  /** After a crash the rider leaves the bike and tumbles on his own. */
  riderBody: Body | null = null;

  constructor(seed: number) {
    this.terrain = new Trail(seed);
    this.world = new World({ gravity: new Vec2(0, -10) });
    this.ensureTerrain(0);

    const x0 = this.startX;
    const y0 = this.terrain.height(x0) + WHEEL_R + 0.05;

    // Frame: low and light. The rider is a separate pair of sensor fixtures
    // on the same body: heavy and high, so balance matters.
    this.chassis = this.world.createDynamicBody({ position: new Vec2(x0, y0), angularDamping: 1.4 });
    this.chassis.createFixture({
      shape: new PolygonShape([new Vec2(-0.6, 0.05), new Vec2(0.6, 0.05), new Vec2(0.45, 0.55), new Vec2(-0.3, 0.6)]),
      density: 40,
      friction: 0.4,
      userData: "frame" satisfies Tag,
    });
    this.riderFixtures.push(
      this.chassis.createFixture({
        shape: new PolygonShape([new Vec2(-0.42, 0.62), new Vec2(-0.1, 0.62), new Vec2(0.35, 1.12), new Vec2(0.05, 1.2)]),
        density: 150,
        isSensor: true,
        userData: "rider" satisfies Tag,
      }),
      this.chassis.createFixture({
        shape: new CircleShape(new Vec2(0.26, 1.3), 0.14),
        density: 60,
        isSensor: true,
        userData: "rider" satisfies Tag,
      }),
    );

    const wheel = (dx: number) => {
      const b = this.world.createDynamicBody({ position: new Vec2(x0 + dx, y0), angularDamping: 0.05 });
      b.createFixture({ shape: new CircleShape(WHEEL_R), density: 25, friction: 0.95, userData: "wheel" satisfies Tag });
      return b;
    };
    this.rear = wheel(-HALF_BASE);
    this.front = wheel(HALF_BASE);

    const suspension = { frequencyHz: 5, dampingRatio: 0.75, enableMotor: false, maxMotorTorque: 0, motorSpeed: 0 };
    this.rearJoint = this.world.createJoint(
      new WheelJoint(suspension, this.chassis, this.rear, this.rear.getPosition(), new Vec2(0, 1)),
    ) as WheelJoint;
    this.frontJoint = this.world.createJoint(
      new WheelJoint(suspension, this.chassis, this.front, this.front.getPosition(), new Vec2(0, 1)),
    ) as WheelJoint;

    const tagOf = (f: Fixture) => f.getUserData() as Tag | undefined;
    this.world.on("begin-contact", (c) => {
      const a = tagOf(c.getFixtureA());
      const b = tagOf(c.getFixtureB());
      if ((a === "rider" && b === "ground") || (b === "rider" && a === "ground")) this.crash("balance");
      if ((a === "wheel" && b === "ground") || (b === "wheel" && a === "ground")) this.wheelContacts++;
    });
    this.world.on("end-contact", (c) => {
      const a = tagOf(c.getFixtureA());
      const b = tagOf(c.getFixtureB());
      if ((a === "wheel" && b === "ground") || (b === "wheel" && a === "ground")) this.wheelContacts = Math.max(0, this.wheelContacts - 1);
    });
  }

  get speed() {
    return this.chassis.getLinearVelocity().length();
  }

  get airborne() {
    return this.wheelContacts === 0;
  }

  get bottles() {
    return this.terrain.bottles;
  }

  /** One chain per trail segment, only around the rider. */
  private ensureTerrain(x: number) {
    const t = this.terrain;
    t.ensure(x + BUILD_AHEAD + 30);
    const first = t.indexAt(x - KEEP_BEHIND);
    const last = t.indexAt(x + BUILD_AHEAD);
    for (let i = first; i <= last; i++) {
      if (this.grounds.has(i)) continue;
      const seg = t.segments[i];
      const chain = new ChainShape(seg.pts.map(vec), false);
      // Ghost vertices so wheels roll smoothly from one segment to the next.
      const prev = t.segments[i - 1];
      const next = t.segments[i + 1];
      if (prev) chain.setPrevVertex(vec(prev.pts[prev.pts.length - 2]));
      if (next) chain.setNextVertex(vec(next.pts[1]));
      const body = this.world.createBody();
      body.createFixture({ shape: chain, friction: seg.surface === "wood" ? 0.85 : 0.95, userData: "ground" satisfies Tag });
      this.grounds.set(i, body);
    }
    for (const [i, body] of this.grounds) {
      if (i < first - 1) {
        this.world.destroyBody(body);
        this.grounds.delete(i);
      }
    }
  }

  /** The water trench he is in (or just past), if any. */
  private gapAt(x: number) {
    for (const at of [x, x - 1]) {
      const seg = this.terrain.segmentAt(at);
      if (seg.kind === "gap") return seg;
    }
    return null;
  }

  private crash(reason: CrashReason) {
    if (this.crashed) return;
    // Any fall down into a trench is a fall into the river.
    const pos = this.chassis.getPosition();
    const gap = reason === "water" ? null : this.gapAt(pos.x);
    if (gap && pos.y < gap.water! + 1.2) {
      reason = "river";
      this.river = gap.water!;
    }
    this.crashed = reason;
    this.crashTime = this.time;
    this.rearJoint.enableMotor(false);
    this.frontJoint.enableMotor(false);
    // He simply stops when out of water; otherwise he comes off the bike,
    // which has to wait until the world is unlocked after the step.
    if (reason !== "water") this.detachRider = true;
  }

  /** Replace the rider's sensor fixtures with a body that tumbles on its own. */
  private throwRider() {
    this.detachRider = false;
    const at = this.chassis.getWorldPoint(new Vec2(0, 0.9));
    const rider = this.world.createDynamicBody({
      position: at,
      angle: this.chassis.getAngle(),
      linearVelocity: this.chassis.getLinearVelocity(),
      angularVelocity: this.chassis.getAngularVelocity() * 0.6 + 1.5,
      angularDamping: 0.8,
    });
    rider.createFixture({ shape: new PolygonShape([new Vec2(-0.18, -0.35), new Vec2(0.18, -0.35), new Vec2(0.18, 0.4), new Vec2(-0.18, 0.4)]), density: 60, friction: 0.7 });
    this.riderBody = rider;
    this.riderFixtures.forEach((f) => this.chassis.destroyFixture(f));
    this.riderFixtures = [];
  }

  step(dt: number, input: Input) {
    this.time += dt;
    const x = this.chassis.getPosition().x;
    this.ensureTerrain(x);

    if (!this.crashed) {
      // Water: drink while riding, refill at bottles.
      const canPedal = this.water > 0;
      const pedalling = input.pedal && canPedal;
      this.water = Math.max(0, this.water - (pedalling ? DRINK_PEDALLING : DRINK_RESTING) * dt);
      for (const b of this.bottles) {
        if (!b.taken && Math.abs(b.x - x) < BOTTLE_RADIUS && Math.abs(b.y - this.chassis.getPosition().y) < 2.5) {
          b.taken = true;
          this.water = WATER_MAX;
        }
        if (b.x > x + 5) break;
      }

      if (input.brake) {
        this.rearJoint.enableMotor(true);
        this.frontJoint.enableMotor(true);
        this.rearJoint.setMotorSpeed(0);
        this.frontJoint.setMotorSpeed(0);
        this.rearJoint.setMaxMotorTorque(BRAKE_TORQUE);
        this.frontJoint.setMaxMotorTorque(BRAKE_TORQUE * 0.6);
      } else if (pedalling) {
        this.rearJoint.enableMotor(true);
        this.rearJoint.setMotorSpeed(-MAX_WHEEL_SPEED);
        this.rearJoint.setMaxMotorTorque(PEDAL_TORQUE);
        this.frontJoint.enableMotor(false);
      } else if (!canPedal) {
        // Out of water: legs give up and the bike drags to a halt.
        this.rearJoint.enableMotor(true);
        this.frontJoint.enableMotor(true);
        this.rearJoint.setMotorSpeed(0);
        this.frontJoint.setMotorSpeed(0);
        this.rearJoint.setMaxMotorTorque(18);
        this.frontJoint.setMaxMotorTorque(18);
      } else {
        this.rearJoint.enableMotor(false);
        this.frontJoint.enableMotor(false);
      }

      // In the air the rider leans: pedal tips the bike back, brake forward.
      this.chassis.setAngularDamping(this.airborne ? AIR_DAMPING : 1.4);
      if (this.airborne) {
        if (pedalling) this.chassis.applyTorque(AIR_TORQUE, true);
        if (input.brake) this.chassis.applyTorque(-AIR_TORQUE, true);
      }

      // Out of water: the ride ends once he has rolled to a stop (or after
      // a few seconds of coasting, whichever comes first).
      this.dryFor = canPedal ? 0 : this.dryFor + dt;
      this.stalled = !canPedal && this.speed < 0.4 ? this.stalled + dt : 0;
      if (this.stalled > 1 || this.dryFor > 6) this.crash("water");
    }

    this.world.step(dt, 8, 3);
    if (this.detachRider) this.throwRider();

    // Dropping into a trench ends the ride; the water slows whatever sinks.
    if (!this.crashed) {
      const pos = this.chassis.getPosition();
      const gap = this.terrain.segmentAt(pos.x);
      if (gap.kind === "gap" && pos.y < gap.water! + 0.45) this.crash("river");
    }
    if (this.river !== null) {
      for (const body of [this.chassis, this.rear, this.front, this.riderBody]) {
        if (body && body.getPosition().y < this.river) {
          body.setLinearDamping(6);
          body.setAngularDamping(4);
        }
      }
    }

    // Hard landing: losing a lot of speed in a split second at speed.
    if (!this.crashed) {
      const v = this.speed;
      this.speedHistory.push(v);
      if (this.speedHistory.length > LANDING_WINDOW) this.speedHistory.shift();
      const before = Math.max(...this.speedHistory);
      if (before > LANDING_FAST && before - v > LANDING_LIMIT) {
        this.crash("landing");
        this.throwRider();
      }
      this.distance = Math.max(this.distance, this.chassis.getPosition().x - this.startX);
    }
  }
}
