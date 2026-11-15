import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, Host, moodAt, ez, mixCam, PageStream, PaperMountain, PhoneKeyboard, sp, Stage, Wall, WALL, WIDE } from "../../../workshop";
import { Accent, LessonHeader } from "./common";

/** Your phone keyboard's 3 suggestions, then the same idea at a huge scale: a mountain of paper feeding Claude. */
export const Keyboard: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tPhone = wf("keyboard", "phone's");
  const tGuess = wf("keyboard", "guessing");
  const tNext = wf("keyboard", "next");
  const tWord = wf("keyboard", "word");
  const tBut = wf("keyboard", "but");
  const tTrained = wf("keyboard", "trained");
  const tMountain = wf("keyboard", "mountain");
  const tText = wf("keyboard", "text");

  const rise = sp(f, tPhone - 8, { damping: 15, stiffness: 150 });
  const pick = ez(f, tNext, tWord + 2);
  const shrink = ez(f, tBut, tBut + 14);
  const cam = mixCam(WIDE, WALL, ez(f, tTrained - 2, tTrained + 20));
  const grow = ez(f, tTrained + 2, tText + 4);
  const stream = ez(f, tMountain, tMountain + 10);
  const m = moodAt(f, [
    [0, "idle"],
    [tGuess, "think"],
    [tText, "gotit"],
  ]);
  const squash = f > tMountain + 10 ? 0.35 * Math.abs(Math.sin((f - tMountain) * 0.25)) : 0;

  return (
    <>
      <Sfx name="swoosh" at={tPhone - 6} volume={0.3} />
      {[0, 1, 2].map((k) => (
        <Sfx key={k} name="pop" at={tGuess + k * 3} volume={0.26} />
      ))}
      <Sfx name="ding" at={tWord} volume={0.2} />
      <Sfx name="whoosh" at={tTrained - 2} volume={0.3} />
      <Sfx name="riser" at={tTrained + 2} volume={0.2} dur={70} />
      <Stage cam={cam}>
        <Wall />
        <PaperMountain grow={grow} />
        <Host f={f} squash={squash} {...m} />
        <Bench />
        <PageStream f={f} on={stream} />
      </Stage>
      <PhoneKeyboard f={f} rise={rise} chips={tGuess} pick={pick} shrink={shrink} />
      <LessonHeader title={<>Your keyboard, but <Accent>huge</Accent></>} />
      <Source text="Claude Docs glossary, 2026" />
    </>
  );
};
