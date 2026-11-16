import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { pop, RepoCard, Space } from "../../../productui";
import { Header, SourceLine } from "./common";

/** "This is Ponytail, a free skill with over 190 thousand GitHub stars": the repo card, MIT chip on "free", stars ticking to 190,983 on "stars". */
export const Repo: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tName = wf("repo", "ponytail");
  const tFree = wf("repo", "free");
  const tHundred = wf("repo", "hundred");
  const tStars = wf("repo", "stars");
  return (
    <>
      <Sfx name="whoosh" at={tName - 6} volume={0.3} />
      <Sfx name="pop" at={tFree} volume={0.3} />
      <Sfx name="ticker" at={tHundred} volume={0.18} dur={tStars - tHundred} />
      <Sfx name="ding" at={tStars} volume={0.3} />
      <Space />
      <Header title="Meet Ponytail" />
      <RepoCard repo="ponytail" maker="DietrichGebert" stars={190983} full at={tName - 6} countFrom={tHundred} countTo={tStars} licence="MIT" licenceP={pop(f, tFree, fps)} x={110} y={600 + Math.sin(f / 40) * 4} />
      <SourceLine text="SOURCE · GitHub API, checked 14 Nov 2026" opacity={pop(f, tStars, fps)} />
    </>
  );
};
