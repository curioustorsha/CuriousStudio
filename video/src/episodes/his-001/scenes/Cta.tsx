import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { HookHeader, HookWorld, useHookCues } from "./Hook";

/** The sign-off end card over the dimmed hook district; the last frames fade into the hook's first frame so the video loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tLike = wf("cta", "like", 1);
  const tShare = wf("cta", "share");
  const tFollow = wf("cta", "follow");
  const tCur = wf("cta", "curiously");
  const c = useHookCues();
  const loop = ease(f, D - 10, D - 1);
  const dimIn = ease(f, 0, 12);

  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="pop" at={tLike - 2} volume={0.35} />
      <Sfx name="pop" at={tShare - 2} volume={0.35} />
      <Sfx name="pop" at={tFollow - 2} volume={0.35} />
      <Sfx name="ding" at={tCur} volume={0.35} />

      {/* While the card is up the district is dimmed (clock at 10:00, crowd at the gate); on the loop it returns to the hook's first frame (9:59). */}
      <HookWorld f={loop > 0 ? 0 : 1000 + f} c={c} dim={1 - 0.86 * dimIn * (1 - loop)} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - loop }}>
        <EndCard f={f} tIn={0} tLike={tLike} tShare={tShare} tFollow={tFollow} tCur={tCur} starIn={6} />
      </div>
      {loop > 0 && <HookHeader opacity={loop} />}
    </>
  );
};
