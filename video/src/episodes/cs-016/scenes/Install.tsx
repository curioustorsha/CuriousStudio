import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { InstallBar, Label, pop, Space } from "../../../productui";
import { Header, SourceLine } from "./common";

/** "We use it ourselves. Install it with two commands, link in the description." The two real README prompts typing. */
export const Install: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tOurs = wf("install", "ourselves");
  const tInstall = wf("install", "install");
  const tTwo = wf("install", "two");
  const tLink = wf("install", "link");
  const tag = pop(f, tOurs, fps);
  const blink = f < tOurs + 14 ? (Math.floor((f - tOurs) / 4) % 2 ? 0.4 : 1) : 1;
  return (
    <>
      <Sfx name="pop" at={tOurs} volume={0.3} />
      <Sfx name="ticker" at={tInstall} volume={0.16} dur={tTwo - tInstall + 22} />
      <Sfx name="ding" at={tLink} volume={0.3} />
      <Space />
      <Header title="Install it" />
      <Label text="USED TO BUILD CURIOUSLY" style={{ top: 540, left: 110, opacity: tag * blink, transform: `scale(${0.8 + 0.2 * tag})`, transformOrigin: "0 50%", padding: "8px 18px", borderRadius: 10, border: "2px solid currentColor" }} />
      <InstallBar command={"/plugin marketplace add DietrichGebert/ponytail\n/plugin install ponytail@ponytail"} link="github.com/DietrichGebert/ponytail" at={0} x={110} y={620} lineAts={[tInstall, tTwo]} cps={2.4} linkAt={tLink} />
      <SourceLine text="SOURCE · Ponytail README, Install" />
    </>
  );
};
