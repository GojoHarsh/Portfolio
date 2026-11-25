"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { INTRO_EVENT } from "@/components/motion/intro";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { Bike } from "@/components/ui/Bike";
import { BIKE_SCALE, geometry, GROUND, pose, PUMP_X, type Part } from "./pump";

const STROKES = 3;
// The first paint (before any script runs) already shows the scene: flat tyre, handle up.
const FIRST = geometry(0, 0);

/**
 * The prologue, about 2.3s, on every page load: the bike's back tyre is
 * flat, and a rider pumps it up. Each push of the handle lifts the gauge
 * needle and rounds out the tyre (the bike levels as it fills); at full
 * pressure the line changes to "Ready to ride." and the page peels away
 * from its bottom-right corner, revealing the hero.
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
        gsap.to(el, { autoAlpha: 0, duration: 0.35, delay: 0.6, onStart: announce, onComplete: finish });
        return;
      }

      // The peel: P is where the diagonal cut crosses the right/bottom edges.
      const peel = { p: 100 };
      const sheet = q<HTMLElement>("[data-sheet]")[0];
      const edge = q<HTMLElement>("[data-edge]")[0];
      const setClip = () => {
        const p = peel.p;
        const e = Math.min(100, p + 7);
        sheet.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${p}%, ${p}% 100%, 0% 100%)`;
        edge.style.clipPath = `polygon(0% 0%, 100% 0%, 100% ${e}%, ${e}% 100%, 0% 100%)`;
      };

      draw();
      const tl = gsap.timeline({ onComplete: finish, onUpdate: draw });
      tl.fromTo(q("[data-scene]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0).fromTo(
        q("[data-line=pumping]"),
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        0.05,
      );
      // Three pushes: down hard, the tyre takes the air (with a little
      // springiness), a hiss at the valve, then the handle comes back up.
      for (let i = 1; i <= STROKES; i++) {
        tl.to(state, { k: 1, duration: 0.19, ease: "power2.in" })
          .to(state, { air: i / STROKES, duration: 0.3, ease: "back.out(2.2)" }, "<0.12")
          .fromTo(q("[data-hiss]"), { opacity: 1, scale: 0.6 }, { opacity: 0, scale: 1.5, transformOrigin: "100% 0%", duration: 0.32, ease: "power2.out" }, "<")
          .to(state, { k: 0, duration: 0.17, ease: "power2.out" }, "<0.07");
      }
      // Full: the rider straightens up and the line changes.
      tl.to(state, { k: -0.15, duration: 0.25, ease: "power2.out" })
        .to(q("[data-line=pumping]"), { opacity: 0, y: -6, duration: 0.2 }, "<")
        .fromTo(q("[data-line=ready]"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, "<0.1")
        .add(announce, "+=0.15")
        .to(peel, { p: -110, duration: 0.7, ease: "power3.inOut", onUpdate: setClip }, "<-0.1");
    },
    { dependencies: [] },
  );

  return (
    <div ref={ref} className="loader fixed inset-0 z-[95]" aria-hidden="true">
      {/* Accent band that trails the peeling edge */}
      <div data-edge className="absolute inset-0 bg-accent" />
      <div data-sheet className="absolute inset-0 grid place-items-center bg-bg px-6">
        <div className="w-full max-w-[29rem]">
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
            <path d={`M40 ${GROUND} H360`} strokeWidth="1.5" opacity="0.3" />

            {/* The bike, its back wheel drawn separately so it can be flat */}
            <g data-part="bike" {...FIRST.bike}>
              <Bike scale={BIKE_SCALE} rear={false} />
            </g>
            {/* The ground clips the sagging tyre flat where it meets the trail */}
            <g clipPath="url(#loader-ground)">
              <ellipse data-part="tyre" {...FIRST.tyre} strokeWidth="2.25" />
              <ellipse data-part="knobs" {...FIRST.knobs} strokeWidth="1.65" strokeDasharray="2.5 3.7" />
              <g data-part="rim" {...FIRST.rim} strokeWidth="0.9">
                <path d="M-19 0H19M0 -19V19M-13.4 -13.4L13.4 13.4M-13.4 13.4L13.4 -13.4" />
                <circle r="3.2" fill="currentColor" stroke="none" />
              </g>
            </g>
            <g data-part="puff" {...FIRST.puff}>
              <g data-hiss opacity="0" className="stroke-accent" strokeWidth="1.4">
                <path d="M-5 3l-5 2M-4 7l-4 4M-1 8l-1 5" />
              </g>
            </g>
            <path data-part="hose" {...FIRST.hose} strokeWidth="1.6" opacity="0.75" />

            {/* Floor pump: base, sliding rod and handle, barrel, gauge */}
            <rect x={PUMP_X - 15} y={GROUND - 3} width="30" height="3" rx="1.5" fill="currentColor" stroke="none" />
            <path data-part="rod" {...FIRST.rod} strokeWidth="1.8" />
            <path data-part="handle" {...FIRST.handle} strokeWidth="4" />
            <rect x={PUMP_X - 4.5} y={GROUND - 40} width="9" height="37" rx="4" className="fill-bg" strokeWidth="1.6" />
            <circle cx={PUMP_X} cy={GROUND - 16} r="7.5" className="fill-bg" strokeWidth="1.4" />
            <path d={`M${PUMP_X + 5} ${GROUND - 20.3} A7.5 7.5 0 0 1 ${PUMP_X + 6.4} ${GROUND - 16}`} className="stroke-accent" strokeWidth="2" />
            <path data-part="needle" {...FIRST.needle} className="stroke-accent" strokeWidth="1.4" />

            {/* The rider, in kit: helmet on */}
            <path data-part="arm-far" {...FIRST["arm-far"]} strokeWidth="3" opacity="0.45" />
            <path data-part="leg-back" {...FIRST["leg-back"]} strokeWidth="3.6" opacity="0.55" />
            <path data-part="leg-front" {...FIRST["leg-front"]} strokeWidth="3.6" />
            <path data-part="torso" {...FIRST.torso} strokeWidth="5.5" />
            <path data-part="arm" {...FIRST.arm} strokeWidth="3" />
            <circle data-part="head" {...FIRST.head} r="6.5" className="fill-bg" strokeWidth="1.8" />
            <g data-part="helmet" {...FIRST.helmet}>
              <path d="M-8 0.5C-8 -7 7.5 -8.5 9 -1L12.5 0.2L8.5 1Z" fill="currentColor" strokeWidth="1" />
            </g>
          </svg>
          <p className="relative mt-6 h-5 text-center">
            <span data-line="pumping" className="eyebrow absolute inset-0 text-muted">
              Pumping up the tyres&hellip;
            </span>
            <span data-line="ready" className="eyebrow absolute inset-0 text-accent opacity-0">
              Ready to ride.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
