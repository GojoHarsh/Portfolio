"use client";

import { person } from "@/content/portfolio";
import { useSmoothScroll } from "./SmoothScroll";

/**
 * The stage behind the page. It stays stuck to the bottom of the viewport,
 * underneath <main>, the whole time; at the end of the page <main> lifts
 * away like a curtain and "harsh." is revealed, as if it had been standing
 * there all along. No animation of its own: the scroll is the reveal.
 * overflow-clip: at this size the text's line box hangs below the footer,
 * which would otherwise make the page longer and let the name drift up.
 */
export function SiteFooter() {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer className="@container sticky bottom-0 z-0 overflow-clip bg-ink px-[var(--gutter)] pb-[clamp(0.5rem,1.5vw,1.25rem)] pt-[clamp(2.5rem,7vw,6rem)] text-bg">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 text-[0.95rem]">
        <p className="text-bg/65">
          © {new Date().getFullYear()} {person.name}
        </p>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#top");
          }}
          className="u-link"
        >
          Back to the top ↑
        </a>
      </div>
      <p
        aria-hidden="true"
        className="display mt-3 whitespace-nowrap text-[29.5cqw] font-semibold italic leading-[0.86] tracking-[-0.02em]"
      >
        harsh<span className="text-accent-inverse">.</span>
      </p>
    </footer>
  );
}
