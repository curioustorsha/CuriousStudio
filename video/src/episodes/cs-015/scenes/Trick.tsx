import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { pop, Space, Window } from "../../../productui";
import { clampI, FRAGMENTS, Header, parseRules, SourceLine, useProof } from "./common";

/** One rule from CLAUDE.md: number + heading, its line, and (once `fragP` > 0) the matching words from Karpathy's post. */
const RuleCard: React.FC<{ n: number; head: string; line: string; inP: number; glow: number; fragP: number; fragment: string }> = ({ n, head, line, inP, glow, fragP, fragment }) => (
  <div
    style={{
      height: 168,
      marginBottom: 12,
      padding: "18px 26px",
      borderRadius: 18,
      border: `2px solid ${glow > 0 ? `rgba(255,181,71,${0.25 + 0.75 * glow})` : "rgba(255,255,255,0.12)"}`,
      background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)), rgba(255,181,71,${0.1 * glow})`,
      boxShadow: glow > 0 ? `0 0 ${50 * glow}px ${C.accent}44` : "0 18px 40px rgba(0,0,0,0.4)",
      opacity: inP,
      transform: `translateY(${(1 - inP) * -90}px) scale(${1.06 - 0.06 * inP})`,
    }}
  >
    <div style={{ fontFamily: F.sans, fontSize: 36, fontWeight: 800, letterSpacing: -0.5, color: glow > 0.5 ? C.accent : C.text }}>
      <span style={{ fontFamily: F.mono, color: C.accent, marginRight: 14 }}>{n}.</span>
      {head}
    </div>
    <div style={{ fontFamily: F.sans, fontSize: 25, color: "rgba(245,245,247,0.78)", marginTop: 8 }}>{line}</div>
    <div style={{ fontFamily: F.mono, fontSize: 22, fontStyle: "italic", color: C.muted, marginTop: 10, opacity: fragP, transform: `translateY(${(1 - fragP) * 10}px)` }}>
      Karpathy: “{fragment}”
    </div>
  </div>
);

/** The CLAUDE.md window with its four rule cards; `state` gives each card's drop-in, glow and fragment progress. */
export const RulesWindow: React.FC<{ f: number; rules: { head: string; line: string }[]; state: (i: number) => { inP: number; glow: number; fragP: number }; dim?: boolean; scale?: number }> = ({ f, rules, state, dim, scale = 1 }) => (
  <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "50% 45%" }}>
    <Window title="CLAUDE.md" x={60} y={430} w={960} h={800} tilt={Math.sin(f / 60) * 1.8} dim={dim}>
      <div style={{ padding: "20px 24px" }}>
        {rules.map((r, i) => (
          <RuleCard key={r.head} n={i + 1} head={r.head} line={r.line} fragment={FRAGMENTS[i]} {...state(i)} />
        ))}
      </div>
    </Window>
  </div>
);

/** "That's rule one: think before coding. The other three: keep it simple, change only what you must, and work toward a goal you can check. Each one comes from his post." */
export const Trick: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const { rules } = useProof();
  if (!rules) return null;
  const list = parseRules(rules);
  const cues = [wf("trick", "one"), wf("trick", "simple"), wf("trick", "change"), wf("trick", "goal")];
  const tPost = wf("trick", "post");
  const tEach = wf("trick", "each");
  const win = pop(f, 0, fps);
  const state = (i: number) => {
    const inP = pop(f, cues[i] - 4, fps, 15);
    const next = cues[i + 1] ?? tEach;
    const lit = clampI(f, cues[i] - 2, cues[i] + 6) * (1 - clampI(f, next - 2, next + 8, 0, i === 0 ? 0.7 : 1));
    const fragP = clampI(f, tPost - 10 + i * 3, tPost + i * 3);
    return { inP, glow: lit, fragP };
  };
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.25} />
      {cues.map((c, i) => (
        <Sfx key={i} name="thud" at={c - 2} volume={0.22} />
      ))}
      <Sfx name="ding" at={tPost} volume={0.35} />
      <Space />
      <Header title="Four rules" />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 60}px)` }}>
        <RulesWindow f={f} rules={list} state={state} scale={1 + 0.03 * clampI(f, 0, D)} />
      </div>
      <SourceLine text="SOURCE · CLAUDE.md; Karpathy on X, 26 Jan 2026 (via README)" />
    </>
  );
};
