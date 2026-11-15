import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, Chip, Host, moodAt, ez, PaperStack, sp, Stage, Wall, WIDE, WS } from "../../../workshop";
import { Accent, LessonHeader } from "./common";

/** "Built on a large language model": a stack of pages drops in and packs into Claude. Anthropic joins the kicker. */
export const Maker: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tLarge = wf("maker", "large");
  const tLang = wf("maker", "language");
  const tModel = wf("maker", "model");
  const tAnth = wf("maker", "anthropic");

  const pClaude = sp(f, 3, { damping: 12, stiffness: 220 });
  const drop = sp(f, tLarge - 8, { damping: 13, stiffness: 200 });
  const pack = ez(f, tModel + 2, tModel + 16);
  const squash = f > tModel + 10 ? Math.sin(Math.min(1, (f - tModel - 10) / 14) * Math.PI) : 0;
  const pLlm = sp(f, tLang, { damping: 13, stiffness: 200 });
  const m = moodAt(f, [
    [0, "idle"],
    [tLarge, "think"],
    [tModel + 10, "gotit"],
  ]);
  const anth = sp(f, tAnth - 2, { damping: 16, stiffness: 150 });

  return (
    <>
      <Sfx name="pop" at={3} volume={0.3} />
      <Sfx name="thud" at={tLarge} volume={0.5} />
      <Sfx name="pop" at={tLang} volume={0.32} />
      <Sfx name="swoosh" at={tModel + 4} volume={0.25} />
      <Sfx name="ding" at={tAnth} volume={0.22} />
      <Stage cam={WIDE}>
        <Wall />
        <Host f={f} squash={squash} {...m} />
        <Bench />
        <PaperStack x={400} drop={drop} pack={pack} />
        <Chip text="CLAUDE" x={WS.claudeX} y={490} p={pClaude} />
        <Chip text="LARGE LANGUAGE MODEL" x={540} y={1086} p={pLlm} color="#E8DCC8" size={30} />
      </Stage>
      <LessonHeader anthropic={anth} title={<>A <Accent>language model</Accent></>} />
      <Source text="Claude Docs glossary, 2026" />
    </>
  );
};
