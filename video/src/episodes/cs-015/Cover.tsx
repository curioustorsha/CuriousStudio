import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { CodePane, Space, Window } from "../../productui";
import { lineCount, useProof } from "./scenes/common";

const Pill: React.FC<{ text: string; color: string; x: number; y: number }> = ({ text, color, x, y }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "12px 22px", borderRadius: 16, background: color, fontFamily: F.mono, fontWeight: 800, fontSize: 38, color: "#120c04", boxShadow: `0 0 40px ${color}66`, whiteSpace: "nowrap" }}>{text}</div>
);

// Static cover: the two cart.js windows from our test (WITHOUT grey, WITH THE FILE amber) under "Ask first" (≤ 3 words).
export const Cover: React.FC = () => {
  const { fixture, before, after } = useProof();
  if (!fixture || !before || !after) return null;
  return (
    <AbsoluteFill>
      <Space />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>CLAUDE SKILLS · KARPATHY RULES</div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 200, letterSpacing: -8, color: C.text }}>
        Ask <span style={{ color: C.accent }}>first</span>
      </div>
      <div style={{ position: "absolute", top: 640, left: 70, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.muted }}>WITHOUT</div>
      <div style={{ position: "absolute", top: 640, left: 565, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: C.accent }}>WITH THE FILE</div>
      <Window title="cart.js" x={60} y={690} w={455} h={560} tilt={8} dim>
        <CodePane code={before} size={13} scroll={22 * 13 * 1.55} />
      </Window>
      <Window title="cart.js" x={555} y={690} w={455} h={560} tilt={-8}>
        <CodePane code={after} size={13} />
      </Window>
      <Pill text={`+${lineCount(before) - lineCount(fixture)} lines`} color={C.red} x={120} y={1140} />
      <Pill text="6 questions" color={C.accent} x={600} y={1140} />
      <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={110} />
      </div>
    </AbsoluteFill>
  );
};
