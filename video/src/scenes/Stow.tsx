import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Bin, clamp, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { Product } from "../products";

const COLS = 4;
const BW = 200;
const BH = 150;
const GAP = 14;
const LEFT = (1080 - (COLS * BW + (COLS - 1) * GAP)) / 2;
const TOP = 480;

const FILLED: Record<number, string[]> = {
  0: ["headphones"], 1: ["gift", "battery"], 3: ["coffee"], 4: ["book", "sock"], 6: ["sneaker"], 7: ["plant"],
  8: ["puzzle", "umbrella"], 9: ["watch"], 10: ["game"], 12: ["cap", "camera"], 14: ["lamp"], 15: ["package", "palette"],
};
const EMPTY = [2, 5, 11, 13];
const INCOMING = ["phone", "bone", "lotion", "tennis"];

const xy = (i: number) => ({ x: LEFT + (i % COLS) * (BW + GAP), y: TOP + Math.floor(i / COLS) * (BH + GAP) });
const TOTE = { x: 540, y: 1195 };

export const Stow: React.FC = () => {
  const frame = useCurrentFrame();
  const tFixed = wf("stow", "stow");
  const tHome = tFixed + 8;
  const tDrop = wf("stow", "go");
  const pChip = useIn(tFixed - 4);
  const strike = ease(frame, tHome, tHome + 10);
  const pTote = useIn(2);
  const flyStart = (k: number) => tDrop - 2 + k * 7;
  const FLY = 16;

  return (
    <>
      <Sfx name="swoosh" at={tFixed - 4} volume={0.4} />
      <Sfx name="error" at={tHome + 2} volume={0.3} />
      <Sfx name="swoosh" at={0} volume={0.35} />
      {INCOMING.map((_, k) => (
        <Sfx key={k} name="thud" at={flyStart(k) + FLY - 2} volume={0.55} />
      ))}

      <Header>
        <Reveal at={0}>
          <Kicker text="THE METHOD" />
        </Reveal>
        <Reveal at={4} scaleFrom={0.9}>
          <Title size={120}>
            Random <span style={{ color: C.accent }}>stow</span>
          </Title>
        </Reveal>
      </Header>

      {/* "Fixed home" chip, struck through */}
      <div
        style={{
          position: "absolute",
          top: 410,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, pChip),
          transform: `scale(${0.8 + 0.2 * pChip})`,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "8px 26px",
            borderRadius: 999,
            border: `2px solid ${C.red}`,
            color: C.red,
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: 32,
            background: "rgba(255,92,92,0.08)",
          }}
        >
          Fixed home per product
          <div
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              height: 4,
              width: `calc(${strike * 100}% - 32px)`,
              background: C.red,
              borderRadius: 2,
              boxShadow: `0 0 12px ${C.red}`,
            }}
          />
        </div>
      </div>

      {Array.from({ length: 16 }).map((_, i) => {
        const { x, y } = xy(i);
        const e = EMPTY.indexOf(i);
        const isEmpty = e >= 0;
        const landed = isEmpty && frame >= flyStart(e) + FLY;
        const glow = isEmpty ? ease(frame, tDrop - 6, tDrop + 4) * (landed ? 1 - ease(frame, flyStart(e) + FLY, flyStart(e) + FLY + 12) : 1) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y }}>
            <Bin w={BW} h={BH} dashed={isEmpty && !landed} glow={glow * 0.8} glowColor={C.green}>
              {isEmpty && !landed && (
                <span style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: C.green, opacity: 0.4 + glow * 0.6, letterSpacing: 2 }}>
                  SPACE
                </span>
              )}
              {(FILLED[i] ?? []).map((em, j) => (
                <Product key={j} p={em} size={j === 0 ? 72 : 56} style={{ display: "inline-block", transform: `rotate(${(i * 37 + j * 23) % 30 - 15}deg)` }} />
              ))}
              {landed && <Landed e={INCOMING[e]} at={flyStart(e) + FLY} />}
            </Bin>
          </div>
        );
      })}

      {/* Tote with incoming items */}
      <div
        style={{
          position: "absolute",
          left: TOTE.x - 200,
          top: TOTE.y - 20,
          width: 400,
          height: 70,
          borderRadius: "0 0 24px 24px",
          background: "linear-gradient(180deg, #2B4A6F, #1C3352)",
          border: "2px solid rgba(79,209,255,0.35)",
          opacity: Math.min(1, pTote),
          transform: `translateY(${(1 - pTote) * 120}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 3,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        TOTE · NEW STOCK
      </div>
      {INCOMING.map((em, k) => {
        if (frame >= flyStart(k) + FLY) return null;
        const target = xy(EMPTY[k]);
        const tx = target.x + BW / 2;
        const ty = target.y + BH / 2;
        const sx = TOTE.x - 120 + k * 80;
        const sy = TOTE.y - 22 + (1 - pTote) * 120;
        const t = interpolate(frame, [flyStart(k), flyStart(k) + FLY], [0, 1], clamp);
        const et = 1 - Math.pow(1 - t, 3);
        const x = sx + (tx - sx) * et;
        const y = sy + (ty - sy) * et - Math.sin(t * Math.PI) * 220;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${t * 360}deg)`, opacity: Math.min(1, pTote) }}>
            <Product p={em} size={66} />
          </div>
        );
      })}

      <Source text="ABOUTAMAZON.COM" at={20} />
    </>
  );
};

const Landed: React.FC<{ e: string; at: number }> = ({ e, at }) => {
  const p = useIn(at, { damping: 9, stiffness: 260 });
  return <Product p={e} size={70} style={{ display: "inline-block", transform: `scale(${0.6 + 0.4 * p})` }} />;
};
