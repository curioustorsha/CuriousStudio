import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Label, pop, Space, Window } from "../../../productui";
import { CardWindow, clampI, fold, Header, SourceLine, TEST_SOURCE, useCode } from "./common";

const SIZE = 17;
const ED = { x: 60, y: 460, w: 680, h: 720 };
const PV = { x: 720, y: 620, w: 290 };
/** proof/after/src/TitleCard.tsx: Title element (18–26) + its opacity timing (34), Byline element (57–66) + its timing (71). */
const RANGES: [number, number][] = [
  [18, 26],
  [34, 34],
  [57, 66],
  [71, 71],
];

/** An amber name tag pinned inside the card (card units, 1080 × 1920). */
const CardTag: React.FC<{ text: string; y: number; p: number }> = ({ text, y, p }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${0.7 + 0.3 * p})` }}>
    <div style={{ padding: "10px 34px", borderRadius: 22, border: `6px solid ${C.accent}`, background: "rgba(5,6,10,0.9)", fontFamily: F.mono, fontWeight: 800, fontSize: 72, color: C.accent, whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

/** "With the skills, each line got a name, with its timing in seconds written right on it." */
export const After: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { after } = useCode();
  if (!after) return null;
  const tSkills = wf("after", "skills");
  const tName = wf("after", "name");
  const tSeconds = wf("after", "seconds");
  const { text, at } = fold(after, RANGES);
  const slide = pop(f, 0, fps);
  const bright = clampI(f, tSkills - 4, tSkills + 8);
  const nameT = clampI(f, tName - 2, tName + 8);
  const nameB = clampI(f, tName + 8, tName + 18);
  const secT = clampI(f, tSeconds - 2, tSeconds + 8);
  const secB = clampI(f, tSeconds + 6, tSeconds + 16);
  const spans = [
    { line: at(25), text: 'name="Title"', p: nameT },
    { line: at(64), text: 'name="Byline"', p: nameB },
    { line: at(34), text: "0.5 * fps", p: secT },
    { line: at(71), text: "0.7 * fps", p: secB },
  ];
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.3} />
      <Sfx name="ding" at={tName} volume={0.3} />
      <Sfx name="click" at={tSeconds} volume={0.3} />
      <Sfx name="click" at={tSeconds + 8} volume={0.3} />
      <Space />
      <Header title="Named lines, in seconds" />
      <Label text="WITH REMOTION SKILLS" color={C.accent} style={{ top: 420, left: 66, opacity: 0.4 + 0.6 * bright }} />
      <div style={{ opacity: slide, transform: `translateX(${(1 - slide) * 300}px)` }}>
        <Window title="TitleCard.tsx" {...ED} tilt={-4} style={{ filter: `brightness(${0.75 + 0.25 * bright})` }}>
          <CodePane code={text} size={SIZE} spans={spans} />
        </Window>
      </div>
      <CardWindow
        kind="after"
        {...PV}
        loop
        tilt={-4}
        overlay={
          <>
            <CardTag text={secT > 0 ? "Title · 0–0.6 s" : "Title"} y={700} p={nameT} />
            <CardTag text={secB > 0 ? "Byline · 0.7–1.2 s" : "Byline"} y={1140} p={nameB} />
          </>
        }
      />
      <SourceLine text={TEST_SOURCE} />
    </>
  );
};
