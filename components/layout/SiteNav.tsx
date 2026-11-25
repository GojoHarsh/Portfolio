"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Corner } from "@/components/ui/Corner";
import { useSmoothScroll } from "./SmoothScroll";
import { nav, person } from "@/content/portfolio";

/**
 * Fixed top navigation. Transparent over the hero; once you scroll it gains
 * the page colour, and its bottom edge becomes the route: one even segment
 * per section, each filling as that section is read (so the long, pinned
 * Work section doesn't squash the others). Desktop shows the links inline;
 * small screens get a full-screen <dialog> menu (native focus trap, Esc
 * closes). Plain anchors underneath, so it works without JS.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const tops = useRef<number[]>([]);
  const { scrollTo, stop, start } = useSmoothScroll();

  useEffect(() => {
    // Active section: the last one whose top has passed the middle of the
    // viewport. Works for jumps and pinned sections alike.
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const mid = window.innerHeight / 2;
      let current: string | null = null;
      for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s.id;
      setActive(current);
      // The route: how much of each section has been read, measured at
      // the middle of the viewport, like the active link.
      const route = routeRef.current;
      if (route && tops.current.length) {
        const at = window.scrollY + mid;
        route.querySelectorAll<HTMLElement>("[data-segment]").forEach((seg, i) => {
          const from = tops.current[i];
          const to = tops.current[i + 1];
          seg.style.setProperty("--fill", Math.min(1, Math.max(0, (at - from) / Math.max(1, to - from))).toFixed(4));
        });
      }
    };
    // Where each section starts (and where the last one ends); re-measured
    // whenever the page changes height (fonts, images, the pinned Work section).
    const measure = () => {
      const doc = document.documentElement;
      tops.current = [
        ...nav.map((item) => {
          const el = document.getElementById(item.id);
          return el ? el.getBoundingClientRect().top + window.scrollY : 0;
        }),
        doc.scrollHeight - window.innerHeight / 2,
      ];
      onScroll();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    dialogRef.current?.close();
    start();
    scrollTo(`#${id}`);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <header
      data-site-header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500 ${
        scrolled ? "bg-bg shadow-[0_1px_0_var(--line)]" : "bg-transparent"
      }`}
    >
      {/* The route along the header's bottom edge (decorative; the links carry the meaning) */}
      <div
        ref={routeRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 -bottom-px flex h-[2px] gap-1 px-[var(--gutter)] transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
      >
        {nav.map((item) => (
          <span key={item.id} data-segment className="relative h-full flex-1 overflow-hidden rounded-full bg-line">
            <span className="absolute inset-0 origin-left scale-x-[var(--fill,0)] rounded-full bg-accent" />
          </span>
        ))}
      </div>

      <nav aria-label="Main" className="flex h-[var(--nav-h)] items-center justify-between gap-4 px-[var(--gutter)]">
        <a
          href="#top"
          onClick={(e) => go(e, "top")}
          className="group flex items-center gap-2"
          aria-label="Harsh Kumar, back to top"
        >
          <Corner className="size-6 transition-transform duration-500 ease-out group-hover:-rotate-12" />
          <span className="display text-[1.35rem] font-semibold italic leading-none">
            harsh<span className="text-accent">.</span>
          </span>
        </a>

        <div className="flex items-center gap-2 sm:gap-6">
          <ul className="hidden items-center gap-6 md:flex">
            {nav.filter((item) => item.id !== "contact").map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => go(e, item.id)}
                  aria-current={active === item.id ? "true" : undefined}
                  className={`u-link py-1 text-[0.95rem] transition-colors ${active === item.id ? "text-ink [background-size:100%_1px]" : "text-muted hover:text-ink"}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemeToggle />
          {/* The one action that matters, always in reach on desktop */}
          <a
            href="#contact"
            data-magnetic
            onClick={(e) => go(e, "contact")}
            aria-current={active === "contact" ? "true" : undefined}
            className="hidden h-11 items-center rounded-full bg-ink px-5 text-[0.95rem] text-bg transition-colors duration-300 hover:bg-accent hover:text-on-accent md:inline-flex"
          >
            Say hello
          </a>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.showModal();
              stop();
            }}
            aria-haspopup="dialog"
            className="grid h-11 place-items-center rounded-full border border-line px-4 text-[0.95rem] md:hidden"
          >
            Menu
          </button>
        </div>
      </nav>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={start}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-ink opacity-100 transition-[opacity,display,overlay] transition-discrete duration-300 backdrop:bg-transparent not-open:opacity-0 starting:open:opacity-0 md:hidden"
      >
        <div className="flex h-full flex-col px-[var(--gutter)]">
          <div className="flex h-[var(--nav-h)] items-center justify-between">
            <span className="display text-[1.35rem] font-semibold italic">
              harsh<span className="text-accent">.</span>
            </span>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="grid h-11 place-items-center rounded-full border border-line px-4 text-[0.95rem]"
            >
              Close
            </button>
          </div>
          <ul className="mt-10 flex flex-col gap-1">
            {nav.map((item, i) => (
              <li
                key={item.id}
                style={{ transitionDelay: `${60 + i * 45}ms` }}
                className="transition-[translate,opacity] duration-500 ease-out starting:translate-y-4 starting:opacity-0"
              >
                <a href={`#${item.id}`} onClick={(e) => go(e, item.id)} className="flex items-baseline gap-4 py-2">
                  <span className="eyebrow w-5 text-muted">0{i + 1}</span>
                  <span className="display whitespace-nowrap text-[clamp(2.3rem,10.5vw,3.25rem)] leading-none">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-1 border-t border-line py-6 text-[0.95rem]">
            <a href={`mailto:${person.email}`} className="u-link w-fit">
              {person.email}
            </a>
            <p className="flex gap-5 text-muted">
              <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="u-link w-fit">
                LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
              {person.github ? (
                <a href={person.github} target="_blank" rel="noopener noreferrer" className="u-link w-fit">
                  GitHub ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </p>
          </div>
        </div>
      </dialog>
    </header>
  );
}
