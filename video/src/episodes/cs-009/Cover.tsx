import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { Cursor, Label, Ring, Space, Window } from "../../productui";
import { MCO, McoPane } from "./scenes/common";

// Static cover: "Click your codebase" over the maker's MCO case page with Command Router's verified source open and ringed.
export const Cover: React.FC = () => {
  const v = MCO.verified;
  return (
    <AbsoluteFill>
      <Space />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>CLAUDE SKILLS · ARCHIFY</div>
      <div style={{ position: "absolute", top: 290, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 118, letterSpacing: -4, lineHeight: 1.02, color: C.text }}>
        <span style={{ color: C.accent }}>Click</span> your
        <br />
        codebase
      </div>
      <Window kind="browser" title="mco-runtime.architecture.html" x={90} y={600} w={900} h={700} tilt={-6}>
        <McoPane pw={900} ph={648} cx={MCO.routerMap.x} cy={MCO.routerMap.y} scale={1} focus={1} srcCam={{ cx: 340, cy: 390, scale: 1.45, mix: 1 }} srcChildren={<Ring x={v.x} y={v.y} w={v.w} h={v.h} p={1} stroke={2.5} />} />
      </Window>
      <Cursor x={760} y={960} />
      <Label text="DEMO · TT-A1I / ARCHIFY" color={C.muted} style={{ top: 1318, right: 100, fontSize: 20, letterSpacing: 2 }} />
      <div style={{ position: "absolute", bottom: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={110} />
      </div>
    </AbsoluteFill>
  );
};
