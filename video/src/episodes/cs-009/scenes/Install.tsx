import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { InstallBar, pop, Space } from "../../../productui";
import { Header, REPO_URL, SourceLine } from "./common";

// The Claude Code install line from llms.txt (v3.2.0), exactly as published (F11), split over three lines.
const COMMAND = ["npx -y skills@latest add https://archify.si", "--skill archify --agent claude-code", "--global --copy --yes"];

/** "Install it with one command, link in the description." */
export const Install: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tInstall = wf("install", "install");
  const tLink = wf("install", "link");
  const cps = 2.4;
  const a = tInstall + 2;
  const b = a + Math.ceil(COMMAND[0].length / cps);
  const c = b + Math.ceil(COMMAND[1].length / cps);
  const badge = pop(f, 0, fps, 14);
  return (
    <>
      <Sfx name="click" at={a} volume={0.3} />
      <Sfx name="click" at={b} volume={0.3} />
      <Sfx name="click" at={c} volume={0.3} />
      <Sfx name="pop" at={tLink} volume={0.3} />
      <Space />
      <Header title="Install it" />
      <div style={{ position: "absolute", left: 60, top: 590, fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: C.muted, opacity: badge, transform: `translateY(${(1 - badge) * 20}px)` }}>
        CLAUDE CODE · ARCHIFY v3.2.0
      </div>
      <InstallBar command={COMMAND.join("\n")} link={REPO_URL} at={0} x={60} y={650} w={900} size={27} lineAts={[a, b, c]} cps={cps} linkAt={tLink} />
      <SourceLine text="SOURCE · archify llms.txt, v3.2.0" />
    </>
  );
};
