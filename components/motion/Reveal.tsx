"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * Fades and lifts its direct children once, as the block scrolls into view.
 * Used sparingly (section headings, small groups), never on every element.
 */
export function Reveal({
  children,
  className = "",
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.from(ref.current!.children, {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    });
  });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
