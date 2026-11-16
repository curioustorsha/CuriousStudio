import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { LogoMark } from "../../brand";
import { RemotionLogo } from "../../logos";
import { CodePane, Cursor, PreviewWindow, Space, Window } from "../../productui";
import { Card, fold, useCode } from "./scenes/common";

// Static cover: the WITH editor (named Title, timing in seconds ringed) beside the real card, cursor mid-drag. "Drag to edit" (≤ 3 words).
export const Cover: React.FC = () => {
  const { after } = useCode();
  if (!after) return null;
  const { text, at } = fold(after, [[19, 26], [34, 34]], 2);
  const PV = { x: 650, y: 690, w: 330 };
  const s = PV.w / 1080;
  return (
    <AbsoluteFill>
      <Space />
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.accent }}>
        <RemotionLogo size={44} />
        CLAUDE SKILLS · REMOTION
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 170, letterSpacing: -7, color: C.text }}>
        Drag to <span style={{ color: C.accent }}>edit</span>
      </div>
      <Window title="TitleCard.tsx" x={60} y={700} w={600} h={460} tilt={8}>
        <CodePane
          code={text}
          size={17}
          spans={[
            { line: at(25), text: 'name="Title"', p: 1 },
            { line: at(34), text: "0.5 * fps", p: 1 },
          ]}
        />
      </Window>
      <PreviewWindow {...PV} tilt={-6}>
        <Card kind="after" freeze={89} />
      </PreviewWindow>
      <Cursor x={PV.x + PV.w / 2 + 20} y={PV.y + 52 + 930 * s} click={0.4} />
      <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={110} />
      </div>
    </AbsoluteFill>
  );
};
