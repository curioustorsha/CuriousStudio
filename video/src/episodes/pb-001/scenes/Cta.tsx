import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { ez, lerp } from "../../../workshop";
import { HookView, useHookCues } from "./Hook";
import { LOGO_STAR, LOGO_STAR_SIZE, Star } from "./common";
import { PROMISE_STAR, PROMISE_STAR_SIZE } from "./Promise";

/** The sign-off end card: the asterisk grows into the logo's C. The last frames fade into the hook's first frame (the star on the Order button) so it loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const hook = useHookCues();
  const tLike = wf("cta", "like", 1);
  const tShare = wf("cta", "share");
  const tFollow = wf("cta", "follow");
  const tCur = wf("cta", "curiously");
  const LAND = 12;
  const fly = ez(f, 0, LAND);
  const loop = ez(f, D - 10, D - 1);
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="pop" at={tLike - 2} volume={0.35} />
      <Sfx name="pop" at={tShare - 2} volume={0.35} />
      <Sfx name="pop" at={tFollow - 2} volume={0.35} />
      <Sfx name="ding" at={tCur} volume={0.35} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - loop }}>
        <EndCard f={f} tIn={0} tLike={tLike} tShare={tShare} tFollow={tFollow} tCur={tCur} starIn={LAND} />
        {f < LAND && <Star f={f} at={() => [lerp(PROMISE_STAR[0], LOGO_STAR[0], fly), lerp(PROMISE_STAR[1], LOGO_STAR[1], fly)]} size={lerp(PROMISE_STAR_SIZE, LOGO_STAR_SIZE, fly)} rotate={f * 6} glow={0.6 * (1 - fly)} />}
      </div>
      {loop > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: loop }}>
          <HookView f={0} c={hook} />
        </div>
      )}
    </>
  );
};
