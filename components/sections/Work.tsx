"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { setHorizontalResolver } from "@/components/motion/hscroll";
import { spinWheels } from "@/components/motion/path";
import { Bike } from "@/components/ui/Bike";
import { projects, story } from "@/content/portfolio";
import { Kicker } from "@/components/ui/SectionHeader";
import { canRender3D } from "@/lib/webgl";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { AdiraCase } from "./work/AdiraCase";
import { EdemyCase } from "./work/EdemyCase";
import { EnrichmentCase } from "./work/EnrichmentCase";
import { GoCartCase } from "./work/GoCartCase";

// The 3D ride (three.js + React Three Fiber) loads only when it will be shown.
const TrailRide = dynamic(() => import("@/components/three/TrailRide"), { ssr: false });

// Horizontal mode needs room: a laptop-sized screen and no reduced motion.
const HORIZONTAL = "(min-width: 1024px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)";
const STACKED = "not all and (min-width: 1024px) and (min-height: 480px) and (prefers-reduced-motion: no-preference)";

/**
 * Selected work. On laptops and up the section pins and vertical scroll
 * slides the projects sideways, one panel at a time, with a bike riding the
 * progress line underneath (a 3D mountain bike on a dirt trail where WebGL is
 * available, the drawn bike otherwise); at the last panel the pin releases and the page
 * scrolls down again. On phones, small windows or with reduced motion the
 * panels simply stack.
 */
export function Work() {
  const ref = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();
  const progress = useRef(0);
  const redraw = useRef<(() => void) | null>(null);
  const [ride3d, setRide3d] = useState(false);
  const [live3d, setLive3d] = useState(false);
  const onReady = useCallback((invalidate: () => void) => {
    redraw.current = invalidate;
    setLive3d(true);
  }, []);

  useGSAP(
    () => {
      const section = ref.current!;
      const q = gsap.utils.selector(section);
      const pin = q<HTMLElement>("[data-pin]")[0];
      const track = q<HTMLElement>("[data-track]")[0];
      const panels = q<HTMLElement>("[data-panel]");
      const counter = q<HTMLElement>("[data-counter]")[0];
      const rider = q<SVGGElement>("[data-rider]")[0];
      const line = q<HTMLElement>("[data-progress]")[0];
      const mm = gsap.matchMedia();

      mm.add(HORIZONTAL, () => {
        section.dataset.h = "on";
        setRide3d(canRender3D());
        const distance = () => Math.max(0, track.scrollWidth - pin.clientWidth);
        // Resting points: the scroll progress at which each panel is aligned.
        // One array, refilled on refresh, so snapping stays directional.
        const stops: number[] = [];
        const measureStops = () => {
          stops.length = 0;
          panels.forEach((p) => stops.push(Math.min(1, (p.offsetLeft - panels[0].offsetLeft) / (distance() || 1))));
        };
        measureStops();

        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            pin: true,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            // Settle on the nearest panel when scrolling stops, so every
            // project is read fully in view rather than half-way past.
            // Directional: a deliberate scroll moves on to the next panel, but
            // landing (almost) on a panel, e.g. from a link, stays there.
            snap: {
              snapTo: (value: number, self?: ScrollTrigger) => {
                const near = stops.reduce((a, b) => (Math.abs(b - value) < Math.abs(a - value) ? b : a));
                if (Math.abs(near - value) < 0.03 || !self) return near;
                const ahead = self.direction > 0 ? stops.find((t) => t > value) : [...stops].reverse().find((t) => t < value);
                return ahead ?? near;
              },
              duration: { min: 0.3, max: 0.8 },
              delay: 0.1,
              ease: "power2.inOut",
            },
            onRefresh: measureStops,
            onUpdate: (self) => {
              const p = self.progress;
              progress.current = p;
              redraw.current?.();
              const travel = line.clientWidth - 64;
              rider.parentElement!.style.transform = `translateX(${(p * travel).toFixed(1)}px)`;
              spinWheels(rider, p * travel, 1);
              counter.textContent = String(Math.min(panels.length, Math.round(p * (panels.length - 1)) + 1)).padStart(2, "0");
            },
          },
        });

        // Each panel's content slides in as the panel arrives; prints drift.
        panels.forEach((panel, i) => {
          gsap.from(panel.querySelectorAll("[data-reveal-in]"), {
            x: 70,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger:
              i === 0
                ? { trigger: pin, start: "top 70%", once: true }
                : { trigger: panel, containerAnimation: tween, start: "left 75%", once: true },
          });
          panel.querySelectorAll("[data-parallax]").forEach((el) => {
            gsap.fromTo(
              el,
              { xPercent: 10 },
              {
                xPercent: -10,
                ease: "none",
                scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
              },
            );
          });
        });

        // Links to a project land on its panel: scroll = pin start + its offset.
        setHorizontalResolver((el) => {
          const panel = el.closest<HTMLElement>("[data-panel]") ?? (el.matches("[data-panel]") ? el : null);
          if (!panel || !tween.scrollTrigger) return null;
          const first = panels[0].offsetLeft;
          return tween.scrollTrigger.start + Math.min(distance(), panel.offsetLeft - first);
        });

        // Keyboard focus inside an off-screen panel: the pin is overflow:clip
        // (not a scroll container), so the browser can't slide it sideways;
        // instead move the page to the panel being focused.
        const onFocus = (e: FocusEvent) => {
          const target = e.target as HTMLElement;
          const panel = target.closest<HTMLElement>("[data-panel]");
          // After the browser's own focus scroll has happened.
          if (panel && !panel.contains(e.relatedTarget as Node | null)) window.setTimeout(() => scrollTo(panel), 60);
        };
        pin.addEventListener("focusin", onFocus);

        return () => {
          pin.removeEventListener("focusin", onFocus);
          setRide3d(false);
          setLive3d(false);
          redraw.current = null;
          setHorizontalResolver(null);
          section.dataset.h = "off";
        };
      });

      mm.add(STACKED, () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        panels.forEach((panel) =>
          gsap.from(panel.querySelectorAll("[data-reveal-in]"), {
            y: 30,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: { trigger: panel, start: "top 80%", once: true },
          }),
        );
      });

      // Layout switched modes; let every later ScrollTrigger re-measure.
      ScrollTrigger.refresh();
    },
    { scope: ref },
  );

  return (
    <section id="work" ref={ref} data-h="off" aria-labelledby="work-title" className="relative">
      <div
        data-pin
        className="flex flex-col overflow-clip py-[var(--section-space)] [[data-h=on]_&]:h-svh [[data-h=on]_&]:pb-3 [[data-h=on]_&]:pt-[calc(var(--nav-h)+0.75rem)]"
      >
        <header className="flex flex-wrap items-end justify-between gap-6 px-[var(--gutter)] [[data-h=on]_&]:items-center">
          <div className="[[data-h=on]_&]:flex [[data-h=on]_&]:items-baseline [[data-h=on]_&]:gap-6">
            <p className="eyebrow flex items-center gap-3 text-muted">
              <span className="display text-[1rem] normal-case italic tracking-normal text-accent">02</span>
              <span aria-hidden="true" className="h-px w-8 bg-line" />
              Work
            </p>
            {/* In the pinned, sideways mode the header is one compact line; the
                "ride goes sideways" note on the right carries the story there. */}
            <Kicker className="[[data-h=on]_&]:hidden">{story.work}</Kicker>
            <h2 id="work-title" className="display mt-3 text-section [[data-h=on]_&]:mt-0 [[data-h=on]_&]:text-[clamp(1.75rem,1rem+1.6vw,2.6rem)]">
              Selected <span className="italic font-light">work</span>
            </h2>
          </div>
          <p className="hidden items-baseline gap-4 text-muted [[data-h=on]_&]:flex">
            <span className="eyebrow">Keep scrolling, the ride goes sideways</span>
            <span className="display text-[1.5rem] italic text-ink">
              <span data-counter>01</span>
              <span className="text-muted"> / {String(projects.length).padStart(2, "0")}</span>
            </span>
          </p>
        </header>

        <div
          data-track
          className="mt-10 flex flex-col gap-20 px-[var(--gutter)] sm:mt-14 sm:gap-24 [[data-h=on]_&]:mt-4 [[data-h=on]_&]:min-h-0 [[data-h=on]_&]:w-max [[data-h=on]_&]:flex-1 [[data-h=on]_&]:flex-row [[data-h=on]_&]:gap-[6vw]"
        >
          <EnrichmentCase project={projects[0]} />
          <GoCartCase project={projects[1]} />
          <EdemyCase project={projects[2]} />
          <AdiraCase project={projects[3]} />
        </div>

        {/* Progress: a 3D bike rides a dirt trail as the panels slide by */}
        {ride3d ? (
          <div
            aria-hidden="true"
            className="relative mt-2 h-[clamp(80px,13svh,120px)] shrink-0 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
          >
            <TrailRide progress={progress} onReady={onReady} />
          </div>
        ) : null}
        {/* Fallback (and placeholder while 3D loads): the drawn bike on a line */}
        <div
          aria-hidden="true"
          className={`relative mx-[var(--gutter)] mt-3 hidden h-10 [[data-h=on]_&]:block ${live3d ? "!hidden" : ""}`}
        >
          <div data-progress className="absolute inset-x-0 bottom-0 h-px bg-line" />
          <div className="absolute bottom-0 left-0 will-change-transform">
            <svg viewBox="-32 -36 64 38" className="h-9 w-16 overflow-visible text-ink">
              <g data-rider>
                <Bike scale={1} />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
