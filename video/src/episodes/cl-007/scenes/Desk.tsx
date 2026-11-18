import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, Source, useTiming, useWord } from "../../../engine/kit";
import { Bench, BENCH, Chip, Desk as DeskOutline, DESK_TAG, ez, Host, lerp, moodAt, sp, Stage, TokenTile, Wall, WS } from "../../../workshop";
import { cloudPos, LessonHeader, Q_TILES, Q_X, T_SIZE } from "./common";

/** The tiles in a neat row inside the desk (desk end, notpaper, start of onit). */
export const DeskTiles: React.FC<{ dx?: number; opacity?: number }> = ({ dx = 0, opacity = 1 }) => (
  <>
    {Q_TILES.map((w, i) => (
      <TokenTile key={i} text={w} size={T_SIZE} x={Q_X[i] + dx * (1 + i * 0.1)} opacity={opacity} />
    ))}
  </>
);

/** "That place is called the context window": the outline draws around the bench and the floating tiles settle inside. */
export const Desk: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const t = useTiming();
  const g0 = t.sceneFrames("callback");
  const tContext = wf("desk", "context");
  const tDesk = wf("desk", "desk");

  const chip = sp(f, tContext - 2, { damping: 13, stiffness: 210 });
  const fly = ez(f, tDesk + 4, tDesk + 20);
  const draw = ez(f, tDesk - 6, tDesk + 14);
  const settle = Q_TILES.map((_, i) => sp(f, tDesk + 6 + i * 2, { damping: 15, stiffness: 190 }));
  const m = moodAt(f, [
    [0, "unsure"],
    [tContext, "idle"],
    [tDesk + 8, "gotit"],
  ]);
  return (
    <>
      <Sfx name="pop" at={tContext - 2} volume={0.28} />
      <Sfx name="click" at={tDesk + 10} volume={0.35} />
      {Q_TILES.map((_, i) => (
        <Sfx key={i} name="click" at={tDesk + 10 + i * 2} volume={0.1} />
      ))}
      <Stage cam={BENCH}>
        <Wall />
        <Host f={f} {...m} />
        <Bench />
        <DeskOutline draw={draw} tag={fly >= 0.98 ? 1 : 0} />
        {Q_TILES.map((w, i) => {
          const [cx, cy] = cloudPos(i, f + g0);
          const s = settle[i];
          return <TokenTile key={i} text={w} size={T_SIZE} x={lerp(cx, Q_X[i], s)} y={lerp(cy, WS.benchTop + 2, s)} />;
        })}
        {fly < 0.98 && (
          <Chip text="CONTEXT WINDOW" x={lerp(560, DESK_TAG.x, fly)} y={lerp(600, DESK_TAG.y, fly)} p={chip} color="#FFB547" size={lerp(30, 20, fly)} />
        )}
      </Stage>
      <LessonHeader title="The context window" />
      <Source text="Claude Docs, Context windows, 2026" />
    </>
  );
};
