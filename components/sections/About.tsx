"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "@/components/motion/gsap";
import { Bike } from "@/components/ui/Bike";
import { placeOnPath, spinWheels } from "@/components/motion/path";
import { about, story } from "@/content/portfolio";
import { Kicker } from "@/components/ui/SectionHeader";

// Patna (east) to Delhi-NCR (north-west), drawn by hand rather than to scale.
const TRIP = "M262 128 C 220 150, 196 96, 160 108 S 112 150, 86 112 C 70 88, 92 70, 60 52 S 30 40, 26 30";
const BIKE_SCALE = 0.75;

/**
 * About: conversational and short. Paragraphs unmask line by line as you
 * read; beside them, a hand-drawn trip from Patna to Delhi-NCR. As the
 * section scrolls by, the bike rides it and the trail inks in behind it.
 */
export function About() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const trip = q<SVGPathElement>("[data-trip]")[0];
      const inked = q<SVGPathElement>("[data-inked]")[0];
      const bike = q<SVGGElement>("[data-rider]")[0];
      const len = trip.getTotalLength();
      const ride = { t: 0 };
      const place = () => {
        placeOnPath(trip, bike, ride.t, len, 44 * BIKE_SCALE);
        spinWheels(bike, ride.t * len, BIKE_SCALE);
        inked.style.strokeDashoffset = String(len * (1 - ride.t));
      };
      inked.style.strokeDasharray = String(len);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        ride.t = 1;
        place();
      });
      mm.add(MOTION_OK, () => {
        ride.t = 0;
        place();
        // Scroll rides the bike from Patna to Delhi-NCR.
        gsap.to(ride, {
          t: 1,
          ease: "none",
          onUpdate: place,
          scrollTrigger: { trigger: q("[data-map]")[0], start: "top 85%", end: "bottom 25%", scrub: 0.6 },
        });

        const splits = q<HTMLElement>("[data-para]").map((p) => {
          const split = SplitText.create(p, { type: "lines", mask: "lines" });
          gsap.from(split.lines, {
            yPercent: 100,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: { trigger: p, start: "top 85%", once: true },
            // Restore the plain paragraph so it reflows on resize.
            onComplete: () => split.revert(),
          });
          return split;
        });

        return () => splits.forEach((s) => s.revert());
      });
    },
    { scope: ref },
  );

  return (
    <section id="about" ref={ref} aria-labelledby="about-title" className="px-[var(--gutter)] py-[var(--section-space)]">
      <div className="grid gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow flex items-center gap-3 text-muted">
            <span className="display text-[1rem] normal-case italic tracking-normal text-accent">03</span>
            <span aria-hidden="true" className="h-px w-8 bg-line" />
            About
          </p>
          <Kicker>{story.about}</Kicker>
          <h2 id="about-title" className="display mt-3 text-section">
            <span className="font-extralight">A little</span>
            <br />
            <span className="italic">about me</span>
          </h2>

          <figure data-map className="mt-12 max-w-[24rem]">
            <svg viewBox="0 0 290 170" className="w-full overflow-visible" aria-hidden="true">
              {/* the whole trip, faint; the ridden part inks in over it */}
              <path data-trip d={TRIP} fill="none" className="stroke-line" strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
              <path data-inked d={TRIP} fill="none" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" />
              <g data-pin>
                <circle cx="262" cy="128" r="5" className="fill-ink" />
              </g>
              <g data-pin>
                <circle cx="26" cy="30" r="5" className="fill-accent" />
              </g>
              <text x="262" y="156" textAnchor="middle" className="display fill-ink text-[15px] italic">
                Patna
              </text>
              <text x="40" y="14" className="display fill-ink text-[15px] italic">
                Delhi-NCR
              </text>
              <g data-rider className="text-ink">
                {/* The trip heads west (leftwards): flip so the bike stays upright. */}
                <g transform="scale(1 -1)">
                  <Bike scale={BIKE_SCALE} />
                </g>
              </g>
            </svg>
            <figcaption className="mt-2 text-[0.9rem] text-muted">From home to where I study. Not to scale.</figcaption>
          </figure>
        </div>

        <div className="flex flex-col gap-6 text-lead lg:col-span-6 lg:col-start-7 lg:pt-4">
          {about.paragraphs.map((p) => (
            <p key={p} data-para>
              {p}
            </p>
          ))}

          <dl className="mt-8 grid gap-0 border-t border-line text-[1rem]">
            {about.education.map((e) => (
              <div key={e.degree} className="grid grid-cols-[4.5rem_1fr] gap-x-4 border-b border-line py-4 sm:grid-cols-[4.5rem_1fr_auto]">
                <dt className="display text-[1.35rem] italic leading-tight">{e.degree}</dt>
                <dd>{e.place}</dd>
                <dd className="col-start-2 text-muted sm:col-start-3">{e.period}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[1rem] text-muted">
            <span className="display mr-1 italic text-ink">Also —</span> {about.volunteering}
          </p>
        </div>
      </div>
    </section>
  );
}
