import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { RemotionLogo } from "../../logos";
import { Space, Window } from "../../productui";
import { PROOF } from "./scenes/common";

// Static cover: "Made by Claude" (3 words) over a frame of our own HIS-003 render in a big window.
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Space />
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>
      <RemotionLogo size={44} />
      CLAUDE SKILLS · REMOTION
    </div>
    <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 128, letterSpacing: -5, lineHeight: 1, whiteSpace: "nowrap", color: C.text }}>
      Made by <span style={{ color: C.accent }}>Claude</span>
    </div>
    <Window kind="browser" title="curiously · HIS-003" x={90} y={560} w={900} h={52 + 716} tilt={-6}>
      <OffthreadVideo src={staticFile(`${PROOF}/clips/numbers.mp4`)} muted trimBefore={150} style={{ width: 900, height: 716, objectFit: "cover" }} />
    </Window>
    <div style={{ position: "absolute", bottom: 280, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={110} />
    </div>
  </AbsoluteFill>
);
