"use client";

/** Fired by the loader as it starts to exit, so the hero can overlap it. */
export const INTRO_EVENT = "hk:intro";

/** Runs `cb` once the page is ready to reveal: now, or when the loader exits. */
export function onIntro(cb: () => void) {
  const root = document.documentElement;
  if (root.classList.contains("loader-done") || root.classList.contains("intro-started")) {
    // Loader skipped (already seen this session): un-gate the hero ourselves.
    // The callback's timeline sets its from-states first, so nothing flashes.
    cb();
    root.classList.add("intro-started");
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(INTRO_EVENT, handler, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, handler);
}
