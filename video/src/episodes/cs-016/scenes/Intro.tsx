import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { SeriesCard } from "../../../engine/cards";
import { HookView, useHookCues } from "./Hook";

/** "Welcome to Claude Skills, by Curiously": the series card over the dimmed hook editor. */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
  const cues = useHookCues();
  const out = ease(f, D - 10, D - 2);
  const dim = 1 - 0.75 * ease(f, 0, 10) * (1 - out);
  const H = t.sceneFrames("hook");
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.3} />
      <Sfx name="ding" at={wf("intro", "curiously") + 2} volume={0.3} />
      <HookView f={H + f} cues={cues} dim={dim} />
      <SeriesCard f={f} name="CLAUDE SKILLS" tName={wf("intro", "claude")} tCur={wf("intro", "curiously")} out={out} />
    </>
  );
};
