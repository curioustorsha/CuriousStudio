import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { Bench, Desk, DeskRuler, ez, Host, moodAt, type Mood, Pile, pileLevel, Stage, Wall, WIDE } from "../../../workshop";
import { landed, LessonHeader, N_FIXED, N_FULL, slabLand } from "./common";
import { slabHands } from "./Pile";

type WF = (id: string, w: string, n?: number, e?: "start" | "end") => number;
/** Landing frames: Q at "every", Aster's A on "worked", then the fast fill from "happens" up to the top on "full". */
export const outroAts = (wf: WF) => {
  const tEvery = wf("outro", "every");
  const tWorked = wf("outro", "worked");
  const tHappens = wf("outro", "happens");
  const tFull = wf("outro", "full");
  const rest = N_FULL - N_FIXED - 2;
  const span = Math.max(rest * 0.8, tFull + 4 - tHappens);
  return [tEvery + 4, tWorked + 4, ...Array.from({ length: rest }).map((_, k) => Math.round(tHappens + (k / (rest - 1)) ** 0.85 * span))];
};

/** The outro at any frame `f` (the next-lesson card holds its last frame, dimmed). */
export const OutroView: React.FC<{ f: number; header?: boolean; dim?: number; m?: { mood: Mood; at: number } }> = ({ f, header = true, dim = 1, m }) => {
  const wf = useWord();
  const tEvery = wf("outro", "every");
  const tFull = wf("outro", "full");
  const ats = outroAts(wf);
  const lastAt = ats[ats.length - 1];
  const lands = [...landed(N_FIXED), ...ats.map((a) => slabLand(f, a))];
  const n = lands.reduce((a, p) => a + Math.min(1, p), 0);
  const teeter = f >= lastAt + 4 ? Math.sin((f - lastAt - 4) * 0.3) * 2.5 * Math.max(0.4, 1 - (f - lastAt - 4) / 60) : 0;
  const hands = f < ats[2] - 12 ? slabHands(f, ats.slice(0, 2), N_FIXED) : undefined;
  const mood =
    m ??
    moodAt(f, [
      [0, "idle"],
      [tEvery, "think"],
      [ats[1] - 12, "idle"],
      [ats[1] + 6, "gotit"],
      [tFull, "unsure"],
    ]);
  return (
    <>
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Host f={f} {...(hands ?? {})} {...mood} />
        <Bench />
        <Pile lands={lands} thin={1} teeter={teeter} />
        <Desk glow={ez(f, lastAt - 4, lastAt + 4) * 0.6} />
        <DeskRuler draw={1} level={pileLevel(n, 1)} levelP={1} />
      </Stage>
      {header && <LessonHeader title="Worked out at the desk" size={72} />}
    </>
  );
};

export const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const ats = outroAts(wf);
  const lastAt = ats[ats.length - 1];
  return (
    <>
      <Sfx name="click" at={ats[0] - 2} volume={0.22} />
      <Sfx name="pop" at={ats[1] - 2} volume={0.3} />
      {ats.slice(2).filter((_, k) => k % 4 === 0).map((a, k) => (
        <Sfx key={k} name="pop" at={a - 2} volume={0.08 + k * 0.012} />
      ))}
      <Sfx name="thud" at={lastAt + 2} volume={0.28} />
      <OutroView f={f} />
    </>
  );
};
