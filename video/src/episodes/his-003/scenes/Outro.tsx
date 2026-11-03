import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { clamp, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { Product } from "../../../products";
import { along, Chip, CITY, CLOSE, mixCam, R1, useMove, World } from "./world";
import { HookHeader } from "./Hook";
import { loopLinks } from "./Scale";

const pay = along(R1, 0.45);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tGoyal = wf("outro", "goyal");
  const tDensity = wf("outro", "density");
  const quoteAt = [tDensity - 8, tDensity, wf("outro", "of", 1), wf("outro", "stores"), wf("outro", "around"), wf("outro", "your"), wf("outro", "homes")];
  const tStores = wf("outro", "stores");
  const tSo = wf("outro", "so");
  const tTen = wf("outro", "ten");
  const tRiding = wf("outro", "riding");
  const tDecided = wf("outro", "decided");
  const tWhere = wf("outro", "where");
  const tStore = wf("outro", "store", 1);

  // Quote card over the dimmed city
  const pCard = useIn(0, { damping: 16, stiffness: 120 });
  const cardOut = ease(frame, tSo - 4, tSo + 8);
  const pName = useIn(tGoyal - 4, { damping: 15, stiffness: 160 });
  const dim = 1 - 0.65 * ease(frame, 0, 12) * (1 - ease(frame, tTen - 4, tTen + 12));
  const storePulse = Math.sin(ease(frame, tStores, tStores + 16) * Math.PI);

  // Camera: eases toward zone A on "riding fast", springs into CLOSE on "where the store is"
  const lean = useMove(tRiding - 10, 36);
  const dive = useMove(tWhere - 10, 32);
  const cam = mixCam(mixCam(CITY, CLOSE, 0.3 * lean), CLOSE, dive);

  // The rest of the city packs away as the camera dives in, so the last frame is the hook's first
  const away = ease(frame, tDecided, tWhere + 14);
  const zoneOn = 1 - away;
  const s1Glow = Math.sin(ease(frame, tStore, tStore + 30) * Math.PI);
  const r1 = frame < tWhere - 4 ? 1 - ease(frame, tDecided + 4, tWhere - 4) : ease(frame, tStore, tStore + 14);

  // The rider: tag flips to a red 40 km/h on "riding fast", gets knocked back to 15, then rides
  // back to the store's door and parks empty, with no tag (the hook's first frame)
  const up = frame >= tRiding && frame < tRiding + 16;
  const shake = up ? Math.sin(frame * 2.6) * 7 : 0;
  const knock = useIn(tRiding + 16, { damping: 9, stiffness: 260 });
  const ret = interpolate(frame, [tWhere - 6, tStore + 14], [1, 0], { ...clamp, easing: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2) });
  // Settle into the hook's first frame before the engine's exit fade (last 7 frames)
  const tagOff = ease(frame, D - 26, D - 14);
  const tag = up
    ? { text: "40 km/h", color: C.red, p: 1, shake }
    : { text: "15 km/h", color: C.accent, p: 1 - tagOff, dy: frame >= tRiding + 16 ? (1 - Math.min(1, knock)) * -26 : 0 };
  const loadOff = 1 - ease(frame, D - 26, D - 16);

  const pPay = useIn(tStore + 4, { damping: 12, stiffness: 180 });
  const payOut = ease(frame, D - 26, D - 14);
  const headerSwap = ease(frame, tWhere, tStore + 4);

  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.35} />
      <Sfx name="data" at={tDensity - 4} volume={0.3} />
      <Sfx name="riser" at={tRiding - 4} volume={0.2} dur={18} />
      <Sfx name="thud" at={tRiding + 16} volume={0.7} />
      <Sfx name="whoosh" at={tWhere - 10} volume={0.45} />
      <Sfx name="ding" at={tStore + 6} volume={0.3} />

      <World
        cam={cam}
        dim={dim}
        terr={() => zoneOn}
        homeLit={() => zoneOn}
        store={(k) => ({ rise: 1, opacity: k === 0 ? 1 : 1 - away, glow: k === 0 ? Math.max(storePulse, s1Glow) : storePulse * (1 - away) })}
        planned={1 - ease(frame, tDecided - 10, tDecided + 10)}
        r1={{ progress: r1 }}
        h0={{ label: ease(frame, tStore, tStore + 12) }}
        links={loopLinks(frame, () => 1 - ease(frame, tDecided - 6, tDecided + 10))}
        rider={{ points: R1, t: ret, tag, load: loadOff, moving: ret > 0 && ret < 1 ? 1 : 0, parked: ret <= 0 || ret >= 1 ? 1 : 0 }}
        overlay={<Chip x={pay[0]} y={pay[1]} text="~10 MIN" color={C.accent} size={40} p={frame >= tStore + 6 ? pPay : 0} lift={190} opacity={1 - payOut} />}
      />

      {/* Header: the outro's title, swapping to the hook's for the loop */}
      <AbsoluteFill style={{ opacity: 1 - headerSwap }}>
        <Header>
          <Reveal at={0}>
            <Kicker text="THE REAL TRICK" />
          </Reveal>
          <Reveal at={tSo}>
            <Title size={80}>
              Distance, <span style={{ color: C.accent }}>not speed</span>
            </Title>
          </Reveal>
        </Header>
      </AbsoluteFill>
      {headerSwap > 0 && (
        <AbsoluteFill style={{ opacity: headerSwap }}>
          <HookHeader />
        </AbsoluteFill>
      )}

      {/* Quote card */}
      {cardOut < 1 && (
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 130,
            top: 430,
            padding: "34px 44px 40px",
            borderRadius: 32,
            background: "rgba(10,12,18,0.94)",
            border: `1px solid rgba(255,181,71,0.3)`,
            boxShadow: "0 30px 100px rgba(0,0,0,0.7)",
            opacity: Math.min(1, pCard) * (1 - cardOut),
            transform: `translateY(${(1 - Math.min(1, pCard)) * 70 - cardOut * 60}px) scale(${1 - 0.05 * cardOut})`,
          }}
        >
          <Product p="quotes" size={64} />
          <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 64, lineHeight: 1.08, letterSpacing: -2, color: C.text, marginTop: 8 }}>
            {"the density of stores around your homes".split(" ").map((w, i) => {
              const p = ease(frame, quoteAt[i] - 2, quoteAt[i] + 6);
              const key = w === "density" || w === "stores";
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    marginRight: 16,
                    opacity: 0.16 + 0.84 * p,
                    transform: `translateY(${(1 - p) * 8}px)`,
                    color: key && p > 0.5 ? C.cyan : C.text,
                  }}
                >
                  {i === 0 ? "“" : ""}
                  {w}
                  {i === 6 ? "”" : ""}
                </span>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 22,
              fontFamily: F.mono,
              fontWeight: 700,
              fontSize: 25,
              letterSpacing: 2,
              color: C.muted,
              opacity: Math.min(1, pName),
              transform: `translateY(${(1 - Math.min(1, pName)) * 24}px)`,
            }}
          >
            <span style={{ color: C.text }}>DEEPINDER GOYAL</span> · THEN CEO, ETERNAL
          </div>
        </div>
      )}

      <AbsoluteFill style={{ opacity: 1 - ease(frame, tWhere - 4, tWhere + 6) }}>
        <Source text="Deepinder Goyal on X, 1 Jan 2026" at={10} />
      </AbsoluteFill>
    </>
  );
};
