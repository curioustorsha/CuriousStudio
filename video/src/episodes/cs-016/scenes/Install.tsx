import React from "react";
import { Sfx, useWord } from "../../../engine/kit";
import { InstallBar, Space } from "../../../productui";
import { Header } from "./common";

/** The two real install commands from the README, typed into Claude Code. */
export const Install: React.FC = () => {
  const wf = useWord();
  return (
    <>
      <Sfx name="ticker" at={6} volume={0.18} dur={50} />
      <Sfx name="ding" at={wf("install", "link")} volume={0.3} />
      <Space />
      <Header title="Install it" />
      <InstallBar command={"/plugin marketplace add DietrichGebert/ponytail\n/plugin install ponytail@ponytail"} link="github.com/DietrichGebert/ponytail" at={0} x={110} y={600} />
    </>
  );
};
