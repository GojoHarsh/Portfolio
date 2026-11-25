"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/components/motion/gsap";
import { contact, story } from "@/content/portfolio";
import { Postcard } from "./contact/Postcard";

/**
 * The ending. "Let's make something." rises in two lines, once, over a
 * postcard that starts the email, and the narrator signs off. Below this,
 * the page lifts away like a curtain to show the name (SiteFooter).
 */
export function Contact() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(ref);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Two lines rise into place once, the way a sentence is read.
        gsap.from(q("[data-line] > span"), {
          yPercent: 105,
          duration: 1,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: q("#contact-title")[0], start: "top 80%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section id="contact" ref={ref} aria-labelledby="contact-title" className="relative px-[var(--gutter)] py-[var(--section-space)]">
      <p className="eyebrow flex items-center gap-3 text-muted">
        <span className="display text-[1rem] normal-case italic tracking-normal text-accent">05</span>
        <span aria-hidden="true" className="h-px w-8 bg-line" />
        Contact
      </p>
      <p className="display mt-6 text-[clamp(1.2rem,1rem+0.8vw,1.6rem)] italic text-muted">{contact.kicker}</p>
      <h2 id="contact-title" className="display mt-3 text-[clamp(3rem,1.6rem+6.4vw,7.5rem)] leading-[0.98]">
        <span data-line className="block overflow-hidden pb-[0.08em]">
          <span className="block">Let&rsquo;s make</span>
        </span>
        <span data-line className="block overflow-hidden pb-[0.12em]">
          <span className="block italic text-accent">something.</span>
        </span>
      </h2>

      <div className="mt-12 lg:mt-16">
        <Postcard />
      </div>

      <p className="display mt-16 text-[clamp(1.1rem,1rem+0.5vw,1.4rem)] italic sm:mt-20">{story.end}</p>
    </section>
  );
}
