import { GameScene } from "./scene";
import { RideSim, type CrashReason, WATER_MAX } from "./sim";

/*
 * Game loop: fixed-step physics (60 Hz), rendering on requestAnimationFrame
 * only while a ride is running and visible. Loaded on demand when the
 * visitor presses "Start riding", together with three.js and planck.js.
 */

export type Hud = { distance: number; water: number; speed: number };
export type GameCallbacks = {
  onHud: (hud: Hud) => void;
  onOver: (result: { reason: CrashReason; distance: number }) => void;
};

const STEP = 1 / 60;
const OVER_DELAY = 1.3; // seconds of tumbling before the result shows

export function createGame(canvas: HTMLCanvasElement, dark: boolean, cb: GameCallbacks) {
  let sim = new RideSim(Math.floor(Math.random() * 1e9));
  const scene = new GameScene(canvas, sim, dark);
  const input = { pedal: false, brake: false };
  let raf = 0;
  let last = 0;
  let acc = 0;
  let hudAt = 0;
  let running = false;
  let finished = false;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) scene.resize(r.width, r.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const frame = (now: number) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      sim.step(STEP, input);
      acc -= STEP;
    }
    scene.update(dt, input.pedal && sim.water > 0);
    scene.render();

    if (now - hudAt > 100) {
      hudAt = now;
      cb.onHud({ distance: sim.distance, water: (sim.water / WATER_MAX) * 100, speed: sim.speed });
    }
    if (sim.crashed && !finished && sim.time - sim.crashTime > OVER_DELAY) {
      finished = true;
      cb.onOver({ reason: sim.crashed, distance: sim.distance });
    }
    // Once the result is up and the rider has settled, stop drawing.
    if (finished && sim.time - sim.crashTime > OVER_DELAY + 2.5) {
      pause();
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  return {
    start,
    pause,
    setInput(next: Partial<typeof input>) {
      Object.assign(input, next);
    },
    restart() {
      sim = new RideSim(Math.floor(Math.random() * 1e9));
      scene.reset(sim);
      input.pedal = false;
      input.brake = false;
      finished = false;
      start();
    },
    dispose() {
      pause();
      ro.disconnect();
      scene.dispose();
    },
  };
}

export type Game = ReturnType<typeof createGame>;
