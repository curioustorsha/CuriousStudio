import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { InstallBar, pop, Space } from "../../../productui";
import { Header, REPO_URL, SourceLine, Tag } from "./common";

// The README's two commands exactly as published (old forrestchang/ path, which still resolves to multica-ai/).
const COMMANDS = "/plugin marketplace add forrestchang/andrej-karpathy-skills\n/plugin install andrej-karpathy-skills@karpathy-skills";

/** "If you code with Claude, it's two commands. Link in the description." */
export const Install: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tCode = wf("install", "code");
  const tTwo = wf("install", "two");
  const tLink = wf("install", "link");
  const cps = 4;
  const second = tTwo + Math.ceil(COMMANDS.split("\n")[0].length / cps) + 2;
  return (
    <>
      <Sfx name="pop" at={tCode} volume={0.3} />
      <Sfx name="ticker" at={tTwo} volume={0.16} dur={second - tTwo + 16} />
      <Sfx name="ding" at={tLink} volume={0.3} />
      <Space />
      <Header title="Install it" />
      <Tag text="FOR CLAUDE CODE" p={pop(f, tCode, fps)} f={f} blinkFrom={tCode} top={620} left={64} />
      <InstallBar command={COMMANDS} link={REPO_URL} at={0} x={60} y={680} w={960} size={21} lineAts={[tTwo, second]} cps={cps} linkAt={tLink} />
      <SourceLine text="SOURCE · README, Install (Option A)" />
    </>
  );
};
