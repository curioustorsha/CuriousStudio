import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { Space, Window } from "../../productui";

// Static cover: the result in one look. Cover text "116 → 10" (≤ 3 words).
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Space />
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>CLAUDE SKILLS · PONYTAIL</div>
    <div style={{ position: "absolute", top: 320, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 210, letterSpacing: -8, color: C.text }}>
      116 <span style={{ color: C.accent }}>→</span> 10
    </div>
    <div style={{ position: "absolute", top: 580, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 800, fontSize: 64, color: C.muted }}>lines of code</div>
    <Window title="search.js" x={140} y={780} w={800} h={420} tilt={-6}>
      <div style={{ padding: 30, fontFamily: F.mono, fontSize: 24, lineHeight: 1.6, color: C.text, whiteSpace: "pre" }}>
        {"clearTimeout(debounceTimer);\ndebounceTimer = setTimeout(() => {\n  fetch(`/api/search?q=…`)\n}, 300);"}
      </div>
    </Window>
    <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={110} />
    </div>
  </AbsoluteFill>
);
