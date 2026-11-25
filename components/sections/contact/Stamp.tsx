/*
 * A postage-style stamp drawn in code: a ghat on the Ganga at sunset, with
 * a perforated edge. Decorative, and not a copy of any real stamp.
 */
export function Stamp({ className = "" }: { className?: string }) {
  // Perforations: holes along every edge, in the postcard's own colour.
  const holes: [number, number][] = [];
  for (let x = 0; x <= 100; x += 10) holes.push([x, 0], [x, 124]);
  for (let y = 10; y < 124; y += 10.3) holes.push([0, y], [100, y]);

  return (
    <svg viewBox="-4 -4 108 132" aria-hidden="true" className={className}>
      <rect x="0" y="0" width="100" height="124" className="fill-bg" />
      {holes.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" className="fill-surface" />
      ))}
      <rect x="9" y="9" width="82" height="106" fill="none" className="stroke-accent" strokeWidth="1" />
      {/* Sun, temple, ghat steps, river */}
      <circle cx="67" cy="38" r="11" className="fill-accent" opacity="0.22" />
      <path d="M27 68 L36.5 40 L46 68 Z" className="fill-accent" />
      <path d="M36.5 40 V32 l6 2.2 -6 2.2" fill="none" className="stroke-accent" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="22" y="68" width="29" height="8" className="fill-accent" opacity="0.55" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={13 + i * 2} y={76 + i * 4.5} width={74 - i * 4} height="4.5" className="fill-ink" opacity={0.14 + i * 0.05} />
      ))}
      {[97, 103, 109].map((y, i) => (
        <path
          key={y}
          d={`M${14 + i * 3} ${y} q 6 -3 12 0 t 12 0 t 12 0 t 12 0 t 12 0`}
          fill="none"
          className="stroke-accent"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity={0.9 - i * 0.25}
        />
      ))}
      <text x="50" y="25" textAnchor="middle" className="fill-ink" style={{ fontSize: 7.5, letterSpacing: "0.2em" }}>
        GANGA
      </text>
    </svg>
  );
}

/** A round postmark with wavy cancellation lines. */
export function Postmark({ year, className = "" }: { year: number; className?: string }) {
  return (
    <svg viewBox="0 0 150 80" aria-hidden="true" className={className}>
      <defs>
        <path id="postmark-ring" d="M110 40 m-27 0 a27 27 0 1 1 54 0 a27 27 0 1 1 -54 0" />
      </defs>
      <g fill="none" className="stroke-ink" strokeWidth="1.4" opacity="0.6">
        <circle cx="110" cy="40" r="35" />
        <circle cx="110" cy="40" r="20" />
        {[22, 34, 46, 58].map((y) => (
          <path key={y} d={`M2 ${y} q 9 -6 18 0 t 18 0 t 18 0 t 18 0`} strokeLinecap="round" />
        ))}
      </g>
      <text className="fill-ink" opacity="0.6" style={{ fontSize: 9.5, letterSpacing: "0.24em" }}>
        <textPath href="#postmark-ring" textLength="166" lengthAdjust="spacing">
          PATNA · BIHAR · INDIA ·
        </textPath>
      </text>
      <text x="110" y="44" textAnchor="middle" className="fill-ink" opacity="0.6" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
        {year}
      </text>
    </svg>
  );
}
