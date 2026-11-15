import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, useWord } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { LessonKicker } from "../../logos";
import { BenchView } from "./scenes/Bench";
import { KICK } from "./scenes/common";

// Static cover: the bench at its peak. Claude's hands under the fan of 3 candidate cards with their
// likelihood bars, "scatters" lit amber on top, and "Blue light" already in the row.
export const Cover: React.FC = () => {
  const wf = useWord();
  const f = wf("bench", "picks") + 28;
  return (
    <AbsoluteFill>
      <Backdrop />
      <BenchView f={f} header={false} />
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <LessonKicker text={KICK} />
        <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 116, lineHeight: 0.95, letterSpacing: -4, color: C.text, textAlign: "center", whiteSpace: "nowrap" }}>
          It's <span style={{ color: C.accent }}>guessing</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={120} />
      </div>
    </AbsoluteFill>
  );
};
