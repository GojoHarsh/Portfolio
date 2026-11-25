"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/components/motion/gsap";
import { onIntro } from "@/components/motion/intro";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { LocalTime } from "@/components/ui/LocalTime";
import { hero, person } from "@/content/portfolio";

/**
 * Hero: says who Harsh is in one read: a greeting, a three-line statement
 * (light / swelling bold / accent italic), a short intro with two CTAs.
 * The projects aren't listed here; the cue at the bottom starts the ride
 * through the sections, where each one is told once. Scrolling away parts
 * the statement's lines.
 */
export function Hero() {
  const scope = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        let split: SplitText | null = null;
        const cancel = onIntro(() => {
          split = SplitText.create(q("[data-intro-copy]"), { type: "lines", mask: "lines" });
          gsap
            .timeline({
              defaults: { ease: "power4.out" },
              onComplete: () => {
                split?.revert();
                split = null;
              },
            })
            .fromTo(q("[data-eyebrow]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0)
            .fromTo(q("[data-greet]"), { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.9 }, 0.05)
            .fromTo(q("[data-line] > span"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.15)
            .fromTo(q("[data-heavy]"), { "--wght": 300 }, { "--wght": 750, duration: 1.4, ease: "power3.out" }, 0.4)
            .fromTo(split.lines, { yPercent: 100 }, { yPercent: 0, duration: 0.9, stagger: 0.07 }, 0.5)
            .fromTo(q("[data-cta]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.7)
            .fromTo(q("[data-cue]"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1)
            .fromTo(q("[data-cue-line]"), { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "power3.inOut" }, 1.1);
        });

        // The cue has done its job once the ride has started.
        gsap.to(q("[data-cue] > span"), {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: scope.current, start: "top top", end: "15% top", scrub: true },
        });

        // Scrolling away parts the statement: the outer lines drift apart.
        const lines = q("[data-line]");
        gsap
          .timeline({ scrollTrigger: { trigger: scope.current, start: "top top", end: "bottom top", scrub: 0.6 } })
          .to(lines[0], { xPercent: -5, ease: "none" }, 0)
          .to(lines[2], { xPercent: 5, ease: "none" }, 0);

        return () => {
          cancel();
          split?.revert();
        };
      });
    },
    { scope },
  );

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    scrollTo(target);
  };

  return (
    <section
      ref={scope}
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col overflow-x-clip px-[var(--gutter)] pb-8 pt-[calc(var(--nav-h)+1.25rem)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-muted">
        <p data-eyebrow data-intro className="eyebrow">
          {hero.eyebrow}
        </p>
        <p data-eyebrow data-intro className="eyebrow flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" className="size-3 text-accent" aria-hidden="true">
            <path d="M6 11s4-3.6 4-6.5A4 4 0 0 0 2 4.5C2 7.4 6 11 6 11Z" fill="currentColor" />
          </svg>
          {person.location}
          <span aria-hidden="true">·</span>
          <LocalTime />
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center py-10 lg:py-6">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-8">
            <p data-greet data-intro className="display text-[clamp(1.25rem,1rem+1vw,1.9rem)] italic text-muted">
              {hero.greeting}
            </p>
            <h1 id="hero-title" className="display mt-3 text-[clamp(2.6rem,1rem+6.4vw,8.25rem)] leading-[1]">
              <span className="sr-only">{hero.headline.join(" ")}</span>
              <span aria-hidden="true">
                <span data-line data-intro className="block overflow-hidden pb-[0.05em]">
                  <span className="block font-light">{hero.headline[0]}</span>
                </span>
                <span data-line data-intro className="-mb-[0.08em] block overflow-hidden pb-[0.12em]">
                  <span data-heavy className="swell block [--wght:750]">
                    {hero.headline[1]}
                  </span>
                </span>
                <span data-line data-intro className="block overflow-hidden pb-[0.12em]">
                  <span className="block italic text-accent">{hero.headline[2]}</span>
                </span>
              </span>
            </h1>
          </div>

          <div className="max-w-[30rem] lg:col-span-4 lg:pb-3">
            <p data-intro-copy data-intro className="text-lead">
              {hero.intro}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                data-cta
                data-intro
                href="#work"
                onClick={(e) => jump(e, "#work")}
                className="group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-2 text-bg transition-colors duration-300 hover:bg-accent hover:text-on-accent"
              >
                Explore my work
                <span className="grid size-8 place-items-center rounded-full bg-bg text-ink transition-transform duration-500 ease-out group-hover:rotate-[-45deg]">
                  →
                </span>
              </a>
              <a data-cta data-intro href="#play" onClick={(e) => jump(e, "#play")} className="u-link py-1 text-muted hover:text-ink">
                or skip to the game ↓
              </a>
            </div>
          </div>
        </div>
      </div>

      <a
        data-cue
        data-intro
        href="#what-i-bring"
        onClick={(e) => jump(e, "#what-i-bring")}
        className="group flex w-fit items-center gap-3 text-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true" className="relative h-10 w-px overflow-hidden bg-line">
          <span data-cue-line className="absolute inset-0 origin-top bg-accent" />
        </span>
        <span className="eyebrow">{hero.cue}</span>
      </a>
    </section>
  );
}
