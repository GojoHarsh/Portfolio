"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { Reveal } from "@/components/motion/Reveal";
import { useSmoothScroll } from "@/components/layout/SmoothScroll";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { aiToolbox, story, strengths, toolbox } from "@/content/portfolio";

/**
 * What I bring: four strengths, each linked to the work on this page that
 * shows it, then the toolkit written as a sentence (no logo grid, no skill
 * bars). The tools are named once, here; each project lists its own stack.
 */
export function Strengths() {
  const ref = useRef<HTMLElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Each strength: its rule draws across, then its lines rise in.
        // Neighbours in a row start a beat apart.
        gsap.utils.toArray<HTMLElement>("[data-strength]", ref.current).forEach((el, i) => {
          const delay = (i % 2) * 0.12;
          gsap
            .timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } })
            .fromTo(el.querySelector("[data-rule]"), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "power3.inOut" }, delay)
            .fromTo(
              el.querySelectorAll("[data-rise]"),
              { y: 22, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.07 },
              delay + 0.2,
            );
        });
      });
    },
    { scope: ref },
  );

  const jump = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    scrollTo(target);
  };

  return (
    <section id="what-i-bring" ref={ref} aria-labelledby="bring-title" className="px-[var(--gutter)] py-[var(--section-space)]">
      <SectionHeader
        index="01"
        label="What I bring"
        id="bring-title"
        kicker={story.bring}
        title={
          <>
            {strengths.title.plain} <span className="italic">{strengths.title.em}</span>
            <span className="text-accent">.</span>
          </>
        }
        aside={strengths.intro}
      />

      <ol className="mt-12 grid gap-x-14 gap-y-12 sm:mt-16 sm:grid-cols-2 sm:gap-y-16 lg:mt-20 lg:gap-x-20">
        {strengths.items.map((item, i) => (
          <li key={item.title.em} data-strength className="group/strength relative flex flex-col pt-6 sm:pt-7">
            <span
              data-rule
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px origin-left bg-line transition-colors duration-500 group-hover/strength:bg-ink"
            />
            <div data-rise className="flex items-baseline justify-between gap-4">
              <span className="display text-[1.05rem] italic text-accent">0{i + 1}</span>
              <a
                href={item.proof.href}
                onClick={(e) => jump(e, item.proof.href)}
                className="group inline-flex items-baseline gap-1.5 text-[0.9rem] text-muted transition-colors hover:text-ink"
              >
                <span className="u-link">{item.proof.label}</span>
                <span aria-hidden="true" className="transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:translate-y-0.5">
                  ↘
                </span>
              </a>
            </div>
            <h3 data-rise className="display mt-4 text-[clamp(1.6rem,1.15rem+1.4vw,2.4rem)] leading-[1.08]">
              {item.title.plain}{" "}
              <span className="italic transition-colors duration-500 group-hover/strength:text-accent">{item.title.em}</span>
            </h3>
            <p data-rise className="mt-4 max-w-[34rem] text-[1.05rem] leading-relaxed">
              {item.text}
            </p>
          </li>
        ))}
      </ol>

      {/* The toolkit, read as a sentence; each tool set in italic. */}
      <Reveal className="mt-20 grid gap-8 border-t border-line pt-10 sm:mt-24 lg:mt-28 lg:grid-cols-12 lg:pt-14">
        <h3 className="eyebrow self-start text-muted lg:col-span-4 lg:pt-3">Things I like working with</h3>
        <div className="lg:col-span-8">
          <p className="display max-w-[46rem] text-statement font-light">
            {toolbox.map((group, g) => (
              <span key={g}>
                {group.lead}{" "}
                {group.tools.map((tool, t) => {
                  const n = group.tools.length;
                  // Punctuation stays on the tool's line; spaces are where lines may break.
                  const after = t < n - 2 ? "," : t === n - 1 ? (g === 1 ? ";" : ".") : "";
                  return (
                    <span key={tool}>
                      <span className="whitespace-nowrap">
                        <Tool>{tool}</Tool>
                        {after}
                      </span>
                      {t === n - 2 ? " and " : " "}
                    </span>
                  );
                })}
              </span>
            ))}
          </p>

          {/* A small category of its own: tools and practices, not a language */}
          <div className="mt-10 max-w-[46rem] border-t border-line pt-6">
            <p className="eyebrow text-muted">{aiToolbox.label}</p>
            <p className="display mt-3 text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-light leading-[1.35]">
              {aiToolbox.parts.map((part, p) => {
                const next = aiToolbox.parts[p + 1];
                const mark = typeof next === "string" ? (next.match(/^[.,;:]/)?.[0] ?? "") : "";
                if (typeof part === "string") {
                  const prev = aiToolbox.parts[p - 1];
                  // A leading mark was already set beside the tool before it.
                  return <span key={p}>{typeof prev !== "string" ? part.replace(/^[.,;:]/, "") : part}</span>;
                }
                return (
                  <span key={p} className="whitespace-nowrap">
                    <Tool>{part.tool}</Tool>
                    {mark}
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/** A tool's name: italic, and it lifts a little on hover. */
function Tool({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-normal italic transition-[color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:-rotate-2 hover:text-accent">
      {children}
    </span>
  );
}
