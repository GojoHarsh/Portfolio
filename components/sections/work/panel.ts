/**
 * Shared sizing for project panels. Stacked full-width by default; when the
 * Work section runs horizontally (data-h="on"), each panel is one screen
 * wide (a little less, so the next one peeks in) and fills the track height.
 */
export const PANEL =
  "relative w-full shrink-0 [[data-h=on]_&]:h-full [[data-h=on]_&]:w-[min(86vw,80rem)]";
