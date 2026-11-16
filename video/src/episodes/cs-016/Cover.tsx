import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { ImagePane, Space, Window } from "../../productui";
import { DEMO } from "./scenes/common";

// Static cover: the maker's card cropped to its two counters, under "335 → 10" (cover text, ≤ 3 words).
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Space />
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>CLAUDE SKILLS · PONYTAIL</div>
    <div style={{ position: "absolute", top: 320, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 210, letterSpacing: -8, color: C.text }}>
      335 <span style={{ color: C.accent }}>→</span> 10
    </div>
    <Window kind="browser" title="github.com/DietrichGebert/ponytail" x={120} y={660} w={840} h={600} tilt={-6}>
      <ImagePane {...DEMO} pw={840} ph={548} cx={1360} cy={560} scale={1.05} />
    </Window>
    <div style={{ position: "absolute", top: 1290, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontSize: 22, letterSpacing: 2, color: C.muted }}>DEMO · DIETRICH GEBERT</div>
    <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={110} />
    </div>
  </AbsoluteFill>
);
