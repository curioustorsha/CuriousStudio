import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { clamp, ease, Header, Kicker, Reveal, rnd, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";

const GC = 26;
const GR = 12;
const CELL = 30;

export const Million: React.FC = () => {
  const frame = useCurrentFrame();
  const tJuly = wf("million", "july");
  const tDeployed = wf("million", "announced");
  const tRobot = wf("million", "robot", 0, "end");
  const tDeep = wf("million", "deepfleet");
  const tTen = wf("million", "ten");
  const tEff = wf("million", "efficient", 0, "end");

  const t = interpolate(frame, [tDeployed, tRobot + 4], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 4) });
  const count = Math.round(t * 1_000_000);
  const pDone = useIn(tRobot + 2, { damping: 9, stiffness: 240 });
  const pCard = useIn(tDeep - 6);
  const ten = interpolate(frame, [tTen, tTen + 14], [0, 10], clamp);
  const pTen = useIn(tTen, { damping: 10 });
  const dash = ease(frame, tDeep, tEff, 0, 1);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.35} />
      <Sfx name="ticker" at={tDeployed} volume={0.35} dur={tRobot + 4 - tDeployed} />
      <Sfx name="impact" at={tRobot} volume={0.6} />
      <Sfx name="data" at={tDeep - 4} volume={0.35} />
      <Sfx name="ding" at={tTen + 4} volume={0.5} />

      <Header>
        <Reveal at={0}>
          <Kicker text="JULY 2025" />
        </Reveal>
        <Reveal at={tJuly}>
          <Title size={64}>Amazon's robot milestone</Title>
        </Reveal>
      </Header>

      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 165,
            letterSpacing: -2,
            lineHeight: 1,
            color: C.text,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${1 + 0.07 * Math.sin(Math.min(1, pDone) * Math.PI)})`,
            textShadow: `0 0 ${40 * Math.min(1, pDone)}px rgba(255,181,71,0.5)`,
            opacity: ease(frame, tDeployed - 6, tDeployed),
          }}
        >
          {count.toLocaleString("en-US")}
          <span style={{ fontSize: 80, color: C.accent, verticalAlign: "top" }}>{t >= 1 ? "th" : ""}</span>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 30, fontWeight: 700, letterSpacing: 3, color: C.accent, marginTop: 10, opacity: ease(frame, tDeployed, tDeployed + 10) }}>
          ROBOT DEPLOYED
        </div>
      </div>

      {/* Robot field filling up */}
      <div
        style={{
          position: "absolute",
          top: 660,
          left: (1080 - GC * CELL) / 2,
          display: "grid",
          gridTemplateColumns: `repeat(${GC}, ${CELL}px)`,
          gridAutoRows: `${CELL}px`,
          opacity: ease(frame, tDeployed - 6, tDeployed + 4) * (1 - 0.55 * ease(frame, tDeep - 6, tDeep + 6)),
        }}
      >
        {Array.from({ length: GC * GR }).map((_, i) => {
          const on = rnd(`m${i}`) < t * 1.02;
          return (
            <div
              key={i}
              style={{
                margin: 6,
                borderRadius: 5,
                background: on ? C.accent : "rgba(255,255,255,0.06)",
                boxShadow: on ? `0 0 10px rgba(255,181,71,0.6)` : "none",
              }}
            />
          );
        })}
      </div>

      {/* DeepFleet card */}
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 830,
          height: 400,
          borderRadius: 30,
          padding: "34px 40px",
          background: "rgba(13,16,23,0.92)",
          border: `1px solid rgba(79,209,255,0.3)`,
          boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
          opacity: Math.min(1, pCard),
          transform: `translateY(${(1 - pCard) * 80}px)`,
          overflow: "hidden",
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: C.cyan }}>GENERATIVE AI MODEL</div>
        <div style={{ fontFamily: F.sans, fontSize: 76, fontWeight: 900, letterSpacing: -2, color: C.text, marginTop: 6 }}>DeepFleet</div>
        <div style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 500, color: C.muted, marginTop: 4 }}>Routes the robot fleet like traffic control</div>

        {/* route lines */}
        <svg width={330} height={110} viewBox="0 0 560 170" style={{ position: "absolute", left: 36, bottom: 40 }}>
          {[
            "M10 140 L120 140 L120 60 L260 60 L260 120 L400 120",
            "M10 30 L180 30 L180 100 L330 100 L330 20 L540 20",
            "M60 160 L60 90 L220 90 L220 150 L520 150",
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i === 1 ? C.accent : C.cyan}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - Math.min(1, dash * (1.2 - i * 0.1))}
              opacity={0.85}
            />
          ))}
        </svg>

        <div
          style={{
            position: "absolute",
            right: 40,
            bottom: 40,
            textAlign: "right",
            opacity: Math.min(1, pTen),
            transform: `scale(${0.7 + 0.3 * Math.min(1, pTen)})`,
            transformOrigin: "right bottom",
          }}
        >
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 140, lineHeight: 0.9, color: C.green, letterSpacing: -4 }}>
            +{Math.round(ten)}%
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: C.green }}>ROBOT TRAVEL EFFICIENCY</div>
        </div>
      </div>

      <Source text="AMAZON, JULY 2025" at={tJuly} />
    </>
  );
};
