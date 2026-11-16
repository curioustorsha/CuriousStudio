import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Label, pop, Space, Window } from "../../../productui";
import { clampI, Header, SourceLine, Tag, TEST_SOURCE, useCode } from "./common";

/** First sentence of our test prompt, exactly as given to both runs (research, Proof). */
export const PROMPT = "Make a 3-second animated title card in Remotion for a vertical Short (1080x1920, 30 fps).";

/** Guides the after run read (proof/after/skill-files-read.md): the router, then three of the eleven others. */
const ROUTER = "/remotion-best-practices";
const GUIDES = ["markup", "studio", "timing", "+9 more"];

const Chip: React.FC<{ text: string; p: number; strong?: boolean }> = ({ text, p, strong }) => (
  <div
    style={{
      padding: strong ? "8px 16px" : "6px 12px",
      borderRadius: 10,
      border: `2px solid ${strong ? C.accent : "rgba(255,181,71,0.45)"}`,
      background: strong ? "rgba(255,181,71,0.14)" : "rgba(255,181,71,0.05)",
      boxShadow: strong ? `0 0 30px ${C.accent}33` : undefined,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: strong ? 22 : 19,
      color: strong ? C.accent : C.text,
      whiteSpace: "nowrap",
      opacity: p,
      transform: `translateY(${(1 - p) * -24}px) scale(${0.7 + 0.3 * p})`,
    }}
  >
    {text}
  </div>
);

/** "We asked Claude for a title card in Remotion, with and without Remotion's own skills." */
export const Task: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { before, after } = useCode();
  if (!before || !after) return null;
  const tAsked = wf("task", "asked");
  const tRemotion = wf("task", "remotion");
  const tWith = wf("task", "with");
  const tWithout = wf("task", "without");
  const tSkills = wf("task", "skills");
  const chat = pop(f, 0, fps);
  const typed = Math.floor(clampI(f, tAsked, tRemotion + 14, 0, PROMPT.length));
  const typing = typed < PROMPT.length && f >= tAsked;
  const left = pop(f, tWith, fps);
  const right = pop(f, tWithout + 2, fps);
  return (
    <>
      <Sfx name="ticker" at={tAsked} volume={0.12} dur={tRemotion + 14 - tAsked} />
      <Sfx name="swoosh" at={tWith} volume={0.3} />
      <Sfx name="swoosh" at={tWithout + 2} volume={0.2} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="pop" at={tSkills + i * 4} volume={0.25} />
      ))}
      <Space />
      <Header title="Same task, twice" />
      <div style={{ opacity: chat, transform: `translateY(${(1 - chat) * 40}px)` }}>
        <Window title="Claude" x={60} y={450} w={900} h={190} tilt={Math.sin(f / 55) * 1.5}>
          <div style={{ padding: "24px 32px", fontFamily: F.sans, fontSize: 32, lineHeight: 1.35, color: C.text }}>
            {PROMPT.slice(0, typed)}
            <span style={{ color: C.accent, opacity: typing || Math.floor(f / 12) % 2 === 0 ? 1 : 0 }}>▍</span>
          </div>
        </Window>
      </div>
      <Tag text="OUR TEST · TWO FRESH CLAUDES" p={pop(f, tWith, fps)} top={688} left={60} />
      <div style={{ opacity: left, transform: `translateX(${(1 - left) * -120}px)` }}>
        <Label text="WITHOUT" color={C.muted} style={{ top: 744, left: 66, fontSize: 20 }} />
        <Window title="TitleCard.tsx" x={60} y={780} w={430} h={330} tilt={5} dim>
          <CodePane code={before} size={12} />
        </Window>
      </div>
      <div style={{ opacity: right, transform: `translateX(${(1 - right) * 120}px)` }}>
        <Label text="WITH REMOTION SKILLS" color={C.accent} style={{ top: 744, left: 526, fontSize: 20 }} />
        <Window title="TitleCard.tsx" x={520} y={780} w={440} h={330} tilt={-5}>
          <CodePane code={after} size={12} />
        </Window>
      </div>
      <div style={{ position: "absolute", left: 520, top: 1124, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex" }}>
          <Chip text={ROUTER} p={pop(f, tSkills, fps, 14)} strong />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {GUIDES.map((g, i) => (
            <Chip key={g} text={g} p={pop(f, tSkills + 4 + i * 4, fps, 14)} />
          ))}
        </div>
      </div>
      <SourceLine text={TEST_SOURCE} />
    </>
  );
};
