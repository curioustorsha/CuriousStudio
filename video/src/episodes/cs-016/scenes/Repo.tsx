import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { pop, RepoCard, Space } from "../../../productui";
import { Header, SourceLine } from "./common";

const Chip: React.FC<{ text: string; p: number; x: number }> = ({ text, p, x }) => (
  <div
    style={{
      position: "absolute",
      top: 950,
      left: x,
      padding: "12px 26px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.05)",
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 26,
      letterSpacing: 2,
      color: C.text,
      opacity: p,
      transform: `translateY(${(1 - p) * 30}px)`,
    }}
  >
    {text}
  </div>
);

/** "This is Ponytail, a free skill with over 190k stars": the repo card, stars counting up to the word "stars". */
export const Repo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tName = wf("repo", "ponytail");
  const tFree = wf("repo", "free");
  const tStars = wf("repo", "stars");
  return (
    <>
      <Sfx name="whoosh" at={tName - 4} volume={0.3} />
      <Sfx name="ticker" at={tName + 8} volume={0.18} dur={42} />
      <Sfx name="ding" at={tStars} volume={0.3} />
      <Space />
      <Header title="Meet Ponytail" />
      <RepoCard repo="ponytail" maker="DietrichGebert" stars={190910} at={tName - 6} x={110} y={540 + Math.sin(f / 40) * 4} />
      <Chip text="FREE" p={pop(f, tFree, fps)} x={110} />
      <Chip text="MIT LICENCE" p={pop(f, tFree + 6, fps)} x={290} />
      <Chip text="CLAUDE CODE PLUGIN" p={pop(f, tFree + 12, fps)} x={580} />
      <SourceLine text="SOURCE · GitHub, 190,910 stars on 14 Nov 2026" opacity={pop(f, tStars, fps)} />
    </>
  );
};
