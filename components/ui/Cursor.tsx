"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";

// Only with a mouse, and only when motion is welcome.
const FINE = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const INTERACTIVE = "a, button, [role=button], label, select, summary, [data-magnetic]";
const TEXT = "input:not([type=radio]):not([type=checkbox]), textarea, [contenteditable=true]";

/**
 * A custom cursor: a cobalt dot that tracks the pointer exactly and a ring
 * that follows a beat behind. Over links and buttons the ring opens up;
 * over anything with data-cursor="…" it becomes a dark pill with that word
 * (e.g. "Open ↗" on project links, "Scroll" on the sideways Work strip).
 * Elements with data-magnetic lean towards the pointer. Over text fields the
 * system caret comes back. Touch screens and reduced motion keep the normal
 * cursor.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia(FINE);
    let cleanup: (() => void) | null = null;

    const enable = () => {
      const d = dot.current!;
      const r = ring.current!;
      const root = document.documentElement;
      root.classList.add("has-cursor");
      gsap.set([d, r], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
      const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
      const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });
      const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
      const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

      // Magnetic elements: each leans towards the pointer, then springs back.
      const pulls = new WeakMap<Element, { x: (v: number) => void; y: (v: number) => void }>();
      let magnet: HTMLElement | null = null;
      const pull = (el: HTMLElement) => {
        if (!pulls.has(el)) pulls.set(el, { x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" }) });
        return pulls.get(el)!;
      };

      const move = (e: PointerEvent) => {
        dx(e.clientX);
        dy(e.clientY);
        rx(e.clientX);
        ry(e.clientY);
        r.dataset.visible = d.dataset.visible = "true";
        if (magnet) {
          const b = magnet.getBoundingClientRect();
          pull(magnet).x((e.clientX - (b.left + b.width / 2)) * 0.3);
          pull(magnet).y((e.clientY - (b.top + b.height / 2)) * 0.3);
        }
      };

      const over = (e: PointerEvent) => {
        const t = e.target as Element;
        const text = t.closest(TEXT);
        const named = t.closest<HTMLElement>("[data-cursor]");
        const hit = t.closest(INTERACTIVE);
        const state = text ? "text" : named?.dataset.cursor ? "label" : hit ? "hover" : "idle";
        r.dataset.state = d.dataset.state = state;
        if (state === "label") label.current!.textContent = named!.dataset.cursor!;
        const m = t.closest<HTMLElement>("[data-magnetic]");
        if (m !== magnet) {
          if (magnet) {
            gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.45)", overwrite: true });
            pulls.delete(magnet);
          }
          magnet = m;
        }
      };
      const leave = () => (r.dataset.visible = d.dataset.visible = "false");
      const press = () => (r.dataset.pressed = "true");
      const release = () => (r.dataset.pressed = "false");

      window.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerover", over, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      window.addEventListener("pointerdown", press);
      window.addEventListener("pointerup", release);
      return () => {
        root.classList.remove("has-cursor");
        window.removeEventListener("pointermove", move);
        document.removeEventListener("pointerover", over);
        document.documentElement.removeEventListener("pointerleave", leave);
        window.removeEventListener("pointerdown", press);
        window.removeEventListener("pointerup", release);
        if (magnet) gsap.set(magnet, { x: 0, y: 0 });
      };
    };

    const sync = () => {
      cleanup?.();
      cleanup = mq.matches ? enable() : null;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cleanup?.();
    };
  }, []);

  // Two layers each: the outer one is moved by GSAP (which owns its
  // transform), the inner one changes size, colour and scale by state.
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[96] hidden [.has-cursor_&]:block">
      <div ref={ring} data-state="idle" data-visible="false" className="group fixed left-0 top-0">
        <div className="grid size-9 place-items-center rounded-full border border-ink/35 opacity-0 transition-[width,height,background-color,border-color,opacity,scale] duration-300 ease-out group-data-[visible=true]:opacity-100 group-data-[pressed=true]:scale-[0.82] group-data-[state=hover]:size-14 group-data-[state=hover]:border-accent group-data-[state=hover]:bg-accent/10 group-data-[state=label]:size-[5.25rem] group-data-[state=label]:border-transparent group-data-[state=label]:bg-ink group-data-[state=text]:scale-0">
          <span
            ref={label}
            className="eyebrow whitespace-nowrap text-[0.68rem] text-bg opacity-0 transition-opacity duration-200 group-data-[state=label]:opacity-100"
          />
        </div>
      </div>
      <div ref={dot} data-state="idle" data-visible="false" className="group fixed left-0 top-0">
        <div className="size-1.5 rounded-full bg-accent opacity-0 transition-[opacity,scale] duration-200 group-data-[visible=true]:opacity-100 group-data-[state=hover]:scale-0 group-data-[state=label]:scale-0 group-data-[state=text]:scale-0" />
      </div>
    </div>
  );
}
