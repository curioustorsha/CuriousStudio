import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useWord } from "../../../engine/kit";
import { Bench, Chip, COL, Desk, DESK, ez, Host, lerp, moodAt, PaperMountain, sp, Stage, Wall, WallShelf, WIDE } from "../../../workshop";
import { DeskTiles } from "./Desk";
import { LessonHeader } from "./common";

const SHELF = { x: 160, y: 625, w: 240 };
const MCX = SHELF.x + SHELF.w / 2;

/** The paper mountain stays on a wall shelf, off the desk: a page bounces off the desk's edge; everything outside dims. */
export const Notpaper: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tMountain = wf("notpaper", "mountain");
  const tStays = wf("notpaper", "stays");
  const tOnly = wf("notpaper", "only");
  const tRight = wf("notpaper", "right");

  const shelf = ez(f, 0, 10);
  const grow = ez(f, tMountain - 4, tMountain + 22);
  const chip = sp(f, tMountain + 6, { damping: 13, stiffness: 210 });
  // one page drifts down, hits the desk's top edge, bounces back up and fades
  const HIT = tStays + 16;
  const fall = ez(f, tStays, HIT);
  const back = ez(f, HIT, HIT + 22);
  const px = f < HIT ? lerp(MCX + 40, 470, fall) : lerp(470, 430, back);
  const py = f < HIT ? lerp(560, DESK.top - 18, fall * fall) : DESK.top - 18 - Math.sin(back * Math.PI * 0.85) * 70 - back * 20;
  const pageO = f < tStays ? 0 : 1 - ez(f, HIT + 12, HIT + 22);
  const dim = ez(f, tOnly - 2, tOnly + 14);
  const now = sp(f, tRight, { damping: 13, stiffness: 210 });
  const m = moodAt(f, [
    [0, "gotit"],
    [8, "idle"],
    [HIT, "no"],
  ]);
  return (
    <>
      <Sfx name="swoosh" at={tMountain - 2} volume={0.22} />
      <Sfx name="swoosh" at={tMountain + 8} volume={0.14} />
      <Sfx name="thud" at={HIT} volume={0.22} />
      <Sfx name="whoosh" at={tOnly - 2} volume={0.12} />
      <Sfx name="pop" at={tRight} volume={0.25} />
      <Stage cam={WIDE}>
        <Wall />
        <WallShelf x={SHELF.x} y={SHELF.y} w={SHELF.w} opacity={shelf} />
        <PaperMountain grow={grow} cx={MCX} base={SHELF.y + 2} scale={0.45} />
        <Host f={f} {...m} />
        <Bench />
        <DeskTiles />
        {pageO > 0 && (
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: pageO }}>
            <rect x={px - 22} y={py - 15} width={44} height={30} rx={3} fill={COL.paper} transform={`rotate(${f * 4 % 40 - 20} ${px} ${py})`} />
          </svg>
        )}
        <Desk outsideDim={dim} glow={dim} />
        <Chip text="TRAINING TEXT" x={MCX + 250} y={520} p={chip} opacity={1 - 0.6 * dim} />
        <Chip text="RIGHT NOW" x={510} y={DESK.top} p={now} color="#FFB547" size={22} />
      </Stage>
      <LessonHeader title="Only what's in front" />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
