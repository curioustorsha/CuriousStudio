import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F, FPS } from "../theme";
import { clamp, ease, rnd, Sfx } from "../lib";
import { Asterisk, LogoMark } from "../brand";

export const LOGO_FRAMES = 96;

const WORD = "curiously";
const CX = 540;
const CY = 820;

// End card: asterisk bursts in, the C draws around it, the wordmark types on, the asterisk lands.
export const LogoSting: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const starDraw = ease(frame, 2, 14);
  const starSpin = interpolate(spring({ frame: frame - 2, fps: FPS, config: { damping: 14, stiffness: 90 } }), [0, 1], [-270, 0]);
  const arc = ease(frame, 12, 34);
  const markScale = spring({ frame: frame - 2, fps: FPS, config: { damping: 12, stiffness: 160 } });
  const settle = ease(frame, 30, 46); // mark lifts to make room for the wordmark
  const burst = ease(frame, 4, 34);
  const ring = (k: number) => ease(frame, 6 + k * 8, 40 + k * 8);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.18);
  const out = ease(frame, durationInFrames - 8, durationInFrames);

  const markY = CY - 140 * settle;
  const wordY = CY + 150;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <Sfx name="whoosh" at={0} volume={0.45} />
      <Sfx name="impact" at={4} volume={0.6} />
      <Sfx name="swoosh" at={14} volume={0.35} />
      <Sfx name="data" at={34} volume={0.25} />
      <Sfx name="pop" at={58} volume={0.55} />
      <Sfx name="ding" at={60} volume={0.45} />

      {/* soft glow behind the mark */}
      <div
        style={{
          position: "absolute",
          left: CX - 420,
          top: markY - 420,
          width: 840,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,181,71,${0.22 + 0.06 * pulse}) 0%, transparent 60%)`,
          opacity: ease(frame, 0, 16),
        }}
      />

      {/* expanding rings */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map((k) => {
          const p = ring(k);
          return (
            <circle key={k} cx={CX} cy={markY} r={120 + p * 380} fill="none" stroke={C.accent} strokeWidth={3 - k * 0.6} opacity={(1 - p) * 0.55 * (p > 0 ? 1 : 0)} />
          );
        })}
        {/* radial burst lines */}
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2 + rnd(`b${i}`) * 0.2;
          const len = 40 + rnd(`l${i}`) * 70;
          const d0 = 150 + burst * 260;
          const x1 = CX + Math.cos(a) * d0;
          const y1 = markY + Math.sin(a) * d0;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x1 + Math.cos(a) * len * (1 - burst)}
              y2={y1 + Math.sin(a) * len * (1 - burst)}
              stroke={i % 3 === 0 ? C.text : C.accent}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={burst > 0 && burst < 1 ? 1 - burst * 0.8 : 0}
            />
          );
        })}
      </svg>

      {/* orbiting sparks */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2 + frame * 0.045;
        const rr = 210 + 12 * Math.sin(frame * 0.1 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: CX + Math.cos(a) * rr - 6,
              top: markY + Math.sin(a) * rr - 6,
              opacity: ease(frame, 26 + i * 2, 36 + i * 2) * 0.9,
            }}
          >
            <Asterisk size={i % 2 ? 16 : 22} color={i % 2 ? C.text : C.accent} rotate={frame * 3} />
          </div>
        );
      })}

      {/* the mark */}
      <div style={{ position: "absolute", left: CX - 150, top: markY - 150, transform: `scale(${markScale})` }}>
        <LogoMark size={300} arc={arc} starRotate={starSpin} starDraw={starDraw} />
      </div>

      {/* wordmark types on, asterisk lands last */}
      <div style={{ position: "absolute", top: wordY, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        {WORD.split("").map((ch, i) => {
          const p = spring({ frame: frame - (34 + i * 2), fps: FPS, config: { damping: 16, stiffness: 200 } });
          return (
            <span
              key={i}
              style={{
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 150,
                letterSpacing: -4.5,
                lineHeight: 1,
                color: C.text,
                display: "inline-block",
                opacity: Math.min(1, p),
                transform: `translateY(${(1 - p) * 50}px)`,
                filter: `blur(${(1 - Math.min(1, p)) * 8}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
        <div
          style={{
            marginLeft: 8,
            marginTop: 4,
            transform: `scale(${spring({ frame: frame - 56, fps: FPS, config: { damping: 8, stiffness: 220 } })}) rotate(${interpolate(frame, [56, 80], [-180, 0], clamp)}deg)`,
          }}
        >
          <Asterisk size={64} />
        </div>
      </div>

      {/* follow prompt */}
      <div
        style={{
          position: "absolute",
          top: wordY + 220,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: ease(frame, 62, 74),
          transform: `translateY(${(1 - ease(frame, 62, 76)) * 24}px)`,
        }}
      >
        <div
          style={{
            padding: "18px 44px",
            borderRadius: 999,
            border: `2px solid ${C.accent}`,
            background: `rgba(255,181,71,${0.1 + 0.08 * pulse})`,
            color: C.accent,
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: 38,
          }}
        >
          Follow for more
        </div>
      </div>
    </div>
  );
};
