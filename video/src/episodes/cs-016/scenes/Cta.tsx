import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, Sfx, useTiming, useWord } from "../../../engine/kit";
import { EndCard } from "../../../engine/cards";
import { Space } from "../../../productui";
import { HookView } from "./Hook";

/** The sign-off end card; the last frames fade into the hook's first frame (empty editor) so the video loops. */
export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const t = useTiming();
  const wf = useWord();
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
          <HookView f={0} tStart={t.wf("hook", "writes")} tEnd={t.wf("hook", "sixteen", 0, "end")} />
        </div>
      )}
    </>
  );
};
