import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useTiming, useWord } from "../../../engine/kit";
import { NextCard } from "../../../engine/cards";
import { moodAt } from "../../../workshop";
import { OutroView } from "./Outro";

/** The full bench of tiles holds, dimmed, and the "Next:" card for Lesson 3 slides up. */
export const Next: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const t = useTiming();
  const tNext = wf("next", "next");
  const tContext = wf("next", "context");
  const last = t.sceneFrames("outro") - 1;
  return (
    <>
      <Sfx name="swoosh" at={tNext - 2} volume={0.32} />
      <Sfx name="ding" at={tContext} volume={0.35} />
      <OutroView f={last + f} header={false} dim={0.35} m={moodAt(f, [[0, "unsure"], [tContext, "gotit"]])} />
      <NextCard f={f} tIn={tNext - 4} tTick={tContext} title="LESSON 3 · THE CONTEXT WINDOW" sub="Claude's desk" top={420} />
    </>
  );
};
