import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../theme";
import { LogoMark, Wordmark } from "../brand";

/**
 * Aster: the Curiously asterisk as the channel's host. No face, no limbs: it acts only through motion.
 * Six square-cut rays (same proportions as the brand asterisk). Each ray can stretch or droop.
 */

export type AsterProps = {
  size: number;
  rot?: number; // degrees
  /** one ray (0–5) reaches out to point */
  point?: number | null;
  reach?: number; // 0–1
  /** rays sag downwards: unsure */
  droop?: number; // 0–1
  glow?: number; // 0–1
  color?: string;
  opacity?: number;
};

export const Aster: React.FC<AsterProps> = ({ size, rot = 0, point = null, reach = 1, droop = 0, glow = 0, color = C.accent, opacity = 1 }) => {
  const rays = [0, 1, 2, 3, 4, 5].map((i) => {
    let a = rot + i * 60;
    const norm = ((a % 360) + 360) % 360;
    const toDown = 180 - norm; // pull towards straight down
    a += toDown * droop * 0.13;
    const len = 50 * (i === point ? 1 + 0.75 * reach : point !== null ? 1 - 0.12 * reach : 1) * (1 - droop * 0.12);
    return { a, len };
  });
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ overflow: "visible", display: "block", opacity }}>
      {glow > 0 && (
        <>
          <defs>
            <radialGradient id="asterGlow">
              <stop offset="0" stopColor={color} stopOpacity={0.55 * glow} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle r={95} fill="url(#asterGlow)" />
        </>
      )}
      {rays.map(({ a, len }, i) => {
        const r = (a * Math.PI) / 180;
        return <line key={i} x1={0} y1={0} x2={Math.sin(r) * len} y2={-Math.cos(r) * len} stroke={color} strokeWidth={28} strokeLinecap="butt" />;
      })}
      <circle r={14.5} fill={color} />
    </svg>
  );
};

// ── design sheet ────────────────────────────────────────────────────────────────────────────────────

const Ghosts: React.FC<{ n: number; dx: number; dy?: number; rot?: number; size: number; base: AsterProps }> = ({ n, dx, dy = 0, rot = 0, size, base }) => (
  <>
    {[...Array(n)].map((_, i) => (
      <div key={i} style={{ position: "absolute", left: `calc(50% - ${size / 2}px + ${dx * (i + 1)}px)`, top: `calc(50% - ${size / 2}px + ${dy * (i + 1)}px)` }}>
        <Aster {...base} size={size} rot={(base.rot ?? 0) + rot * (i + 1)} opacity={0.18 - i * 0.05} />
      </div>
    ))}
  </>
);

const Mood: React.FC<{ name: string; how: string; children: React.ReactNode }> = ({ name, how, children }) => (
  <div style={{ width: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ position: "relative", width: 300, height: 260, borderRadius: 26, background: "#11131A", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {children}
    </div>
    <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 26, color: C.text, marginTop: 14 }}>{name}</div>
    <div style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 17, color: C.muted, marginTop: 4, textAlign: "center", lineHeight: 1.35 }}>{how}</div>
  </div>
);

/** A 9:16 thumbnail of the "Read, guess, add, repeat" scene, in a dark or light look. */
const SceneThumb: React.FC<{ light: boolean }> = ({ light }) => {
  const bg = light ? "#F7F3EC" : C.bg;
  const ink = light ? "#1C1B1F" : C.text;
  const line = light ? "rgba(28,27,31,0.14)" : "rgba(255,255,255,0.12)";
  const card = light ? "#FFFFFF" : "#141720";
  const chip = (t: string, on = false, ghost = false) => (
    <div style={{ padding: "4px 9px", borderRadius: 7, fontFamily: F.sans, fontWeight: 700, fontSize: 13, color: on ? "#1C1B1F" : ink, background: ghost ? "transparent" : on ? C.accent : light ? "#EFEAE2" : "#1E2230", border: ghost ? `1.5px dashed ${line}` : `1.5px solid ${line}`, minWidth: ghost ? 44 : undefined, height: ghost ? 16 : undefined }}>{ghost ? "" : t}</div>
  );
  return (
    <div style={{ width: 250, height: 444, borderRadius: 22, background: bg, border: "1px solid rgba(255,255,255,0.12)", position: "relative", overflow: "hidden", fontFamily: F.sans }}>
      <div style={{ position: "absolute", top: 14, left: 14, fontWeight: 800, fontSize: 12, color: ink, opacity: 0.8 }}>curiously</div>
      <div style={{ position: "absolute", top: 40, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 8, letterSpacing: 1.5, color: light ? "#B9741A" : C.accent }}>LESSON 1 · WHAT CLAUDE IS</div>
      <div style={{ position: "absolute", top: 54, left: 0, right: 0, textAlign: "center", fontWeight: 900, fontSize: 18, letterSpacing: -0.6, color: ink }}>Read, guess, add, repeat</div>
      <div style={{ position: "absolute", top: 96, left: 16, right: 16, borderRadius: 12, background: card, border: `1.5px solid ${line}`, padding: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: ink, opacity: 0.7, marginBottom: 6 }}>Why is the sky blue?</div>
        <div style={{ display: "flex", gap: 5 }}>
          {chip("Blue")}
          {chip("light")}
          {chip("", false, true)}
        </div>
      </div>
      {/* candidates with bars */}
      {[
        ["scatters", 0.86],
        ["is", 0.42],
        ["looks", 0.27],
      ].map(([w, o], i) => (
        <div key={w as string} style={{ position: "absolute", left: 104, top: 196 + i * 30, display: "flex", alignItems: "center", gap: 6 }}>
          {chip(w as string, i === 0)}
          <div style={{ width: 56, height: 6, borderRadius: 3, background: line }}>
            <div style={{ width: `${(o as number) * 100}%`, height: "100%", borderRadius: 3, background: i === 0 ? C.accent : light ? "rgba(28,27,31,0.35)" : "rgba(255,255,255,0.35)" }} />
          </div>
        </div>
      ))}
      <div style={{ position: "absolute", left: 24, top: 186 }}>
        <Aster size={74} rot={18} point={1} reach={1} glow={0.7} color={light ? "#F2A516" : C.accent} />
      </div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, textAlign: "center", fontWeight: 900, fontSize: 20, color: ink }}>
        picks a <span style={{ color: light ? "#D98A0B" : C.accent }}>likely</span>
      </div>
    </div>
  );
};

export const AsterSheet: React.FC = () => {
  const S = 150;
  return (
    <AbsoluteFill style={{ background: C.bg, padding: "46px 64px", fontFamily: F.sans }}>
      <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 19, letterSpacing: 3, color: C.accent }}>CURIOUSLY · HOST · DESIGN V1</div>
      <div style={{ fontWeight: 800, fontSize: 48, color: C.text, marginTop: 6, letterSpacing: -1 }}>Aster: our asterisk, acting only through motion</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
        <Mood name="Thinking" how="Turns slowly, a soft pulse of light">
          <div style={{ position: "absolute", width: 230, height: 230, borderRadius: "50%", border: `2px solid ${C.accent}33` }} />
          <div style={{ position: "absolute", width: 190, height: 190, borderRadius: "50%", border: `2px solid ${C.accent}55` }} />
          <Aster size={S} rot={8} glow={0.6} />
        </Mood>
        <Mood name="Pointing" how="One ray reaches towards the thing that matters">
          <div style={{ position: "absolute", right: 22, top: 86, padding: "6px 12px", borderRadius: 10, background: C.accent, fontWeight: 800, fontSize: 20, color: "#1C1B1F" }}>scatters</div>
          <div style={{ marginLeft: -70 }}>
            <Aster size={S} rot={30} point={1} reach={1} />
          </div>
        </Mood>
        <Mood name="No" how="A quick side-to-side shake">
          <Ghosts n={2} dx={-22} size={S} base={{ size: S, rot: -8 }} />
          <Ghosts n={2} dx={22} size={S} base={{ size: S, rot: 8 }} />
          <Aster size={S} rot={0} />
        </Mood>
        <Mood name="Got it" how="A crisp spin and a burst of light">
          <Ghosts n={3} dx={0} rot={-14} size={S} base={{ size: S, rot: 0 }} />
          <svg width={260} height={260} viewBox="-130 -130 260 260" style={{ position: "absolute" }}>
            {[...Array(12)].map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              return <line key={i} x1={Math.sin(a) * 100} y1={-Math.cos(a) * 100} x2={Math.sin(a) * 122} y2={-Math.cos(a) * 122} stroke={C.accent} strokeWidth={5} strokeLinecap="round" opacity={0.8} />;
            })}
          </svg>
          <Aster size={S} rot={0} glow={1} />
        </Mood>
        <Mood name="Unsure" how="Rays sag a little, the turn slows">
          <div style={{ marginTop: 26 }}><Aster size={S} rot={30} droop={1} opacity={0.85} /></div>
        </Mood>
      </div>

      <div style={{ display: "flex", gap: 60, marginTop: 40, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: C.text }}>The reveal, in Lesson 1's intro</div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>Aster glides into the C and becomes the Curiously logo: the host is the brand.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 26 }}>
            <div style={{ position: "relative", width: 150, height: 150 }}>
              <div style={{ position: "absolute", left: -20, top: 10 }}>
                <Aster size={110} rot={40} glow={0.4} />
              </div>
            </div>
            <div style={{ fontSize: 34, color: C.muted }}>→</div>
            <div style={{ position: "relative", width: 150, height: 150 }}>
              <div style={{ position: "absolute", inset: 0, opacity: 0.6 }}>
                <LogoMark size={150} arc={0.55} starDraw={0} />
              </div>
              <div style={{ position: "absolute", left: 60, top: 26 }}>
                <Aster size={80} rot={20} />
              </div>
            </div>
            <div style={{ fontSize: 34, color: C.muted }}>→</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <LogoMark size={150} />
              <Wordmark size={42} />
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 28, color: C.text }}>In a lesson: dark or light?</div>
          <div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>Same scene, Aster pointing at the likely next word.</div>
          <div style={{ display: "flex", gap: 26, marginTop: 18 }}>
            <SceneThumb light={false} />
            <SceneThumb light />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
