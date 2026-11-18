import React from "react";
import { useCurrentFrame } from "remotion";
import { Sfx, useWord } from "../../../engine/kit";
import { C } from "../../../theme";
import { Bench, Desk, ez, FileDoc, Host, HOST_C, moodAt, pointHands, QuestionCard, ReplyCard, sp, Stage, Wall, WIDE, WS, CLAUDE_REST, type P2 } from "../../../workshop";
import { LessonHeader } from "./common";

export const HookHeader: React.FC<{ opacity?: number }> = ({ opacity }) => <LessonHeader opacity={opacity} title="All on one desk" />;

export const OBJ = { q: 170, file: 400, reply: 690 };

/** The three things on the desk (hook, intro, onit): your question, a file, Claude's reply. `p` 0→1 each. */
export const DeskObjects: React.FC<{ p: [number, number, number]; amber?: boolean; dx?: [number, number, number]; opacity?: number }> = ({ p, amber = false, dx = [0, 0, 0], opacity = 1 }) => (
  <>
    {p[0] > 0.001 && <QuestionCard x={OBJ.q + dx[0] - (1 - Math.min(1, p[0])) * 360} opacity={Math.min(1, p[0] * 2) * opacity} text="Sum up this report" />}
    {p[1] > 0.001 && <FileDoc x={OBJ.file + dx[1]} y={WS.benchTop + 2 - (1 - Math.min(1, p[1])) * 240} opacity={Math.min(1, p[1] * 3) * opacity} />}
    {p[2] > 0.001 && <ReplyCard x={OBJ.reply + dx[2]} y={WS.benchTop + 2 - (1 - Math.min(1, p[2])) * 90} amber={amber} opacity={Math.min(1, p[2] * 2.5) * opacity} />}
  </>
);

/** A soft cone of light from Aster down over the bench. */
const Cone: React.FC<{ p: number }> = ({ p }) =>
  p > 0 ? (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <polygon points={`${HOST_C[0] - 40},${HOST_C[1]} ${HOST_C[0] + 40},${HOST_C[1]} ${940},${WS.benchTop} ${140},${WS.benchTop}`} fill={C.accent} opacity={0.07 * p} />
    </svg>
  ) : null;

/** The hook at any frame `f` (also the loop frame the sign-off fades back to: empty bench at f = 0). */
export const HookView: React.FC<{ f: number; header?: boolean; dim?: number }> = ({ f, header = true, dim = 1 }) => {
  const wf = useWord();
  const tSee = wf("hook", "see");
  const tDesk = wf("hook", "desk");
  const tWhats = wf("hook", "whats");
  const ats = [tWhats - 4, tWhats + 5, tWhats + 14];
  const cone = ez(f, 2, tSee + 6) * (1 - ez(f, tDesk + 10, tDesk + 30) * 0.6);
  const draw = ez(f, tDesk - 4, tDesk + 16);
  const ps = ats.map((a) => sp(f, a - 4, { damping: 14, stiffness: 210 })) as [number, number, number];
  const targets: P2[] = [
    [OBJ.q + 107, WS.benchTop - 130],
    [OBJ.file + 75, WS.benchTop - 190],
    [OBJ.reply + 107, WS.benchTop - 130],
  ];
  let hands = { ...CLAUDE_REST };
  for (let k = ats.length - 1; k >= 0; k--) {
    if (f >= ats[k] - 10 && f <= ats[k] + 8) {
      hands = pointHands(targets[k], ez(f, ats[k] - 10, ats[k] - 4) * (1 - ez(f, ats[k] + 2, ats[k] + 8)));
      break;
    }
  }
  const m = moodAt(f, [
    [0, "idle"],
    [tSee - 4, "think"],
    [tDesk + 8, "idle"],
  ]);
  return (
    <>
      <Stage cam={WIDE} dim={dim}>
        <Wall />
        <Cone p={cone} />
        <Host f={f} {...hands} {...m} />
        <Bench />
        <Desk draw={draw} />
        <DeskObjects p={ps} amber={f >= ats[2] - 6 && f < ats[2] + 8} />
      </Stage>
      {header && <HookHeader />}
    </>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tSee = wf("hook", "see");
  const tDesk = wf("hook", "desk");
  const tWhats = wf("hook", "whats");
  const ats = [tWhats - 4, tWhats + 5, tWhats + 14];
  return (
    <>
      <Sfx name="scan" at={tSee - 4} volume={0.18} />
      <Sfx name="click" at={tDesk + 12} volume={0.35} />
      {ats.map((a, i) => (
        <Sfx key={i} name="pop" at={a - 2} volume={0.3} />
      ))}
      <HookView f={f} />
    </>
  );
};
