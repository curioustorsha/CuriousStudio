import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { Product } from "../../../products";
import { ez, lerp, sp } from "../../../workshop";
import { BeatHeader, Burst, hopAt, Star, type Pt } from "./common";

/** A wall of jargon bricks (a brick-bond layout of mono chips). */
const ROWS = [
  ["p99 latency", "idempotency", "sharding"],
  ["consistent hashing", "backpressure"],
  ["eventual consistency", "quorum reads"],
  ["CAP theorem", "cache invalidation"],
  ["tail latency", "vector clocks", "rate limiting"],
];
const FONT = 26;
const BW = (t: string) => t.length * FONT * 0.6 + 48;
const BH = 84;
const GAP = 14;
const ROW_Y0 = 500;
const ROW_DY = 108;
const HIT: Pt = [540, 760];

type Brick = { text: string; x: number; y: number; w: number };
const BRICKS: Brick[] = ROWS.flatMap((row, r) => {
  const total = row.reduce((a, t) => a + BW(t), 0) + GAP * (row.length - 1);
  let x = 540 - total / 2;
  return row.map((text) => {
    const b = { text, x, y: ROW_Y0 + r * ROW_DY, w: BW(text) };
    x += b.w + GAP;
    return b;
  });
});

/** Where the card leaves the asterisk for the end card: hovering over the card, on the logo star's spot. */
export const PROMISE_STAR: Pt = [540, 600];
export const PROMISE_STAR_SIZE = 64;

export const PromiseScene: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tWalls = wf("promise", "walls");
  const tOne = wf("promise", "one");
  const tIdea = wf("promise", "idea");
  const PUNCH = 5;

  // The asterisk comes up from the last task row (bottom left), punches the wall's middle, then settles over the card
  const at = (g: number): Pt => (g < PUNCH ? hopAt(g, -2, PUNCH + 2, [130, 1170], HIT, 40) : g < tOne ? HIT : hopAt(g, tOne, 14, HIT, PROMISE_STAR, 60));
  const size = f < PUNCH ? lerp(34, 150, ez(f, -2, PUNCH)) : f < tOne ? 150 * (1 - 0.15 * ez(f, PUNCH, PUNCH + 10)) : lerp(128, PROMISE_STAR_SIZE, ez(f, tOne, tOne + 14));
  const card = sp(f, tOne - 2, { damping: 12, stiffness: 190 });
  const lift = ez(f, tIdea, tIdea + 14) * 24;

  return (
    <>
      <Sfx name="crack" at={PUNCH - 1} volume={0.5} />
      <Sfx name="thud" at={tWalls - 4} volume={0.45} />
      <Sfx name="ding" at={tOne} volume={0.35} />

      <BeatHeader kicker="PLAIN WORDS" title={<>No <span style={{ color: C.muted, textDecoration: "line-through", textDecorationColor: C.red, textDecorationThickness: 8 }}>jargon walls</span></>} />

      {/* the wall */}
      {BRICKS.map((b, i) => {
        const cx = b.x + b.w / 2;
        const cy = b.y + BH / 2;
        const dx = cx - HIT[0];
        const dy = cy - HIT[1];
        const dist = Math.hypot(dx, dy);
        const t0 = PUNCH + dist / 70;
        const t = Math.max(0, f - t0);
        const vx = (dx / (dist || 1)) * (9 + (i % 3) * 2);
        const vy = (dy / (dist || 1)) * 7 - 10;
        const x = b.x + vx * t;
        const y = b.y + vy * t + 0.9 * t * t;
        const rot = t * (i % 2 ? 4 : -5);
        const shake = f < t0 && f >= PUNCH - 1 ? Math.sin(f * 3 + i) * 3 : 0;
        if (y > 2000) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + shake,
              top: y,
              width: b.w,
              height: BH,
              borderRadius: 12,
              background: "#1C1F29",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "inset 0 -6px 0 rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: FONT,
              color: "#9AA0AD",
              transform: `rotate(${rot}deg)`,
              opacity: 1 - ez(f, t0 + 14, t0 + 26),
            }}
          >
            {b.text}
          </div>
        );
      })}

      {/* one big idea */}
      {card > 0.001 && (
        <div style={{ position: "absolute", left: 540 - 300, top: 660 - lift, width: 600, height: 300, opacity: Math.min(1, card * 1.5), transform: `scale(${0.6 + 0.4 * Math.min(1.08, card)})` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 36, border: `3px solid ${C.accent}`, background: "rgba(255,181,71,0.10)", boxShadow: `0 0 ${60 + lift * 2}px ${C.accent}33, 0 30px 80px rgba(0,0,0,0.6)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <Product p="idea" size={110} />
            <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: C.text }}>One big idea</div>
          </div>
        </div>
      )}

      <Burst c={HIT} p={f >= PUNCH ? (f - PUNCH) / 14 : 0} r={100} />
      <Star f={f} at={at} size={size} rotate={f * 6} trail={f < PUNCH || (f >= tOne && f < tOne + 14) ? 1 : 0} glow={0.9} />
    </>
  );
};
