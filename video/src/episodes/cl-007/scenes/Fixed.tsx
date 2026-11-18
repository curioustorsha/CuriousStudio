import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, Chip, Desk, DESK, DeskRuler, ez, Host, moodAt, type Mood, Pile, pileLevel, Stage, Wall, WIDE } from "../../../workshop";
import { landed, LessonHeader, N_KEEPS, slabLand } from "./common";
import { slabHands } from "./Pile";

type WF = (id: string, w: string, n?: number, e?: "start" | "end") => number;
/** Landing frames of the 6 quick slabs: 2 on "doesn't grow as you chat", 4 on "Only the pile on it does". */
export const fixedAts = (wf: WF) => {
  const tGrow = wf("fixed", "grow");
  const tChat = wf("fixed", "chat", 0, "end");
  const tOnly = wf("fixed", "only");
  const tDoes = wf("fixed", "does", 1, "end");
  const s = Math.max(5, (tDoes - tOnly) / 4);
  return [tGrow + 2, Math.max(tGrow + 9, tChat - 2), ...[0, 1, 2, 3].map((k) => Math.round(tOnly + 2 + k * s))];
};

/** Big, but fixed: the corners lock, a ghost outline tries to stretch and snaps back, only the pile (and the marker) grows. Any frame `f` (the cover uses its peak). */
export const FixedView: React.FC<{ f: number; header?: boolean; m?: { mood: Mood; at: number } }> = ({ f, header = true, m }) => {
  const wf = useWord();
  const tBig = wf("fixed", "big");
  const tFixed = wf("fixed", "fixed");
  const tGrow = wf("fixed", "grow");
  const ats = fixedAts(wf);
  const lands = [...landed(N_KEEPS), ...ats.map((a) => slabLand(f, a))];
  const n = lands.reduce((a, p) => a + Math.min(1, p), 0);
  const glow = ez(f, tBig - 2, tBig + 6) * (1 - ez(f, tBig + 14, tBig + 26));
  const lock = ez(f, tFixed, tFixed + 8);
  const ghost = ez(f, tGrow - 6, tGrow + 6) * (1 - ez(f, tGrow + 8, tGrow + 14));
  const chip = ez(f, tFixed + 2, tFixed + 10);
  const hands = slabHands(f, ats, N_KEEPS);
  const mood =
    m ??
    moodAt(f, [
      [0, "idle"],
      [tGrow + 8, "no"],
      [ats[5] + 6, "gotit"],
    ]);
  return (
    <>
      <Stage cam={WIDE}>
        <Wall />
        <Host f={f} {...hands} {...mood} />
        <Bench />
        <Desk glow={glow} lock={lock} ghost={ghost} />
        <Pile lands={lands} thin={1} />
        <DeskRuler draw={1} level={pileLevel(n, 1)} levelP={1} />
        <Chip text="FIXED SIZE" x={520} y={DESK.top} p={chip} color="#FFB547" size={22} />
      </Stage>
      {header && <LessonHeader title="Big, but fixed" />}
    </>
  );
};

export const Fixed: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tFixed = wf("fixed", "fixed");
  const tGrow = wf("fixed", "grow");
  const ats = fixedAts(wf);
  return (
    <>
      {[0, 1, 2, 3].map((k) => (
        <Sfx key={k} name="click" at={tFixed + k * 2} volume={0.22} />
      ))}
      <Sfx name="swoosh" at={tGrow + 6} volume={0.2} />
      {ats.map((a, k) => (
        <Sfx key={`s${k}`} name="pop" at={a - 2} volume={0.14} />
      ))}
      <FixedView f={f} />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
