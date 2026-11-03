import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { clamp, ease, Reveal, Sfx, Source, useIn, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { CITY, CLOSE, door, dropIn, HOMES, mixCam, R1, route, STORE_HOMES, STORES, useMove, World, type Link } from "./world";
import { Timeline } from "./Clock";

/** S6–S18 in ripple order: outward from S1. */
const RIPPLE = STORES.map((_, k) => k)
  .filter((k) => k > 4)
  .sort((a, b) => {
    const d = (k: number) => Math.hypot(STORES[k].x - STORES[0].x, STORES[k].y - STORES[0].y);
    return d(a) - d(b);
  });
const GAP = 4;

/** When (frames after the ripple starts) a store lands; S1–S5 are already up. */
export const landAt = (k: number) => (k <= 4 ? -999 : RIPPLE.indexOf(k) * GAP);

/** Delivery loops: every store → up to two of its own homes, along the streets. */
const LOOPS = STORES.flatMap((s, k) =>
  STORE_HOMES[k].slice(0, 2).map((h, j) => ({ k, points: route(door(s), door(HOMES[h])), phase: (k * 11 + j * 23) % 60 })),
);

/** Loop packets for each store at frame `f`, faded by `on(k)`. */
export const loopLinks = (f: number, on: (k: number) => number, size = 6): Link[] =>
  LOOPS.map((l) => {
    const o = on(l.k);
    const t = ((((f + l.phase) % 60) + 60) % 60) / 60;
    return { points: l.points, progress: 1, t: o > 0.05 ? t : null, opacity: o * 0.9, size, width: 2.5 };
  });

export const Scale: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tNear = wf("scale", "near");
  const tTwo = wf("scale", "two");
  const tFifty = wf("scale", "fifty");
  const tExpects = wf("scale", "expects");
  const tThree = wf("scale", "three");
  const tMarch = wf("scale", "march");

  const cam = mixCam(CLOSE, CITY, useMove(tNear - 8, 40));
  const rStart = tNear + 10;
  const state = STORES.map((_, k) => (k <= 4 ? { rise: 1, drop: 0, ring: 0, plot: 0, terr: 1 } : dropIn(frame, rStart + landAt(k), 4)));
  const tlOut = 1 - ease(frame, 0, 12);
  const planned = ease(frame, tThree - 4, tThree + 24);

  const t = interpolate(frame, [tTwo, tFifty + 6], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 4) });
  const count = Math.round(t * 2751);
  const pDone = useIn(tFifty + 6, { damping: 9, stiffness: 240 });
  const pNext = useIn(tThree, { damping: 12, stiffness: 200 });
  const pMar = useIn(tMarch, { damping: 11, stiffness: 240 });

  return (
    <>
      <Sfx name="whoosh" at={tNear - 8} volume={0.4} />
      {RIPPLE.filter((_, i) => i % 2 === 0).map((k) => (
        <Sfx key={k} name="pop" at={rStart + landAt(k) + 6} volume={0.22} />
      ))}
      <Sfx name="ticker" at={tTwo} volume={0.3} dur={tFifty + 6 - tTwo} />
      <Sfx name="impact" at={tFifty + 6} volume={0.55} />
      <Sfx name="riser" at={tExpects - 6} volume={0.3} dur={tThree - tExpects + 8} />
      <Sfx name="ding" at={tMarch} volume={0.45} />

      <World
        cam={cam}
        terr={(k) => state[k].terr}
        homeLit={(k) => Math.min(1, state[k].terr * 1.5)}
        store={(k) => state[k]}
        planned={planned}
        floor={tlOut > 0 ? <Timeline track={1} pick={1} ride={1} opacity={tlOut} /> : null}
        links={loopLinks(frame, (k) => ease(frame, rStart + Math.max(0, landAt(k)) + 14, rStart + Math.max(0, landAt(k)) + 30))}
        rider={{ points: R1, t: 1, parked: 1, tag: { text: "15 km/h", p: 1 } }}
        h0={{ label: 1 - ease(frame, tNear - 8, tNear + 4) }}
      />

      {/* Header: the counter is the title */}
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal at={0}>
          <LogoKicker text="STORES" />
        </Reveal>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 160,
            lineHeight: 1,
            letterSpacing: -3,
            color: C.text,
            marginTop: 14,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${1 + 0.08 * Math.sin(Math.min(1, pDone) * Math.PI)})`,
            textShadow: `0 0 ${50 * Math.min(1, pDone)}px rgba(79,209,255,0.5)`,
            opacity: ease(frame, tTwo - 8, tTwo),
          }}
        >
          {count.toLocaleString("en-US")}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 452,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          opacity: Math.min(1, pNext),
          transform: `translateY(${(1 - Math.min(1, pNext)) * 30}px)`,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 64,
            color: C.cyan,
            padding: "2px 24px",
            borderRadius: 18,
            border: `3px dashed ${C.cyan}`,
            background: "rgba(7,8,12,0.88)",
          }}
        >
          3,500+
        </div>
        <div
          style={{
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 2,
            color: C.text,
            padding: "12px 18px",
            borderRadius: 12,
            background: "rgba(7,8,12,0.88)",
            border: `1px solid ${C.stroke}`,
            opacity: Math.min(1, pMar),
            transform: `scale(${0.6 + 0.4 * Math.min(1.1, pMar)})`,
          }}
        >
          BY MAR 2027
        </div>
      </div>

      <Source text="Eternal Q2 FY27, via Kotak Neo, Oct 2026" at={tTwo} />
    </>
  );
};
