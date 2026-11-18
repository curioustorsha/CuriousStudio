import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useTiming, useWord } from "../../../engine/kit";
import { NextCard } from "../../../engine/cards";
import { moodAt } from "../../../workshop";
import { OutroView } from "./Outro";

/** The full desk holds, dimmed, and the "Next:" card for Lesson 4 slides up. */
export const Next: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const t = useTiming();
  const tNext = wf("next", "next");
  const tForgets = wf("next", "forgets");
  const last = t.sceneFrames("outro") - 1;
  return (
    <>
      <Sfx name="swoosh" at={tNext - 2} volume={0.32} />
      <Sfx name="ding" at={tForgets} volume={0.3} />
      <OutroView f={last + f} header={false} dim={0.35} m={moodAt(f, [[0, "unsure"]])} />
      <NextCard f={f} tIn={tNext - 4} tTick={tForgets} title={'LESSON 4 · WHY CLAUDE "FORGETS"'} sub="When the desk is full" top={420} />
    </>
  );
};
