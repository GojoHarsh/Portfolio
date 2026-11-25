"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { resolveHorizontal } from "@/components/motion/hscroll";

type ScrollContextValue = {
  scrollTo: (target: string | HTMLElement) => void;
  stop: () => void;
  start: () => void;
};

const ScrollContext = createContext<ScrollContextValue | null>(null);

/**
 * Lenis smooth scrolling, driven by the GSAP ticker so ScrollTrigger and
 * Lenis share one frame loop. Lenis stays idle when nothing scrolls.
 * Not created under prefers-reduced-motion; touch devices keep native scroll.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // In-page links call scrollTo() below themselves (it knows about the
    // horizontal Work section), so Lenis's own anchor handling stays off.
    const lenis = new Lenis({ duration: 1.1, autoRaf: false });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: string | HTMLElement) => {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    const lenis = lenisRef.current;
    const horizontal = resolveHorizontal(el);
    if (horizontal !== null) {
      if (lenis) lenis.scrollTo(horizontal, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: horizontal, behavior: "smooth" });
      return;
    }
    if (lenis) {
      // Pin spacers are part of layout, so the element's offset is already correct.
      const header = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      lenis.scrollTo(el, { offset: -header, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    }
  }, []);

  const stop = useCallback(() => lenisRef.current?.stop(), []);
  const start = useCallback(() => lenisRef.current?.start(), []);

  return <ScrollContext.Provider value={{ scrollTo, stop, start }}>{children}</ScrollContext.Provider>;
}

export function useSmoothScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useSmoothScroll must be used inside <SmoothScroll>");
  return ctx;
}
