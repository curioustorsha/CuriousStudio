import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { C } from "../../../theme";
import { Bench, BENCH, Chip, CLAUDE_REST, Desk, ez, Host, moodAt, pointHands, sp, Stage, Wall, WS } from "../../../workshop";
import { DeskObjects, OBJ } from "./Hook";
import { DeskTiles } from "./Desk";
import { LessonHeader } from "./common";

export const CHIPS = { you: [OBJ.q + 107, 800], file: [OBJ.file + 75, 740], claude: [OBJ.reply + 107, 800] } as const;

/** The three objects + chips at rest (the end of onit, the start of pile). */
export const OnitRest: React.FC<{ chips?: number; out?: number }> = ({ chips = 1, out = 0 }) => (
  <>
    <Chip text="YOU" x={CHIPS.you[0]} y={CHIPS.you[1]} p={chips} opacity={1 - out} />
    <Chip text="FILE" x={CHIPS.file[0]} y={CHIPS.file[1]} p={chips} opacity={1 - out} />
    <Chip text="CLAUDE" x={CHIPS.claude[0]} y={CHIPS.claude[1]} p={chips} opacity={1 - out} />
  </>
);

/** What goes on the desk: your message, a file, and Claude's own reply. All three inside the outline. */
export const Onit: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tMessages = wf("onit", "messages");
  const tFile = wf("onit", "file");
  const tReply = wf("onit", "reply");
  const tWrites = wf("onit", "writes");

  const off = ez(f, 0, 14);
  const pQ = sp(f, tMessages - 6, { damping: 15, stiffness: 190 });
  const pF = sp(f, tFile - 4, { damping: 13, stiffness: 210 });
  const pR = sp(f, tReply - 2, { damping: 14, stiffness: 220 });
  const amber = f >= tReply - 4 && f < tWrites + 8;
  const cY = sp(f, tMessages + 2, { damping: 13, stiffness: 210 });
  const cF = sp(f, tFile + 4, { damping: 13, stiffness: 210 });
  const cC = sp(f, tWrites, { damping: 13, stiffness: 210 });
  const bracket = ez(f, tWrites + 6, tWrites + 20);
  const target: [number, number] = [OBJ.reply + 107, WS.benchTop - 130];
  const hands = f >= tReply - 12 ? pointHands(target, ez(f, tReply - 12, tReply - 4) * (1 - ez(f, tWrites + 6, tWrites + 14))) : CLAUDE_REST;
  const m = moodAt(f, [
    [0, "idle"],
    [tWrites + 10, "gotit"],
  ]);
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.15} />
      <Sfx name="swoosh" at={tMessages - 6} volume={0.25} />
      <Sfx name="thud" at={tFile} volume={0.25} />
      <Sfx name="pop" at={tReply} volume={0.3} />
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <Desk />
        {off < 1 && <DeskTiles dx={off * 700} opacity={1 - ez(f, 6, 14)} />}
        <DeskObjects p={[pQ, pF, pR]} amber={amber} />
        <Chip text="YOU" x={CHIPS.you[0]} y={CHIPS.you[1]} p={cY} />
        <Chip text="FILE" x={CHIPS.file[0]} y={CHIPS.file[1]} p={cF} />
        <Chip text="CLAUDE" x={CHIPS.claude[0]} y={CHIPS.claude[1]} p={cC} />
        {bracket > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <polyline
              points={`${OBJ.q} ${WS.benchTop + 44} ${OBJ.q} ${WS.benchTop + 58} ${OBJ.reply + 214} ${WS.benchTop + 58} ${OBJ.reply + 214} ${WS.benchTop + 44}`}
              fill="none"
              stroke={C.accent}
              strokeWidth={5}
              pathLength={1}
              strokeDasharray={`${bracket} 1`}
            />
          </svg>
        )}
      </Stage>
      <LessonHeader title="What lands on it" />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
