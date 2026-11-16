import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { SeriesCard } from "../../../engine/cards";
import { RepoCard } from "../../../productui";
import { RemotionLogo } from "../../../logos";
import { HookView, useHookCues } from "./Hook";
import { STARS } from "./common";

/** "Welcome to Claude Skills, by Curiously": repo card (stars tick to 7,269) + series card over the dimmed hook. */
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
  const cues = useHookCues();
  const out = ease(f, D - 10, D - 2);
  const dim = 1 - 0.8 * ease(f, 0, 10) * (1 - out);
  const H = t.sceneFrames("hook");
  const tCur = wf("intro", "curiously");
  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="ticker" at={6} volume={0.14} dur={tCur - 4} />
      <Sfx name="ding" at={tCur + 2} volume={0.3} />
      <HookView f={H + f} cues={cues} dim={dim} />
      <div style={{ opacity: 1 - out }}>
        <RepoCard repo="skills" maker="remotion-dev" byline="Official, by the Remotion team" stars={STARS} full at={0} countFrom={6} countTo={tCur + 2} x={110} y={420}>
          <div style={{ position: "absolute", right: 44, top: 40 }}>
            <RemotionLogo size={88} />
          </div>
        </RepoCard>
      </div>
      <SeriesCard f={f} name="CLAUDE SKILLS" tName={wf("intro", "claude")} tCur={tCur} out={out} top={800} />
    </>
  );
};
