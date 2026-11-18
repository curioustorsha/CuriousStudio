import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, Chip, Desk, DeskRuler, ez, Host, mixCam, moodAt, Pile, pileLevel, pileTop, sp, Stage, TerminalPanel, Wall, WALL, WIDE } from "../../../workshop";
import { landed, LessonHeader, N_KEEPS } from "./common";

const LINES = ["models overview", "  claude-sonnet-5-5", "  Context window"];
const CHARS = LINES.reduce((a, l) => a + l.length, 0);

/** The ruler with the chat's pile, settled thin and low (end of size, start of fixed). */
export const SIZE_LEVEL = pileLevel(N_KEEPS, 1);

/** Up to 1M tokens: the docs' row on the wall, then the ruler draws up the desk's edge; this chat sits low on it. */
export const Size: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tMillion = wf("size", "million");
  const tThats = wf("size", "thats");
  const tFive = wf("size", "five");

  const slideUp = sp(f, 0, { damping: 16, stiffness: 150 });
  const typed = (f - 3) * 3.4;
  const resultP = ez(f, tMillion - 2, tMillion + 4);
  const shrink = ez(f, tThats - 4, tThats + 10);
  const cam = mixCam(WALL, WIDE, ez(f, tThats - 4, tThats + 18));
  const ruler = ez(f, tThats + 2, tThats + 22);
  const thin = ez(f, tThats + 8, tThats + 26);
  const pileO = 0.3 + 0.7 * ez(f, tThats, tThats + 12);
  const levelP = ez(f, tThats + 22, tThats + 30);
  const chat = sp(f, tThats + 26, { damping: 13, stiffness: 210 });
  const words = sp(f, tFive - 2, { damping: 13, stiffness: 210 });
  const m = moodAt(f, [
    [0, "idle"],
    [tMillion + 2, "gotit"],
  ]);
  return (
    <>
      <Sfx name="data" at={2} volume={0.14} dur={Math.max(10, tMillion - 4)} />
      <Sfx name="ding" at={tMillion} volume={0.3} />
      <Sfx name="swoosh" at={tThats - 4} volume={0.22} />
      <Sfx name="ticker" at={tThats + 2} volume={0.16} dur={20} />
      <Sfx name="pop" at={tFive - 2} volume={0.28} />
      <Stage cam={cam}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        <Desk />
        <Pile lands={landed(N_KEEPS)} thin={thin} opacity={pileO} />
        <DeskRuler draw={ruler} level={pileLevel(N_KEEPS, thin)} levelP={levelP} />
        {shrink < 1 && (
          <TerminalPanel
            x={190}
            y={450 + (1 - slideUp) * 120}
            w={660}
            lines={LINES}
            typed={Math.min(CHARS, typed)}
            result="→ 1M tokens"
            resultP={resultP}
            label="Claude API docs · checked 16 Nov 2026"
            scale={1 - 0.85 * shrink}
            opacity={Math.min(1, slideUp * 2) * (1 - shrink)}
            origin="90% 100%"
          />
        )}
        <Chip text="THIS CHAT" x={680} y={pileTop(N_KEEPS, 1) - 34} p={chat} size={22} />
        <Chip text="≈ 555K WORDS" x={760} y={598} p={words} size={22} />
      </Stage>
      <LessonHeader title={<>Up to <span style={{ color: "#FFB547" }}>1M</span> tokens</>} />
      <Source text="Claude Docs, Models overview, Nov 2026" />
    </>
  );
};
