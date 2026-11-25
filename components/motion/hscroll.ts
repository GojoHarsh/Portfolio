/**
 * When the Work section scrolls horizontally, an element inside it isn't at
 * its document offset. Work registers a resolver here that maps such an
 * element to the vertical scroll position that brings it into view;
 * SmoothScroll.scrollTo asks it first.
 */
type Resolver = (el: HTMLElement) => number | null;

let resolver: Resolver | null = null;

export function setHorizontalResolver(fn: Resolver | null) {
  resolver = fn;
}

export function resolveHorizontal(el: HTMLElement) {
  return resolver ? resolver(el) : null;
}
