import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { NextCard } from "../../../engine/cards";
import { CrackView } from "./Tease";
import { moodAt } from "../../../workshop";

/** The cracked card holds, dimmed, and the "Next:" card for Lesson 2 slides up. */
export const Next: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tNext = wf("next", "next");
  const tTokens = wf("next", "tokens");
  return (
    <>
      <Sfx name="swoosh" at={tNext - 2} volume={0.32} />
      <Sfx name="ding" at={tTokens} volume={0.35} />
      <CrackView f={f} push={1} crack={1} dim={0.35} m={moodAt(f, [[0, "unsure"], [tTokens, "gotit"]])} />
      <NextCard f={f} tIn={tNext - 4} tTick={tTokens} title="LESSON 2 · TOKENS" sub="How Claude reads" top={420} />
    </>
  );
};
