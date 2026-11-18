import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, useWord } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { LessonKicker } from "../../logos";
import { FixedView } from "./scenes/Fixed";
import { KICK } from "./scenes/common";

// Static cover: the fixed scene at its peak. The amber desk with locked corners, the two-colour pile on the left,
// the ruler up the right edge with 1M TOKENS at the top, Aster behind. Cover text: "What Claude sees".
export const Cover: React.FC = () => {
  const wf = useWord();
  const f = wf("fixed", "does", 1, "end") + 6;
  return (
    <AbsoluteFill>
      <Backdrop />
      <FixedView f={f} header={false} m={{ mood: "idle", at: 0 }} />
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <LessonKicker text={KICK} mark={false} />
        <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 110, lineHeight: 0.95, letterSpacing: -4, color: C.text, textAlign: "center", whiteSpace: "nowrap" }}>
          What Claude <span style={{ color: C.accent }}>sees</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={120} />
      </div>
    </AbsoluteFill>
  );
};
