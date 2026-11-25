"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { INTRO_EVENT } from "@/components/motion/intro";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { Bike } from "@/components/ui/Bike";
import { BACK_FOOT, BIKE_SCALE, BIKE_X, FRONT_FOOT, geometry, GROUND, pose, PUMP_X, type Part } from "./pump";

const STROKES = 3;
const SKIN = "#c58b63";
// The first paint (before any script runs) already shows the scene: flat tyre, handle up.
const FIRST = geometry(0, 0);

/**
 * The prologue, about 2.7s, on every page load: the bike's back tyre is
 * flat, and a rider in kit pumps it up. Each push of the handle lifts the
 * gauge needle, puffs air at the valve and rounds out the tyre (the bike
 * levels and bounces as it fills). At full pressure the line ticks over to
 * "Ready to ride." and the whole sheet lifts away, bottom to top, like the
 * footer's curtain, with a cobalt hem behind it, revealing the hero.
 *
 * No JS: never shown (CSS). Reduced motion: the tyre is already full,
 * then a short cross-fade.
 */
export function Loader() {
  const ref = useRef<HTMLDivElement>(null);
  const { stop, start } = useSmoothScroll();

  useGSAP(
    () => {
      const root = document.documentElement;
      if (root.classList.contains("loader-done")) return;

      // Bound to the element itself, not the ref: React's development-mode
      // remount empties the ref while GSAP is still cleaning up, and the
      // animation must still find its parts then.
      const el = ref.current!;
      const q = gsap.utils.selector(el);
      const parts = new Map<Part, Element>();
      const part = (name: Part) => {
        if (!parts.has(name)) parts.set(name, q(`[data-part="${name}"]`)[0]);
        return parts.get(name)!;
      };
      const state = { k: 0, air: 0 };
      const draw = () => pose(part, state.k, state.air);

      let announced = false;
      const announce = () => {
        if (announced) return;
        announced = true;
        root.classList.add("intro-started");
        window.dispatchEvent(new Event(INTRO_EVENT));
      };
      const finish = () => {
        announce();
        root.classList.add("loader-done");
        start();
      };

      // Every load starts with the prologue, so start the page at the top too.
      history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      stop();

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        state.air = 1;
        draw();
        gsap.set(q("[data-line=ready]"), { opacity: 1 });
        gsap.set(q("[data-line=pumping]"), { opacity: 0 });
        gsap.set(q("[data-check]"), { strokeDashoffset: 0 });
        gsap.to(el, { autoAlpha: 0, duration: 0.35, delay: 0.6, onStart: announce, onComplete: finish });
        return;
      }

      const puffs = q("[data-puff-dot]");
      draw();
      const tl = gsap.timeline({ onComplete: finish, onUpdate: draw });
      tl.fromTo(q("[data-scene]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0)
        .fromTo(q("[data-line=pumping]"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, 0.1);
      // Three pushes: down hard, the tyre takes the air with a little spring,
      // a puff at the valve, then the handle comes back up.
      for (let i = 1; i <= STROKES; i++) {
        tl.to(state, { k: 1, duration: 0.17, ease: "power2.in" }, i === 1 ? 0.3 : ">")
          .to(state, { air: i / STROKES, duration: 0.32, ease: "back.out(2.6)" }, "<0.11")
          .fromTo(
            puffs,
            { opacity: 0.9, scale: 0.3 },
            { opacity: 0, scale: 1.6, duration: 0.45, ease: "power2.out", stagger: 0.04, transformOrigin: "50% 50%" },
            "<",
          )
          .to(state, { k: 0, duration: 0.15, ease: "power2.out" }, "<0.06");
      }
      // Full: the rider straightens up, the line ticks over.
      tl.to(state, { k: -0.18, duration: 0.3, ease: "back.out(2)" })
        .to(q("[data-line=pumping]"), { opacity: 0, y: -8, duration: 0.2 }, "<")
        .fromTo(q("[data-line=ready]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)" }, "<0.08")
        .fromTo(q("[data-check]"), { strokeDashoffset: 14 }, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "<0.12")
        // The lift: the scene rises a little faster than the sheet, the sheet
        // goes up from the bottom, and the cobalt hem follows it out.
        .add(announce, "+=0.12")
        .to(q("[data-scene-wrap]"), { y: -70, opacity: 0, duration: 0.55, ease: "power3.in" }, "<")
        .to(q("[data-sheet]"), { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "<0.05")
        .to(q("[data-edge]"), { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "<0.1");
    },
    { dependencies: [] },
  );

  return (
    <div ref={ref} className="loader fixed inset-0 z-[95] overflow-hidden" aria-hidden="true">
      {/* Cobalt hem that follows the sheet up */}
      <div data-edge className="absolute inset-0 rounded-b-[clamp(1.5rem,4vw,3rem)] bg-accent" />
      <div data-sheet className="absolute inset-0 grid place-items-center rounded-b-[clamp(1.5rem,4vw,3rem)] bg-bg px-6">
        <div data-scene-wrap className="w-full max-w-[min(36rem,92vw)]">
          <svg
            data-scene
            viewBox="40 22 320 138"
            className="w-full overflow-visible text-ink"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <clipPath id="loader-ground">
                <rect x="0" y="-100" width="400" height={GROUND + 100} />
              </clipPath>
            </defs>

            {/* Ground: the trail line, soft shadows, a few tufts of grass */}
            <path d={`M44 ${GROUND} H356`} strokeWidth="1.5" opacity="0.25" />
            <ellipse cx={BIKE_X} cy={GROUND + 1.5} rx="64" ry="2.6" fill="currentColor" stroke="none" opacity="0.1" />
            <ellipse cx={PUMP_X - 22} cy={GROUND + 1.5} rx="40" ry="2.4" fill="currentColor" stroke="none" opacity="0.1" />
            <g className="stroke-muted" strokeWidth="1.1" opacity="0.7">
              <path d={`M64 ${GROUND} l1.5 -5 M67 ${GROUND} l0 -7 M70 ${GROUND} l-1 -4.5`} />
              <path d={`M332 ${GROUND} l1.5 -6 M335 ${GROUND} l0 -4 M338 ${GROUND} l-1.5 -5.5`} />
              <path d={`M190 ${GROUND} l1 -4 M193 ${GROUND} l-0.5 -5`} />
            </g>

            {/* The bike, its back wheel drawn separately so it can be flat */}
            <g data-part="bike" {...FIRST.bike}>
              <Bike scale={BIKE_SCALE} rear={false} />
            </g>
            {/* The ground clips the sagging tyre flat where it meets the trail */}
            <g clipPath="url(#loader-ground)">
              <ellipse data-part="tyre" {...FIRST.tyre} strokeWidth="2.4" />
              <ellipse data-part="knobs" {...FIRST.knobs} strokeWidth="1.7" strokeDasharray="2.5 3.7" />
              <g data-part="rim" {...FIRST.rim} strokeWidth="0.9">
                <path d="M-19 0H19M0 -19V19M-13.4 -13.4L13.4 13.4M-13.4 13.4L13.4 -13.4" />
                <circle r="3.2" fill="currentColor" stroke="none" />
              </g>
            </g>
            {/* Air at the valve on every push */}
            <g data-part="puff" {...FIRST.puff} className="stroke-accent" strokeWidth="1.3">
              <circle data-puff-dot cx="-8" cy="4" r="2.4" opacity="0" />
              <circle data-puff-dot cx="-4" cy="9" r="1.8" opacity="0" />
              <circle data-puff-dot cx="-12" cy="10" r="1.4" opacity="0" />
            </g>
            <path data-part="hose" {...FIRST.hose} strokeWidth="1.8" opacity="0.8" />

            {/* Floor pump: base, sliding rod and handle, barrel, gauge */}
            <rect x={PUMP_X - 15} y={GROUND - 3} width="30" height="3" rx="1.5" fill="currentColor" stroke="none" />
            <path data-part="rod" {...FIRST.rod} strokeWidth="1.8" />
            <path data-part="handle" {...FIRST.handle} strokeWidth="4.2" />
            <rect x={PUMP_X - 4.5} y={GROUND - 40} width="9" height="37" rx="4" className="fill-bg" strokeWidth="1.6" />
            <circle cx={PUMP_X} cy={GROUND - 16} r="7.5" className="fill-bg" strokeWidth="1.4" />
            <path d={`M${PUMP_X + 5} ${GROUND - 20.3} A7.5 7.5 0 0 1 ${PUMP_X + 6.4} ${GROUND - 16}`} className="stroke-accent" strokeWidth="2" />
            <path data-part="needle" {...FIRST.needle} className="stroke-accent" strokeWidth="1.4" />

            {/* The rider in kit: far side first, then the near side over it */}
            <g opacity="0.55">
              <path data-part="upper-arm-far" {...FIRST["upper-arm-far"]} className="stroke-accent" strokeWidth="5" />
              <path data-part="fore-arm-far" {...FIRST["fore-arm-far"]} stroke={SKIN} strokeWidth="4" />
              <path data-part="thigh-back" {...FIRST["thigh-back"]} strokeWidth="7.5" />
              <path data-part="shin-back" {...FIRST["shin-back"]} stroke={SKIN} strokeWidth="5" />
              <rect x={BACK_FOOT[0] - 6} y={BACK_FOOT[1] - 4.5} width="13" height="4.5" rx="2" fill="currentColor" stroke="none" />
            </g>
            <g data-part="pack" {...FIRST.pack}>
              <rect x="-4.5" y="-10" width="9" height="20" rx="3.5" fill="currentColor" stroke="none" />
            </g>
            <path data-part="torso" {...FIRST.torso} className="stroke-accent" strokeWidth="11" />
            <path data-part="thigh-front" {...FIRST["thigh-front"]} strokeWidth="7.5" />
            <path data-part="shin-front" {...FIRST["shin-front"]} stroke={SKIN} strokeWidth="5" />
            <rect x={FRONT_FOOT[0] - 4} y={FRONT_FOOT[1] - 4.5} width="13" height="4.5" rx="2" fill="currentColor" stroke="none" />
            <path data-part="neck" {...FIRST.neck} stroke={SKIN} strokeWidth="4" />
            <circle data-part="head" {...FIRST.head} r="6.5" fill={SKIN} strokeWidth="1.3" />
            <g data-part="helmet" {...FIRST.helmet}>
              <path d="M-8.2 0.6C-8.2 -7.4 7.8 -8.8 9.2 -1L12.8 0.3L8.6 1.1Z" fill="currentColor" strokeWidth="1" />
              <path d="M-5.5 -4.5C-2 -7 3 -7.2 6.5 -4.2" className="stroke-accent" strokeWidth="1.4" />
            </g>
            <path data-part="upper-arm" {...FIRST["upper-arm"]} className="stroke-accent" strokeWidth="5.5" />
            <path data-part="fore-arm" {...FIRST["fore-arm"]} stroke={SKIN} strokeWidth="4.2" />
            <circle data-part="hand" {...FIRST.hand} r="2.7" fill="currentColor" stroke="none" />
          </svg>
          <p className="relative mt-7 h-5 text-center">
            <span data-line="pumping" className="eyebrow absolute inset-0 text-muted">
              Pumping up the tyres&hellip;
            </span>
            <span data-line="ready" className="eyebrow absolute inset-0 inline-flex items-center justify-center gap-2 text-accent opacity-0">
              <svg viewBox="0 0 12 12" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path data-check d="M2 6.5l2.5 2.5L10 3.5" strokeDasharray="14" strokeDashoffset="14" />
              </svg>
              Ready to ride.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
