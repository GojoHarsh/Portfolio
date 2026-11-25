/** Wheel radius and hub height in bike units (see spinWheels in motion/path). */
export const WHEEL_R = 11;
const HUB_Y = -WHEEL_R;
const WHEELS = [-22, 22];

/**
 * A line-drawn mountain bike, Harsh's recurring character: knobby tyres,
 * suspension fork, sloping top tube, rear shock and a riser bar. Drawn around
 * the origin, facing +x, tyres resting on y = 0, so it can ride along a path.
 * The spoke groups ([data-wheel]) can be rotated to spin the wheels.
 * Use inside an <svg>; colour comes from currentColor.
 */
export function Bike({ scale = 1, className = "", rear = true }: { scale?: number; className?: string; rear?: boolean }) {
  const sw = 1.5 / scale; // constant on-screen stroke width
  return (
    <g className={className}>
      <g
        transform={`scale(${scale})`}
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* rear={false} leaves the back wheel out for a caller to draw (e.g. going flat) */}
        {(rear ? WHEELS : WHEELS.slice(1)).map((cx) => (
          <g key={cx}>
            {/* tyre + knobs */}
            <circle cx={cx} cy={HUB_Y} r={WHEEL_R - 0.6} strokeWidth={sw * 1.5} />
            <circle cx={cx} cy={HUB_Y} r={WHEEL_R + 0.4} strokeWidth={sw * 1.1} strokeDasharray="1.1 1.6" />
            {/* spokes, rotated as the bike rolls */}
            <g data-wheel data-cx={cx} strokeWidth={sw * 0.6}>
              <path d={`M${cx - 9} ${HUB_Y}H${cx + 9}M${cx} ${HUB_Y - 9}V${HUB_Y + 9}M${cx - 6.4} ${HUB_Y - 6.4}L${cx + 6.4} ${HUB_Y + 6.4}M${cx - 6.4} ${HUB_Y + 6.4}L${cx + 6.4} ${HUB_Y - 6.4}`} />
            </g>
            <circle cx={cx} cy={HUB_Y} r={1.4} fill="currentColor" stroke="none" />
          </g>
        ))}
        {/* frame: chainstay, seat tube, sloping top tube, down tube, head tube */}
        <path d="M-22 -11 L-2 -9 L-7 -26 M-7 -26 L13 -29 L-2 -9 M13 -29 L15 -23" strokeWidth={sw * 1.25} />
        {/* seat stay with rear shock */}
        <path d="M-22 -11 L-12 -21" />
        <path d="M-12 -21 L-6 -20" strokeWidth={sw * 2.2} />
        {/* suspension fork: stanchion + lower */}
        <path d="M15 -23 L18 -17" strokeWidth={sw * 1.2} />
        <path d="M18 -17 L22 -11" strokeWidth={sw * 2} />
        {/* chainring */}
        <circle cx={-2} cy={-9} r={3.2} />
        {/* saddle and dropper post */}
        <path d="M-7 -26 L-8.5 -31 M-13 -31.5 L-4 -31" strokeWidth={sw * 1.3} />
        {/* stem and riser bar */}
        <path d="M13 -29 L15 -32 M12.5 -33 L18.5 -32" strokeWidth={sw * 1.3} />
      </g>
    </g>
  );
}
