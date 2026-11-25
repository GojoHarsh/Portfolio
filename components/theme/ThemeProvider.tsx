"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { THEME_COLORS, THEME_STORAGE_KEY } from "./theme-script";

export type ThemePref = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  pref: ThemePref;
  resolved: ResolvedTheme;
  /** origin: viewport point the transition unfolds from (the switcher). */
  setPref: (pref: ThemePref, origin?: { x: number; y: number }) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";
const WIPE_MS = 520;
const FADE_MS = 280;

const isPref = (v: unknown): v is ThemePref => v === "system" || v === "light" || v === "dark";

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolve(pref: ThemePref): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function writeDom(pref: ThemePref, resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-pref", pref);
  root.style.colorScheme = resolved;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => (m.content = THEME_COLORS[resolved]));
}

function storePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage unavailable (private mode, blocked): preference lasts for this page only.
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server render assumes "system"; the real values are read from the DOM
  // (set by the head script) on mount. Visual state is CSS-driven from the
  // same attributes, so nothing flashes while this catches up.
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const prefRef = useRef<ThemePref>("system");
  const busy = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const p = root.getAttribute("data-theme-pref");
    const r = root.getAttribute("data-theme");
    const initial = isPref(p) ? p : "system";
    prefRef.current = initial;
    setPrefState(initial);
    setResolved(r === "dark" ? "dark" : "light");
  }, []);

  const apply = useCallback(
    (next: ThemePref, mode: "wipe" | "fade" | "instant", origin?: { x: number; y: number }) => {
      const nextResolved = resolve(next);
      const current = document.documentElement.getAttribute("data-theme");
      const commit = () => {
        prefRef.current = next;
        writeDom(next, nextResolved);
        setPrefState(next);
        setResolved(nextResolved);
      };

      // Same colours (e.g. system → light while the OS is light): no transition.
      if (current === nextResolved || mode === "instant" || prefersReducedMotion()) {
        commit();
        return;
      }

      if (mode === "wipe" && typeof document.startViewTransition === "function" && !busy.current) {
        busy.current = true;
        const transition = document.startViewTransition(() => flushSync(commit));
        transition.ready
          .then(() => {
            // The new theme unfolds from the switcher, which lives in the
            // page's top-right corner: a quarter-circle sweep to the far edge.
            const { x, y } = origin ?? { x: window.innerWidth, y: 0 };
            const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
              { duration: WIPE_MS, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" },
            );
          })
          .catch(() => {});
        transition.finished.finally(() => {
          busy.current = false;
        });
        return;
      }

      const root = document.documentElement;
      root.classList.add("theme-fade");
      commit();
      window.setTimeout(() => root.classList.remove("theme-fade"), FADE_MS + 40);
    },
    [],
  );

  const setPref = useCallback(
    (next: ThemePref, origin?: { x: number; y: number }) => {
      if (next === prefRef.current) return;
      storePref(next);
      apply(next, "wipe", origin);
    },
    [apply],
  );

  // Follow the OS while in System mode. No click origin, so cross-fade.
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (prefRef.current === "system") apply("system", "fade");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apply]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next = isPref(e.newValue) ? e.newValue : "system";
      if (next !== prefRef.current) apply(next, "fade");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [apply]);

  return <ThemeContext.Provider value={{ pref, resolved, setPref }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
