import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { SeriesCard } from "../../../engine/cards";
import { pop, RepoCard } from "../../../productui";
import { HookView, useHookCues } from "./Hook";
import { STARS } from "./common";

/** "Welcome to Claude Skills, by Curiously": the series card and the repo card over the dimmed hook. */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
  const cues = useHookCues();
  const out = ease(f, D - 8, D - 1);
  const dim = 1 - 0.82 * ease(f, 0, 8) * (1 - out);
  const tClaude = wf("intro", "claude");
  const tCur = wf("intro", "curiously");
  const lic = pop(f, tCur - 6, fps, 14);
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="ticker" at={8} volume={0.14} dur={tCur - 8} />
      <Sfx name="ding" at={tCur + 2} volume={0.3} />
      <HookView f={t.sceneFrames("hook") + f} cues={cues} dim={dim} />
      <SeriesCard f={f} name="CLAUDE SKILLS" tName={tClaude} tCur={tCur} out={out} top={460} />
      <div style={{ opacity: 1 - out }}>
        <RepoCard repo="archify" maker="tt-a1i" stars={STARS} at={4} x={110} y={850} full countFrom={8} countTo={tCur} licence="Apache-2.0" licenceP={lic} />
      </div>
    </>
  );
};
