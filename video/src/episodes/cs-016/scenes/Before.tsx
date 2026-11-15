import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Label, pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, useProof } from "./common";

const Tag: React.FC<{ text: string; p: number; y: number }> = ({ text, p, y }) => (
  <div
    style={{
      position: "absolute",
      right: 70,
      top: y,
      padding: "14px 26px",
      borderRadius: 14,
      background: "rgba(255,92,92,0.14)",
      border: `2px solid ${C.red}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 30,
      color: C.text,
      opacity: p,
      transform: `translateX(${(1 - p) * 80}px) rotate(${(1 - p) * 4}deg)`,
      boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    }}
  >
    {text}
  </div>
);

/** Without Ponytail: the long answer scrolls by; the three things it built pop in on their words. */
export const Before: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const { before } = useProof();
  if (!before) return null;
  const tHelper = wf("before", "helper");
  const tWrapper = wf("before", "wrapper");
  const tConfig = wf("before", "config");
  return (
    <>
      <Sfx name="pop" at={tHelper} volume={0.35} />
      <Sfx name="pop" at={tWrapper} volume={0.35} />
      <Sfx name="pop" at={tConfig} volume={0.35} />
      <Space />
      <Header title="Without Ponytail" />
      <Label text="WITHOUT · 116 LINES" color={C.muted} style={{ top: 420, left: 70 }} />
      <Window title="search.js" x={60} y={460} w={960} h={780} tilt={-3} dim>
        <CodePane code={before} scroll={clampI(f, 0, D, 0, 2600)} size={17} />
      </Window>
      <Tag text="helper function" p={pop(f, tHelper, fps, 13)} y={620} />
      <Tag text="class wrapper" p={pop(f, tWrapper, fps, 13)} y={760} />
      <Tag text="config object" p={pop(f, tConfig, fps, 13)} y={900} />
      <SourceLine text="SOURCE · ponytail repo, examples/debounce.md (maker's test)" />
    </>
  );
};
