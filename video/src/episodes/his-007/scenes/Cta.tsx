import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { HookHeader, HookWorld } from "./Hook";

/** The sign-off end card over the dimmed hook city; the last frames fade into the hook's first frame so the video loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
  const tLike = wf("cta", "like", 1);
  const tShare = wf("cta", "share");
  const tFollow = wf("cta", "follow");
  const tCur = wf("cta", "curiously");
  const hw = { tMaps: t.wf("hook", "google"), tJam: t.wf("hook", "jam"), tBefore: t.wf("hook", "before") };
  const loop = ease(f, D - 10, D - 1);
  const dimIn = ease(f, 0, 12);

  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="pop" at={tLike - 2} volume={0.35} />
      <Sfx name="pop" at={tShare - 2} volume={0.35} />
      <Sfx name="pop" at={tFollow - 2} volume={0.35} />
      <Sfx name="ding" at={tCur} volume={0.35} />

      {/* While the card is up the city is dimmed; on the loop it returns to the hook's first frame (jam not yet red). */}
      <HookWorld f={loop > 0 ? 0 : 1000 + f} {...hw} dim={1 - 0.86 * dimIn * (1 - loop)} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - loop }}>
        <EndCard f={f} tIn={0} tLike={tLike} tShare={tShare} tFollow={tFollow} tCur={tCur} starIn={6} />
      </div>
      {loop > 0 && <HookHeader opacity={loop} />}
    </>
  );
};
