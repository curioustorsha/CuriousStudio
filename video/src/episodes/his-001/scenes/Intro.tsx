import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { SeriesCard } from "../../../engine/cards";
import { HookHeader, HookWorld, useHookCues } from "./Hook";

/** "Welcome to How It Scales, by Curiously": the series card over the hook's district, dimmed to 30%. */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
  const tName = wf("intro", "how");
  const tCur = wf("intro", "curiously");
  const H = t.sceneFrames("hook");
  const c = useHookCues();
  const out = ease(f, D - 10, D - 2);
  const dim = 1 - 0.7 * ease(f, 0, 10) * (1 - out);

  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.35} />
      <Sfx name="ding" at={tCur + 2} volume={0.3} />

      <HookWorld f={H + f} c={c} dim={dim} />
      <HookHeader opacity={1 - ease(f, 0, 8) * (1 - out)} />
      <SeriesCard f={f} name="HOW IT SCALES" tName={tName} tCur={tCur} out={out} />
    </>
  );
};
