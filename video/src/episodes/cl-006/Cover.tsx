import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, useWord } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { LessonKicker } from "../../logos";
import { TwiceView } from "./scenes/Twice";
import { KICK } from "./scenes/common";

// Static cover: the twice scene at its peak. "strawberry" spelled out with its three r's underlined and counted,
// the struck grey "two" card on the bench, Aster sagging. Cover text: "It said two".
export const Cover: React.FC = () => {
  const wf = useWord();
  const f = wf("twice", "three") + 26;
  return (
    <AbsoluteFill>
      <Backdrop />
      <TwiceView f={f} header={false} />
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <LessonKicker text={KICK} mark={false} />
        <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 116, lineHeight: 0.95, letterSpacing: -4, color: C.text, textAlign: "center", whiteSpace: "nowrap" }}>
          It said <span style={{ color: C.accent }}>two</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={120} />
      </div>
    </AbsoluteFill>
  );
};
