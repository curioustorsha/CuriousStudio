import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { Space } from "../../../productui";
import { HookView, useHookCues } from "./Hook";

/** The sign-off end card; the last frames fade into the hook's first frame (empty prompt + header) so the video loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const cues = useHookCues();
  const tLike = wf("cta", "like", 1);
  const tShare = wf("cta", "share");
  const tFollow = wf("cta", "follow");
  const tCur = wf("cta", "curiously");
  const loop = ease(f, D - 10, D - 1);
  return (
    <>
      <Sfx name="swoosh" at={0} volume={0.25} />
      <Sfx name="pop" at={tLike - 2} volume={0.35} />
      <Sfx name="pop" at={tShare - 2} volume={0.35} />
      <Sfx name="pop" at={tFollow - 2} volume={0.35} />
      <Sfx name="ding" at={tCur} volume={0.35} />
      <Space />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - loop }}>
        <EndCard f={f} tIn={0} tLike={tLike} tShare={tShare} tFollow={tFollow} tCur={tCur} starIn={6} />
      </div>
      {loop > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: loop }}>
          <HookView f={0} cues={cues} />
        </div>
      )}
    </>
  );
};
