"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game, Hud } from "@/components/game/engine";
import type { CrashReason } from "@/components/game/sim";
import { Bike } from "@/components/ui/Bike";

type Phase = "intro" | "loading" | "playing" | "over";

const REASONS: Record<CrashReason, { title: string; tip: string }> = {
  balance: { title: "You lost your balance.", tip: "In the air, pedal leans you back and brake leans you forward. Don't brake on the steps." },
  landing: { title: "Came in too hot.", tip: "Ease off before steps, drops and steep landings." },
  water: { title: "Out of water.", tip: "Grab the blue bottles along the trail to keep riding." },
  river: { title: "Into the river!", tip: "Pedal hard up the ramp to clear the gap, and let go of pedal in the air." },
};

const PEDAL_KEYS = new Set(["ArrowRight", "KeyD", "KeyW", "ArrowUp"]);
const BRAKE_KEYS = new Set(["ArrowLeft", "KeyA", "KeyS", "ArrowDown"]);

/**
 * "Ride along the Ganga": a hill-climb style game. Pedal to ride, brake to
 * slow down, lean in the air, keep drinking water. The game engine (three.js
 * + planck.js) loads only when the visitor starts. Best ride is kept in
 * memory for this visit only, so it resets when the page is refreshed.
 */
export function RideGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const darkRef = useRef<boolean | null>(null);
  const bestRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hud, setHud] = useState<Hud>({ distance: 0, water: 100, speed: 0 });
  const [result, setResult] = useState<{ reason: CrashReason; distance: number; newBest: boolean } | null>(null);
  const [best, setBest] = useState(0);
  const [runs, setRuns] = useState<number[]>([]);
  const [error, setError] = useState(false);

  const onOver = useCallback(({ reason, distance }: { reason: CrashReason; distance: number }) => {
    const d = Math.floor(distance);
    const newBest = d > bestRef.current;
    if (newBest) bestRef.current = d;
    setBest(bestRef.current);
    setRuns((r) => [d, ...r].slice(0, 5));
    setResult({ reason, distance: d, newBest });
    setPhase("over");
  }, []);

  const start = useCallback(async () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    setResult(null);
    try {
      if (!gameRef.current || darkRef.current !== dark) {
        setPhase("loading");
        gameRef.current?.dispose();
        const { createGame } = await import("@/components/game/engine");
        gameRef.current = createGame(canvasRef.current!, dark, { onHud: setHud, onOver });
        darkRef.current = dark;
        gameRef.current.start();
      } else {
        gameRef.current.restart();
      }
      setPhase("playing");
      wrapRef.current?.focus({ preventScroll: true });
    } catch {
      setError(true);
      setPhase("intro");
    }
  }, [onOver]);

  // Keyboard: only while riding (or to ride again), so page keys are untouched otherwise.
  useEffect(() => {
    if (phase !== "playing" && phase !== "over") return;
    const inView = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      return !!r && r.top < window.innerHeight && r.bottom > 0;
    };
    const down = (e: KeyboardEvent) => {
      if (!inView()) return;
      if (phase === "over" && (e.code === "Enter" || e.code === "Space") && document.activeElement === wrapRef.current) {
        e.preventDefault();
        start();
        return;
      }
      if (phase !== "playing") return;
      if (PEDAL_KEYS.has(e.code)) gameRef.current?.setInput({ pedal: true });
      else if (BRAKE_KEYS.has(e.code)) gameRef.current?.setInput({ brake: true });
      else return;
      e.preventDefault(); // arrows would otherwise scroll the page
    };
    const up = (e: KeyboardEvent) => {
      if (PEDAL_KEYS.has(e.code)) gameRef.current?.setInput({ pedal: false });
      if (BRAKE_KEYS.has(e.code)) gameRef.current?.setInput({ brake: false });
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, start]);

  // Pause when scrolled away or the tab is hidden; resume when back.
  useEffect(() => {
    if (phase !== "playing") return;
    const game = gameRef.current;
    let visible = true;
    const sync = () => (visible && document.visibilityState === "visible" ? game?.start() : game?.pause());
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(wrapRef.current!);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [phase]);

  useEffect(() => () => gameRef.current?.dispose(), []);

  const hold = (key: "pedal" | "brake") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      gameRef.current?.setInput({ [key]: true });
    },
    onPointerUp: () => gameRef.current?.setInput({ [key]: false }),
    onPointerCancel: () => gameRef.current?.setInput({ [key]: false }),
    onLostPointerCapture: () => gameRef.current?.setInput({ [key]: false }),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const lowWater = hud.water < 25;

  return (
    <div
      ref={wrapRef}
      tabIndex={-1}
      aria-label="Ride along the Ganga, a small cycling game"
      className="relative h-[min(108vw,70svh,560px)] w-full select-none overflow-hidden rounded-[1.5rem] border border-line outline-none sm:h-[clamp(380px,50vw,600px)] bg-[linear-gradient(180deg,#f6d2a4_0%,#f4dfc4_45%,#efdcc2_70%)] dark:bg-[linear-gradient(180deg,#141127_0%,#2b2143_50%,#4a3352_75%,#2c2543_100%)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {/* Poster behind the start screen: the Ganga, ghats and a rider */}
      {phase === "intro" || (phase === "loading" && !gameRef.current) ? <Poster /> : null}

      {/* HUD */}
      {phase === "playing" || phase === "over" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:gap-4 sm:p-5">
          <div className="rounded-2xl bg-bg/85 px-3 py-2 backdrop-blur-sm sm:px-4">
            <p className="eyebrow text-muted">Distance</p>
            <p className="display whitespace-nowrap text-[1.3rem] leading-none tabular-nums sm:text-[2rem]">{Math.floor(hud.distance)} m</p>
          </div>
          <div className="mt-1 flex items-center gap-2 rounded-full bg-bg/85 px-3 py-2 backdrop-blur-sm" aria-label={`Water ${Math.round(hud.water)} percent`}>
            <svg viewBox="0 0 16 16" className={`size-4 ${lowWater ? "text-[#d6453d]" : "text-accent"}`} aria-hidden="true">
              <path d="M8 1.5S3 7 3 10a5 5 0 0 0 10 0c0-3-5-8.5-5-8.5Z" fill="currentColor" />
            </svg>
            <span className="relative h-2 w-14 overflow-hidden rounded-full bg-line sm:w-28">
              <span
                className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ${lowWater ? "bg-[#d6453d]" : "bg-accent"}`}
                style={{ width: `${Math.max(0, Math.min(100, hud.water))}%` }}
              />
            </span>
          </div>
          <div className="rounded-2xl bg-bg/85 px-3 py-2 text-right backdrop-blur-sm sm:px-4">
            <p className="eyebrow text-muted">Best</p>
            <p className="display whitespace-nowrap text-[1.3rem] leading-none tabular-nums sm:text-[2rem]">{best} m</p>
          </div>
        </div>
      ) : null}

      {/* Controls: big hold-buttons for touch, also clickable with a mouse */}
      {phase === "playing" ? (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:p-5">
          <button
            type="button"
            aria-label="Brake (left arrow or A)"
            {...hold("brake")}
            className="grid size-[4.5rem] touch-none place-items-center rounded-full border border-line bg-bg/85 text-[0.95rem] backdrop-blur-sm active:scale-95 active:bg-surface sm:size-16"
          >
            Brake
          </button>
          <p className="eyebrow hidden pb-3 text-ink/70 sm:block">→ pedal · ← brake · lean in the air</p>
          <button
            type="button"
            aria-label="Pedal (right arrow or D)"
            {...hold("pedal")}
            className="grid size-[4.5rem] touch-none place-items-center rounded-full bg-accent text-[0.95rem] text-on-accent active:scale-95 sm:size-16"
          >
            Pedal
          </button>
        </div>
      ) : null}

      {/* Start */}
      {phase === "intro" || phase === "loading" ? (
        <div className="absolute inset-0 grid place-items-center p-5">
          <div className="max-w-[26rem] rounded-[1.5rem] bg-bg/90 p-6 text-center backdrop-blur-sm sm:p-8">
            <p className="display text-[clamp(1.7rem,1.3rem+1.4vw,2.4rem)] leading-tight">
              Ride along the <span className="italic text-accent">Ganga</span>
            </p>
            <p className="mt-3 text-[0.98rem] text-muted">
              Pedal up the riverbank, lean through the air, and keep drinking water. Fall off or run dry and the ride ends.
            </p>
            <ul className="mt-4 grid gap-1 text-[0.9rem]">
              <li>
                <kbd className="font-sans">→</kbd> / <kbd>D</kbd> pedal · <kbd>←</kbd> / <kbd>A</kbd> brake
              </li>
              <li className="text-muted">On a phone: hold the Pedal and Brake buttons.</li>
            </ul>
            <button
              type="button"
              onClick={start}
              disabled={phase === "loading"}
              className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-2 text-bg transition-colors duration-300 hover:bg-accent hover:text-on-accent disabled:opacity-70"
            >
              {phase === "loading" ? "Getting the bike ready…" : "Start riding"}
              <span className="grid size-8 place-items-center rounded-full bg-bg text-ink">→</span>
            </button>
            {error ? <p className="mt-3 text-[0.9rem] text-[#d6453d]">The game couldn&apos;t start on this device (WebGL is needed).</p> : null}
          </div>
        </div>
      ) : null}

      {/* Result */}
      {phase === "over" && result ? (
        <div className="absolute inset-0 grid place-items-center bg-bg/30 p-5" role="dialog" aria-live="polite" aria-label="Ride over">
          <div className="w-full max-w-[24rem] rounded-[1.5rem] bg-bg/95 p-6 text-center shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)] sm:p-8">
            <p className="display text-[1.6rem] italic leading-tight">{REASONS[result.reason].title}</p>
            <p className="mt-2 text-[0.95rem] text-muted">{REASONS[result.reason].tip}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line p-3">
                <p className="eyebrow text-muted">This ride</p>
                <p className="display text-[2rem] leading-none tabular-nums">{result.distance} m</p>
              </div>
              <div className={`rounded-2xl p-3 ${result.newBest ? "bg-accent text-on-accent" : "border border-line"}`}>
                <p className={`eyebrow ${result.newBest ? "text-on-accent/80" : "text-muted"}`}>{result.newBest ? "New best!" : "Best today"}</p>
                <p className="display text-[2rem] leading-none tabular-nums">{best} m</p>
              </div>
            </div>
            {runs.length > 1 ? (
              <p className="mt-3 text-[0.85rem] text-muted">Recent rides: {runs.map((r) => `${r} m`).join(" · ")}</p>
            ) : null}
            <button
              type="button"
              onClick={start}
              autoFocus
              className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-2 text-bg transition-colors duration-300 hover:bg-accent hover:text-on-accent"
            >
              Ride again
              <span className="grid size-8 place-items-center rounded-full bg-bg text-ink">↻</span>
            </button>
            <p className="mt-3 text-[0.8rem] text-muted">Scores are kept until you refresh the page.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Static drawing shown before the game loads: river, ghats, a rider. */
function Poster() {
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="640" cy="196" r="30" className="fill-[#ffd28a] dark:fill-[#f2a066]" />
      {/* far bank: ghats and temples */}
      <g className="fill-[#d8b88a] dark:fill-[#7a6656]">
        <rect x="0" y="232" width="800" height="14" />
        <path d="M60 232h120v-10h-10v-10h-100v10h-10z" />
        <path d="M120 212v-26h24v26z M114 186 L132 150 L150 186 Z" />
        <path d="M420 232h150v-12h-12v-10h-126v10h-12z" />
        <path d="M480 210v-30h28v30z M474 180 L494 140 L514 180 Z" />
      </g>
      <path d="M494 140v-12l14 5-14 5" className="fill-[#e08b3c]" />
      <path d="M132 152v-10l12 4-12 4" className="fill-[#e08b3c]" />
      {/* river */}
      <rect x="0" y="246" width="800" height="70" className="fill-[#86a3a6] dark:fill-[#3a4867]" />
      <g className="fill-[#cfdcd6] dark:fill-[#7e8db0]" opacity="0.7">
        <rect x="80" y="262" width="60" height="2" />
        <rect x="300" y="278" width="90" height="2" />
        <rect x="560" y="268" width="70" height="2" />
      </g>
      {/* birds */}
      <g className="stroke-[#1d1a19] dark:stroke-[#dcd6cd]" fill="none" strokeWidth="2.5" strokeLinecap="round">
        <path d="M250 110q8-8 16 0q8-8 16 0" />
        <path d="M300 90q6-6 12 0q6-6 12 0" />
        <path d="M680 70q7-7 14 0q7-7 14 0" />
      </g>
      {/* trail and rider */}
      <path d="M0 330 C 160 300, 260 350, 420 322 S 680 300, 800 318 V400 H0 Z" className="fill-[#c9a978] dark:fill-[#5a4636]" />
      <g transform="translate(360 330) rotate(-4) scale(2.4)" className="text-[#1c1814] dark:text-[#ece8df]">
        <Bike scale={1} />
      </g>
    </svg>
  );
}
