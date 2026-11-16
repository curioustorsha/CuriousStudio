import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, Label, pop, Space, Window } from "../../../productui";
import { CardWindow, clampI, Header, lineTop, scrollTo, SourceLine, Tag, TEST_SOURCE, useCode } from "./common";

const SIZE = 20;
const ED = { x: 60, y: 460, w: 680, h: 780 };
const PV = { x: 700, y: 640, w: 300 };
/** proof/before/src/TitleCard.tsx: the imports (lines 2–8) and the word spring's timing (line 62). */
const IMPORTS = [2, 3, 4, 5, 6, 7, 8];
const TIMING_LINE = 62;

/** "Plain Claude already knows Remotion. But its timing hid in raw frame numbers: frame eight, five frames apart." */
export const Before: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const { before } = useCode();
  if (!before) return null;
  const tKnows = wf("before", "knows");
  const tBut = wf("before", "but");
  const tFrame = wf("before", "frame");
  const tEight = wf("before", "eight");
  const tFive = wf("before", "five");
  const scroll = spring({ frame: f - tBut, fps, config: { damping: 200, stiffness: 60 } }) * scrollTo(TIMING_LINE, SIZE, 9);
  const okP = clampI(f, tKnows - 2, tKnows + 8);
  const okOut = clampI(f, tBut, tBut + 10);
  const ringP = clampI(f, tFrame, tFrame + 12);
  const span = { text: "frame - 8 - i * 5", p: ringP };
  // slow-motion scrub through the real card: card frame 8 lands on "eight" (first word starts),
  // frame 13 on "five" (second word, five frames later)
  const perFrame = (tFive - tEight) / 5;
  const scrubFrom = Math.round(tEight - 4 * perFrame);
  const freeze = f >= scrubFrom ? Math.min(30, 8 + Math.floor((f - tEight) / perFrame)) : undefined;
  const hot = freeze !== undefined && (freeze === 8 || freeze === 13);
  const lineY = lineTop(ED.y, TIMING_LINE, SIZE, scroll);
  const eightP = pop(f, tEight, fps, 14);
  const fiveP = pop(f, tFive, fps, 14);
  return (
    <>
      <Sfx name="click" at={tKnows} volume={0.3} />
      <Sfx name="scan" at={tBut} volume={0.2} />
      <Sfx name="click" at={tFrame} volume={0.3} />
      <Sfx name="pop" at={tEight} volume={0.35} />
      <Sfx name="pop" at={tFive} volume={0.35} />
      <Space />
      <Header title="Timing in frame numbers" />
      <Label text="WITHOUT" color={C.muted} style={{ top: 420, left: 66 }} />
      <Window title="TitleCard.tsx" {...ED} tilt={4} accent={C.muted} style={{ filter: "saturate(0.6)" }}>
        <CodePane code={before} size={SIZE} scroll={scroll} marks={IMPORTS} markP={okP * (1 - okOut)} spans={[{ line: TIMING_LINE, ...span }]} />
      </Window>
      <Tag text="✓ CORRECT REMOTION CODE" color={C.green} p={okP * (1 - okOut)} top={720} left={300} />
      <Tag text="STARTS AT FRAME 8" p={eightP} top={lineY + 44} left={170} size={20} />
      <Tag text="+5 FRAMES PER WORD" p={fiveP} top={lineY + 92} left={170} size={20} />
      <CardWindow kind="before" {...PV} loop={freeze === undefined} freeze={freeze} dim tilt={-4} />
      {freeze !== undefined && (
        <div
          style={{
            position: "absolute",
            left: PV.x + 20,
            top: PV.y + 72,
            padding: "6px 14px",
            borderRadius: 10,
            background: hot ? C.accent : "rgba(5,6,10,0.85)",
            border: `2px solid ${C.accent}`,
            color: hot ? "#140d05" : C.accent,
            fontFamily: F.mono,
            fontWeight: 800,
            fontSize: 26,
            opacity: clampI(f, scrubFrom, scrubFrom + 6),
            transform: `scale(${hot ? 1.12 : 1})`,
            transformOrigin: "0 50%",
          }}
        >
          frame {freeze}
        </div>
      )}
      <SourceLine text={TEST_SOURCE} />
    </>
  );
};
