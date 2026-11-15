import React from "react";
import { spring } from "remotion";
import { C, F, FPS } from "../theme";
import { Asterisk, LogoMark, Wordmark } from "../brand";
import { Product } from "../products";

// Shared cards for every series: the series intro card, the "Next:" lesson card and the sign-off end card.
// Each takes the scene-local frame `f` and the word cues, so they can be drawn at any frame.

const ez = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / (b - a))) ** 0.6;
const sp = (f: number, at: number, damping = 16, stiffness = 150) => (f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping, stiffness } }));

/** "Welcome to <series>, by Curiously": the series name types in, the Curiously asterisk draws on and turns. */
export const SeriesCard: React.FC<{ f: number; name: string; tName: number; tCur: number; out: number; top?: number }> = ({ f, name, tName, tCur, out, top = 610 }) => {
  const pCard = Math.min(1, sp(f, 0, 16, 140));
  const typed = Math.max(0, Math.min(name.length, Math.floor((f - tName + 2) / 1.6)));
  const draw = ez(f, tCur, tCur + 10);
  const turn = 90 * ez(f, tCur + 4, tCur + 22);
  const pWord = Math.min(1, sp(f, tCur - 6, 15, 160));
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 150,
        top,
        padding: "56px 40px 60px",
        borderRadius: 36,
        background: "rgba(10,12,18,0.9)",
        border: `1px solid ${C.stroke}`,
        boxShadow: "0 30px 100px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 34,
        opacity: pCard * (1 - out),
        transform: `translateY(${(1 - pCard) * 60}px) scale(${1 - 0.04 * out})`,
      }}
    >
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 60, letterSpacing: 8, color: C.accent, minHeight: 70 }}>
        {name.slice(0, typed)}
        <span style={{ opacity: typed < name.length && Math.floor(f / 8) % 2 === 0 ? 1 : 0 }}>_</span>
      </div>
      <div style={{ opacity: 0.55 + 0.45 * pWord, transform: `scale(${0.96 + 0.04 * pWord})` }}>
        <Wordmark size={100} star={<Asterisk size={42} draw={Math.max(0.02, draw)} rotate={turn} />} />
      </div>
    </div>
  );
};

/** The small "Next:" card for a numbered series: slides up on `tIn`, ticks once on `tTick`. */
export const NextCard: React.FC<{ f: number; tIn: number; tTick: number; title: string; sub: string; top?: number }> = ({ f, tIn, tTick, title, sub, top = 640 }) => {
  const p = Math.min(1.05, sp(f, tIn, 14, 170));
  const tick = f >= tTick ? Math.sin(Math.min(1, (f - tTick) / 10) * Math.PI) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 160,
        top: top + (1 - Math.min(1, p)) * 160,
        opacity: Math.min(1, p * 1.6),
        transform: `scale(${1 + 0.05 * tick})`,
        padding: "40px 44px",
        borderRadius: 30,
        background: "rgba(14,16,22,0.94)",
        border: `2px solid rgba(255,181,71,0.5)`,
        boxShadow: "0 30px 90px rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.accent }}>NEXT:</div>
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 64, letterSpacing: -2, lineHeight: 1.02, color: C.text }}>{title}</div>
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 38, color: C.muted }}>{sub}</div>
    </div>
  );
};

/** The sign-off end card: the Curiously mark and wordmark, then like / share / follow icons popping on their words. */
export const EndCard: React.FC<{ f: number; tIn: number; tLike: number; tShare: number; tFollow: number; tCur: number; starIn?: number }> = ({ f, tIn, tLike, tShare, tFollow, tCur, starIn = -1 }) => {
  const pIn = ez(f, tIn, tIn + 12);
  const turn = 90 * ez(f, tCur, tCur + 18);
  const icons: [string, string, number][] = [
    ["like", "Like", tLike],
    ["share", "Share", tShare],
    ["follow", "Follow", tFollow],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: pIn }}>
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, transform: `translateY(${(1 - pIn) * 30}px)` }}>
        <LogoMark size={250} starRotate={turn} starDraw={f >= starIn ? 1 : 0} />
        <Wordmark size={110} />
      </div>
      <div style={{ position: "absolute", top: 1000, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90 }}>
        {icons.map(([p, label, t], k) => {
          const pop = sp(f, t - 2, 9, 230);
          const pulse = f >= t ? 1 + 0.12 * Math.sin(Math.min(1, (f - t) / 12) * Math.PI) : 1;
          return (
            <div key={p} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.25 + 0.75 * Math.min(1, pop), transform: `scale(${(0.8 + 0.2 * Math.min(1.1, pop)) * pulse})` }}>
              <div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  border: `3px solid ${pop > 0.5 ? "rgba(255,255,255,0.3)" : C.stroke}`,
                  background: "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Product p={p} size={76} color={pop > 0.5 ? undefined : C.muted} />
              </div>
              <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: pop > 0.5 ? C.text : C.muted }}>{label.toUpperCase()}</div>
              <div style={{ height: 0 }} key={k} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
