import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { ease, Header, Kicker, Reveal, rnd, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { Product, PRODUCTS } from "../products";

const COLS = 8;
const ROWS = 7;
const CELL = 92;
const GAP = 12;
const MAP_W = COLS * CELL + (COLS - 1) * GAP;
const LEFT = (1080 - MAP_W) / 2;
const TOP = 410;

// Where copies of the same product (a sneaker) sit, and where the picker is.
const COPIES: [number, number][] = [[1, 1], [6, 0], [3, 3], [0, 5], [5, 5], [7, 3]];
const PICKER: [number, number] = [4, 6];
const center = ([c, r]: [number, number]) => ({ x: c * (CELL + GAP) + CELL / 2, y: r * (CELL + GAP) + CELL / 2 });
const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const NEAREST = COPIES.reduce((best, c, i) => (dist(c, PICKER) < dist(COPIES[best], PICKER) ? i : best), 0);
const FILLER = Object.keys(PRODUCTS).filter((k) => k !== "sneaker" && k !== "worker");

export const Spread: React.FC = () => {
  const frame = useCurrentFrame();
  const tSame = wf("spread", "same");
  const tSystem = wf("spread", "system");
  const tClosest = wf("spread", "closest");
  const tLess = wf("spread", "less");
  const tFaster = wf("spread", "faster");

  const copyAt = (i: number) => tSame + 4 + i * 4;
  const routes = ease(frame, tSystem - 2, tSystem + 12);
  const pick = ease(frame, tClosest - 2, tClosest + 8);
  const pPicker = useIn(tSystem - 8);
  const pLess = useIn(tLess - 2);
  const pFaster = useIn(tFaster - 2);
  const P = center(PICKER);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      {COPIES.map((_, i) => (
        <Sfx key={i} name="pop" at={copyAt(i)} volume={0.35} />
      ))}
      <Sfx name="data" at={tSystem - 2} volume={0.3} />
      <Sfx name="ding" at={tClosest + 2} volume={0.5} />
      <Sfx name="swoosh" at={tLess - 4} volume={0.35} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE CLEVER PART" color={C.green} />
        </Reveal>
        <Reveal at={4} scaleFrom={0.9}>
          <Title size={92}>
            Copies <span style={{ color: C.green }}>everywhere</span>
          </Title>
        </Reveal>
      </Header>

      <div style={{ position: "absolute", left: LEFT, top: TOP, width: MAP_W, height: ROWS * (CELL + GAP) - GAP, opacity: ease(frame, 2, 12) }}>
        {Array.from({ length: COLS * ROWS }).map((_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const k = COPIES.findIndex(([cc, rr]) => cc === c && rr === r);
          const isCopy = k >= 0;
          const on = isCopy ? ease(frame, copyAt(k), copyAt(k) + 8) : 0;
          const nearest = k === NEAREST ? pick : 0;
          const faded = isCopy && k !== NEAREST ? pick * 0.55 : 0;
          const filler = FILLER[Math.floor(rnd(`sp${i}`) * FILLER.length)];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c * (CELL + GAP),
                top: r * (CELL + GAP),
                width: CELL,
                height: CELL,
                borderRadius: 14,
                background: isCopy ? `rgba(255,107,139,${0.1 * on})` : C.panel,
                border: `2px solid ${nearest ? C.green : isCopy ? `rgba(255,107,139,${0.8 * on})` : C.stroke}`,
                boxShadow: nearest ? `0 0 ${36 * nearest}px ${C.green}` : isCopy ? `0 0 ${26 * on}px rgba(255,107,139,0.5)` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 1 - faded,
              }}
            >
              {isCopy && on > 0 ? (
                <div style={{ transform: `scale(${0.5 + 0.5 * on})` }}>
                  <Product p="sneaker" size={56} />
                </div>
              ) : (
                <div style={{ opacity: 0.22 }}>
                  <Product p={filler} size={40} color="#9AA3B5" />
                </div>
              )}
            </div>
          );
        })}

        {/* routes from picker to every copy; nearest one wins */}
        <svg width={MAP_W} height={ROWS * (CELL + GAP)} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {COPIES.map((c, i) => {
            const T = center(c);
            const win = i === NEAREST;
            const len = Math.min(1, routes * 1.3 - i * 0.05);
            return (
              <line
                key={i}
                x1={P.x}
                y1={P.y}
                x2={P.x + (T.x - P.x) * Math.max(0, len)}
                y2={P.y + (T.y - P.y) * Math.max(0, len)}
                stroke={win && pick > 0 ? C.green : "rgba(245,245,247,0.55)"}
                strokeWidth={win ? 4 + 4 * pick : 3}
                strokeDasharray={win && pick > 0 ? "none" : "10 10"}
                strokeLinecap="round"
                opacity={routes * (win ? 1 : 1 - pick * 0.85)}
              />
            );
          })}
        </svg>

        {/* picker */}
        <div
          style={{
            position: "absolute",
            left: P.x,
            top: P.y,
            width: 96,
            height: 96,
            borderRadius: 48,
            transform: `translate(-50%,-50%) scale(${Math.min(1, pPicker)})`,
            background: "#0E2A33",
            border: `3px solid ${C.cyan}`,
            boxShadow: `0 0 30px rgba(79,209,255,0.6)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Product p="worker" size={54} color={C.cyan} />
        </div>
      </div>

      {/* outcome chips */}
      <div style={{ position: "absolute", top: 1150, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24 }}>
        {[
          { t: "LESS TRAVEL", p: pLess },
          { t: "FASTER ORDERS", p: pFaster },
        ].map((c) => (
          <div
            key={c.t}
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "rgba(61,220,151,0.12)",
              border: `2px solid ${C.green}`,
              color: C.green,
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: 2,
              opacity: Math.min(1, c.p),
              transform: `translateY(${(1 - Math.min(1, c.p)) * 30}px) scale(${0.85 + 0.15 * Math.min(1, c.p)})`,
            }}
          >
            {c.t}
          </div>
        ))}
      </div>

      <Source text="AMAZON (INFORMS, 2023) · TOISTER, 2017" at={20} />
    </>
  );
};

