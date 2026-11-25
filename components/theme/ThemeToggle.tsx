"use client";

import { useId } from "react";
import { useTheme } from "./ThemeProvider";

/**
 * One button for the theme. The site follows the device until the visitor
 * clicks; each click flips light ↔ dark. Landing back on the device's own
 * theme returns to following the device, so OS changes apply again.
 * The icon (sun in light, moon in dark) is driven by CSS from
 * <html data-theme>, so it is right before hydration.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, setPref } = useTheme();
  const mask = `theme-bite${useId().replace(/[^\w-]/g, "")}`;
  const next = resolved === "dark" ? "light" : "dark";

  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const device = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setPref(next === device ? "system" : next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`group grid size-11 place-items-center rounded-full border border-line text-ink transition-colors duration-300 hover:border-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[1.2rem] overflow-visible" aria-hidden="true">
        <mask id={mask}>
          <rect x="-4" y="-4" width="32" height="32" fill="white" />
          {/* The bite that turns the sun into a crescent */}
          <circle
            cx="22"
            cy="3"
            r="6.5"
            fill="black"
            className="transition-transform duration-500 ease-out [[data-theme=dark]_&]:-translate-x-[6px] [[data-theme=dark]_&]:translate-y-[4px]"
          />
        </mask>
        <circle
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask={`url(#${mask})`}
          className="origin-center transition-transform duration-500 ease-out [transform-box:fill-box] [[data-theme=dark]_&]:scale-[1.6]"
        />
        <path
          d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.75 1.75M17.5 17.5l1.75 1.75M4.75 19.25l1.75-1.75M17.5 6.5l1.75-1.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="origin-center transition-[transform,opacity] duration-500 ease-out [transform-box:fill-box] group-hover:rotate-45 [[data-theme=dark]_&]:scale-0 [[data-theme=dark]_&]:-rotate-90 [[data-theme=dark]_&]:opacity-0"
        />
      </svg>
    </button>
  );
}
