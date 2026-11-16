import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, pop, Space, Window } from "../../../productui";
import { clampI, Header, parseRules, REPO_URL, SourceLine, useProof } from "./common";
import { RulesWindow } from "./Trick";

const Row: React.FC<{ k: string; v: React.ReactNode; p: number; note?: React.ReactNode }> = ({ k, v, p, note }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "22px 36px", borderBottom: "1px solid rgba(255,255,255,0.07)", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
    <div style={{ width: 230, fontFamily: F.mono, fontSize: 24, color: C.muted, letterSpacing: 1 }}>{k}</div>
    <div style={{ fontFamily: F.sans, fontSize: 34, fontWeight: 700, color: C.text }}>{v}</div>
    {note}
  </div>
);

/** "The catch: Karpathy didn't write it. A developer built it from his post. No updates since April, and no licence file, though it says MIT." */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { rules } = useProof();
  if (!rules) return null;
  const tDidnt = wf("catch", "didnt");
  const tDev = wf("catch", "developer");
  const tUpdates = wf("catch", "updates");
  const tLicence = wf("catch", "licence");
  const tMit = wf("catch", "mit");
  const away = clampI(f, 0, 12);
  // the card lands as the rules window leaves, so the frame is never empty; its line lights on "didn't"
  const card = pop(f, 6, fps);
  const lineOn = clampI(f, tDidnt - 4, tDidnt + 4, 0.35, 1);
  const win = pop(f, tDev - 4, fps);
  const list = parseRules(rules);
  return (
    <>
      <Sfx name="pop" at={6} volume={0.35} />
      <Sfx name="click" at={tDidnt - 4} volume={0.25} />
      <Sfx name="whoosh" at={tDev - 4} volume={0.25} />
      <Sfx name="click" at={tDev + 4} volume={0.3} />
      <Sfx name="click" at={tUpdates} volume={0.3} />
      <Sfx name="click" at={tLicence - 2} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      {away < 1 && (
        <div style={{ opacity: 1 - away, transform: `translateX(${-away * 700}px)` }}>
          <RulesWindow f={f} rules={list} state={() => ({ inP: 1, glow: 0, fragP: 1 })} dim scale={1.03} />
        </div>
      )}
      <CatchCard x={110} y={450} p={card} text={<span style={{ opacity: lineOn }}>Not written by Karpathy.</span>} />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 80}px)` }}>
        <Window kind="browser" title={REPO_URL} x={60} y={730} w={960} h={340} tilt={Math.sin(f / 60) * 1.5}>
          <div style={{ paddingTop: 10 }}>
            <Row k="Built by" v="Jiayuan Zhang (forrestchang)" p={pop(f, tDev + 2, fps)} />
            <Row k="Last update" v="20 Apr 2026" p={pop(f, tUpdates - 2, fps)} />
            <Row
              k="Licence file"
              v={<span style={{ color: C.accent }}>none</span>}
              p={pop(f, tLicence - 4, fps)}
              note={<div style={{ marginLeft: "auto", fontFamily: F.mono, fontSize: 22, color: C.muted, opacity: clampI(f, tMit - 6, tMit + 4) }}>README says MIT</div>}
            />
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · GitHub API, checked 15 Nov 2026" />
    </>
  );
};
