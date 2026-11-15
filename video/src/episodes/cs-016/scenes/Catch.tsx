import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CatchCard, pop, Space } from "../../../productui";
import { Header } from "./common";

/** The catch: coding only, and the numbers are the maker's own. */
export const Catch: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const tCoding = wf("catch", "coding");
  const tNumbers = wf("catch", "numbers");
  return (
    <>
      <Sfx name="thud" at={2} volume={0.3} />
      <Sfx name="pop" at={tNumbers} volume={0.3} />
      <Space />
      <Header title="The catch" accent={C.accent} />
      <CatchCard x={110} y={520} p={pop(f, tCoding - 6, fps)} text="For coding only." />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 820,
          width: 860,
          padding: "30px 40px",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.04)",
          fontFamily: F.sans,
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.3,
          color: C.text,
          opacity: pop(f, tNumbers - 4, fps),
          transform: `translateY(${(1 - pop(f, tNumbers - 4, fps)) * 40}px)`,
        }}
      >
        116 → 10 is the maker&apos;s own benchmark, not an independent test.
      </div>
    </>
  );
};
