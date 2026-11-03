/**
 * The Curiously mark: an open C with the bold, square-cut yellow asterisk inside, on a dark tile.
 * Same geometry as LogoMark in video/src/brand.tsx (C radius 40, stroke 11, 22% gap; asterisk stroke 0.28, butt caps).
 */
const ARMS = [
  [-0.00, -17.50, 0.00, 17.50],
  [-15.16, -8.75, 15.16, 8.75],
  [-15.16, 8.75, 15.16, -8.75],
];

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: "#07080C",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2), inset 0 0.5px 0 rgba(255,255,255,0.12)",
      }}
    >
      <svg viewBox="-50 -50 100 100" width={size * 0.78} height={size * 0.78} aria-label="Curiously">
        <circle
          r={40}
          fill="none"
          stroke="#F5F5F7"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray="196.04 251.33"
          transform="rotate(39.6)"
        />
        {ARMS.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB547" strokeWidth={9.80} strokeLinecap="butt" />
        ))}
      </svg>
    </div>
  );
}
