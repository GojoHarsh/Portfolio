/**
 * Places an element on an SVG path at progress t (0..1). With a wheelbase
 * (in path units), both wheels sit on the path: the element is centred
 * between the two contact points and tilted along the line joining them,
 * so a bike rocks over bumps instead of floating over them.
 */
export function placeOnPath(
  path: SVGPathElement,
  el: SVGGraphicsElement,
  t: number,
  length = path.getTotalLength(),
  wheelbase = 2,
) {
  const at = Math.max(0, Math.min(length, t * length));
  const half = wheelbase / 2;
  const a = path.getPointAtLength(Math.max(0, at - half));
  const b = path.getPointAtLength(Math.min(length, at + half));
  const x = (a.x + b.x) / 2;
  const y = (a.y + b.y) / 2;
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(1)})`);
}

/**
 * Spins a Bike's wheels for a distance travelled (in the same units as the
 * path the bike rides), so the tyres roll instead of sliding.
 */
export function spinWheels(bike: Element, distance: number, scale: number, wheelR = 11) {
  const deg = ((distance / (wheelR * scale)) * 180) / Math.PI;
  bike.querySelectorAll<SVGGElement>("[data-wheel]").forEach((w) => {
    w.setAttribute("transform", `rotate(${deg.toFixed(1)} ${w.dataset.cx} ${-wheelR})`);
  });
}
