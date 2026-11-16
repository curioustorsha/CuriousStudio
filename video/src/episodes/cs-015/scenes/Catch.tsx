import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, pop, Space, Window } from "../../../productui";
import { clampI, Header, REPO_URL, SourceLine } from "./common";

const Row: React.FC<{ k: string; v: React.ReactNode; p: number; note?: React.ReactNode }> = ({ k, v, p, note }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "22px 36px", borderBottom: "1px solid rgba(255,255,255,0.07)", opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
    <div style={{ width: 230, fontFamily: F.mono, fontSize: 24, color: C.muted, letterSpacing: 1 }}>{k}</div>
    <div style={{ fontFamily: F.sans, fontSize: 34, fontWeight: 700, color: C.text }}>{v}</div>
    {note}
  </div>
);

/** "The catch: Karpathy didn't write it. A developer built it from his post, and there's no licence file." */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tDidnt = wf("catch", "didnt");
  const tDev = wf("catch", "developer");
  const tLicence = wf("catch", "licence");
  // the card lands at once; its line lights on "didn't"
  const card = pop(f, 6, fps);
  const lineOn = clampI(f, tDidnt - 4, tDidnt + 4, 0.35, 1);
  const win = pop(f, tDev - 4, fps);
  return (
    <>
      <Sfx name="pop" at={6} volume={0.35} />
      <Sfx name="click" at={tDidnt - 4} volume={0.25} />
      <Sfx name="whoosh" at={tDev - 4} volume={0.25} />
      <Sfx name="click" at={tDev + 4} volume={0.3} />
      <Sfx name="click" at={tLicence - 2} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      <CatchCard x={110} y={450} p={card} text={<span style={{ opacity: lineOn }}>Not written by Karpathy.</span>} />
      <div style={{ opacity: win, transform: `translateY(${(1 - win) * 80}px)` }}>
        <Window kind="browser" title={REPO_URL} x={60} y={730} w={960} h={240} tilt={Math.sin(f / 60) * 1.5}>
          <div style={{ paddingTop: 10 }}>
            <Row k="Built by" v="Jiayuan Zhang (forrestchang)" p={pop(f, tDev + 2, fps)} />
            <Row k="Licence file" v={<span style={{ color: C.accent }}>none</span>} p={pop(f, tLicence - 4, fps)} />
          </div>
        </Window>
      </div>
      <SourceLine text="SOURCE · GitHub API, checked 15 Nov 2026" />
    </>
  );
};
