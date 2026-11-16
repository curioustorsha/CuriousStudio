import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { InstallBar, pop, Space } from "../../../productui";
import { RemotionLogo } from "../../../logos";
import { Header, REPO_URL, SourceLine } from "./common";

// The README's first install option, exactly as published (F4).
const COMMAND = "npx skills add remotion-dev/skills";

/** "Building videos with Claude? It's one command. Link in the description." */
export const Install: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tVideos = wf("install", "videos");
  const tOne = wf("install", "one");
  const tLink = wf("install", "link");
  const cps = 2.5;
  const badge = pop(f, tVideos, fps, 14);
  return (
    <>
      <Sfx name="pop" at={tVideos} volume={0.3} />
      <Sfx name="ticker" at={tOne} volume={0.16} dur={Math.ceil(COMMAND.length / cps) + 4} />
      <Sfx name="ding" at={tLink} volume={0.3} />
      <Space />
      <Header title="Install it" />
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 480,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: 2,
          color: C.text,
          opacity: badge,
          transform: `translateY(${(1 - badge) * 20}px)`,
        }}
      >
        <RemotionLogo size={40} />
        OFFICIAL · BY REMOTION
      </div>
      <InstallBar command={COMMAND} link={REPO_URL} at={0} x={60} y={550} w={900} size={30} lineAts={[tOne]} cps={cps} linkAt={tLink} />
      <SourceLine text="SOURCE · remotion-dev/skills README, install" />
    </>
  );
};
