"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Corner } from "@/components/ui/Corner";
import { useSmoothScroll } from "./SmoothScroll";
import { nav, person } from "@/content/portfolio";

/**
 * Fixed top navigation. Transparent over the hero; once you scroll it gains
 * the page colour, and its bottom edge becomes the route: a line that fills
 * as you read, with a stop for each section. Desktop shows the links inline;
 * small screens get a full-screen <dialog> menu (native focus trap, Esc
 * closes). Plain anchors underneath, so it works without JS.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [stops, setStops] = useState<{ id: string; at: number }[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
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
      // The route: how far down the page, and which stops are behind us.
      const route = routeRef.current;
      if (route) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        route.style.setProperty("--route", progress.toFixed(4));
        route.querySelectorAll<HTMLElement>("[data-at]").forEach((dot) => {
          dot.dataset.passed = String(progress >= Number(dot.dataset.at) - 0.001);
        });
      }
    };
    // Where each section starts along the page; re-measured whenever the
    // page changes height (fonts, images, the pinned Work section).
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setStops(
        nav.map((item) => {
          const el = document.getElementById(item.id);
          const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          return { id: item.id, at: max > 0 ? Math.min(1, top / max) : 0 };
        }),
      );
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
        className={`pointer-events-none absolute inset-x-0 -bottom-px h-px transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute inset-0 origin-left scale-x-[var(--route,0)] bg-accent" />
        {stops.map((s) => (
          <span
            key={s.id}
            data-at={s.at}
            style={{ left: `${(s.at * 100).toFixed(2)}%` }}
            className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted/50 bg-bg transition-colors duration-300 data-[passed=true]:border-accent data-[passed=true]:bg-accent"
          />
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
            <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="u-link w-fit text-muted">
              LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </dialog>
    </header>
  );
}
