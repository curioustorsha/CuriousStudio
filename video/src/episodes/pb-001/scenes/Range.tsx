import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { IsoBox, isoFaceMatrix, isoPoint, IsoPulse, isoShade, IsoTile, Sfx, useIsoStage, useWord } from "../../../engine/kit";
import { Space, useProofText, Window } from "../../../productui";
import { Bench, ez, HOST_C, Host, lerp, moodAt, QuestionCard, sp, Stage, Wall, WIDE } from "../../../workshop";
import { GOOG, mixCam, stageOf, World, type Cam, type P2 } from "../../his-007/scenes/world";
import { BeatHeader, hopAt, outAt, Ripple, Star, type Pt } from "./common";

/** The Maps city, framed on the app's server block (the Google block, pin hidden) and the plots beside it. */
const RANGE_CAM: Cam = { fx: 8.6, fy: 5.4, u: 56, sx: 540, sy: 880 };
/** Nudged in on the server that breaks. */
const BREAK_CAM: Cam = { fx: 10.6, fy: 5.9, u: 76, sx: 560, sy: 900 };

type Srv = { x: number; y: number; w: number; d: number; h: number; door: P2; street: P2 };
/** Two new servers: the park's empty front row, and the empty front row of the low block across avenue x = 10. */
const S2: Srv = { x: 5.75, y: 5.62, w: 1.1, d: 0.95, h: 1.0, door: [6.3, 5.56], street: [6.3, 5] };
const S3: Srv = { x: 10.7, y: 5.62, w: 1.1, d: 0.95, h: 1.0, door: [11.25, 5.56], street: [11.25, 5] };
const G = { door: [GOOG.x + GOOG.w / 2, GOOG.y + GOOG.d + 0.06] as P2, street: [GOOG.x + GOOG.w / 2, 5] as P2 };
const TARGETS = [G, S2, S3];
const LIGHTS: [number, number, number][] = [
  [GOOG.x + 0.95, GOOG.y + 0.5, GOOG.h],
  [S2.x + 0.75, S2.y + 0.15, S2.h],
  [S3.x + 0.75, S3.y + 0.15, S3.h],
];

/** People's requests come in from every side of the city along the streets, onto avenue y = 5. */
const SOURCES: P2[][] = [
  [[0, 5]],
  [[5, 15], [5, 5]],
  [[10, 15], [10, 5]],
  [[15, 5]],
  [[2.5, 0], [2.5, 5]],
  [[12.5, 0], [12.5, 5]],
  [[7.5, 0], [7.5, 5]],
  [[0, 7.5], [5, 7.5], [5, 5]],
];
const routeTo = (src: P2[], t: { door: P2; street: P2 }): P2[] => [...src, t.street, t.door];
const len = (pts: P2[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

/** A new server block: rack faces, a status light on the roof, a crack when it fails. Drops onto its plot. */
const Server: React.FC<{ s: Srv; f: number; drop: number; plot: number; ring: number; red: number; crack: number; seed: number }> = ({ s, f, drop, plot, ring, red, crack, seed }) => {
  const st = useIsoStage();
  const lift = drop * 3;
  const wall = red > 0 ? (red > 0.5 ? isoShade(C.red, -0.45) : isoShade(C.cyan, -0.45)) : isoShade(C.cyan, -0.45);
  const shake = red > 0 && red < 1 ? Math.sin(f * 2.2) * 0.04 * (1 - red) : 0;
  const x = s.x + shake;
  return (
    <g>
      {plot > 0.01 && <IsoTile x={s.x - 0.08} y={s.y - 0.08} w={s.w + 0.16} d={s.d + 0.16} color={C.cyan} opacity={0.12 * plot} strokeOpacity={0.9 * plot} dashed />}
      {drop < 1 && <IsoTile x={s.x - 0.05} y={s.y - 0.05} w={s.w + 0.1} d={s.d + 0.1} color="#000000" opacity={0.5 * (1 - drop)} strokeOpacity={0} />}
      {ring > 0.01 && ring < 0.99 && <IsoTile x={s.x + s.w / 2 - s.w * (0.6 + ring)} y={s.y + s.d / 2 - s.d * (0.6 + ring)} w={s.w * (1.2 + 2 * ring)} d={s.d * (1.2 + 2 * ring)} color={C.cyan} opacity={0} strokeOpacity={0.9 * (1 - ring)} />}
      <IsoBox x={x} y={s.y} z={lift} w={s.w} d={s.d} h={s.h} color={wall} />
      {(["left", "right"] as const).map((face) => {
        const L = face === "left" ? s.w : s.d;
        const rows = 4;
        return (
          <g key={face} transform={isoFaceMatrix(st, face, x, s.y, s.w, s.d, s.h + lift)}>
            {Array.from({ length: rows }, (_, r) => {
              const on = red < 0.5 && (Math.floor(f / 5) + r * 3 + seed + (face === "left" ? 0 : 2)) % 4 === 0;
              return (
                <g key={r}>
                  <rect x={L * 0.1} y={0.12 + r * 0.21} width={L * 0.8} height={0.12} fill={isoShade(wall, -0.3)} />
                  <rect x={L * 0.14} y={0.15 + r * 0.21} width={0.05} height={0.05} fill={red > 0.5 ? "#5A3030" : C.cyan} opacity={on ? 1 : 0.35} />
                </g>
              );
            })}
            {crack > 0.01 && face === "left" && (
              <polyline
                points={`${L * 0.55},0 ${L * 0.48},0.25 ${L * 0.6},0.45 ${L * 0.5},0.7 ${L * 0.58},${s.h}`}
                fill="none"
                stroke="#FFD0D0"
                strokeWidth={0.03}
                strokeDasharray={2}
                strokeDashoffset={2 * (1 - crack)}
                pathLength={2}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** A status light on a server roof: green when healthy, red when failing, dark when dead. */
const Light: React.FC<{ p: [number, number, number]; color: string; on: number; lift?: number }> = ({ p, color, on, lift = 0 }) => {
  const st = useIsoStage();
  const c = isoPoint(st, p[0] + 0.09, p[1] + 0.09, p[2] + lift + 0.18);
  return (
    <g>
      <IsoBox x={p[0]} y={p[1]} z={p[2] + lift} w={0.18} d={0.18} h={0.12} color={on > 0.05 ? color : "#3A3F4C"} />
      {on > 0.05 && <circle cx={c.x} cy={c.y} r={st.unit * 0.22} fill={color} opacity={0.25 * on} style={{ filter: `blur(4px)` }} />}
    </g>
  );
};

/** A queue of waiting requests piling up on the street before a door. */
const Queue: React.FC<{ street: P2; dir: number; n: number; color: string; f: number }> = ({ street, dir, n, color, f }) => {
  const st = useIsoStage();
  const out: React.ReactNode[] = [];
  for (let k = 0; k < Math.floor(n); k++) {
    const q = isoPoint(st, street[0] + dir * (0.32 + k * 0.26), street[1] + (k % 2 ? 0.1 : -0.1), 0.1);
    const r = Math.max(4, st.unit * 0.08) * (0.9 + 0.1 * Math.sin(f * 0.4 + k));
    out.push(<circle key={k} cx={q.x} cy={q.y} r={r} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />);
  }
  return <g>{out}</g>;
};

/** Lines 1–3 of the proof file (Ponytail's SKILL.md, MIT): the opening line and the first sentence of rungs 1 and 2, verbatim. */
const skillLines = (md: string) => {
  const lines = md.split("\n").filter((l) => l.trim());
  const first = lines[0];
  const rungs = lines.filter((l) => /^\d\. /.test(l)).slice(0, 2).map((l) => l.match(/^\d\. .*?[?.](?=\s|$)/)?.[0] ?? l);
  return [first, ...rungs];
};

const TASK_Y = [968, 1052, 1136];
const SKILL_WIN = { x: 70, y: 470, w: 940, h: 440 };
const LINE_Y0 = SKILL_WIN.y + 52 + 40;
const LINE_H = 54;
const FONT = 21;
const CHAR_W = FONT * 0.6;

export const Range: React.FC = () => {
  const f = useCurrentFrame();
  const wf = useWord();
  const tHuge = wf("range", "huge");
  const tMillions = wf("range", "millions");
  const tOnce = wf("range", "once");
  const tWhy = wf("range", "why");
  const tBreak = wf("range", "break");
  const tWhen = wf("range", "when");
  const tReal = wf("range", "real");
  const tClaude = wf("range", "claude");
  const tFirst = wf("range", "first");
  const tPrompt = wf("range", "prompt");
  const tSkills = wf("range", "skills");
  const tRep = wf("range", "repetitive");
  const ladder = useProofText("episodes/cs-016/proof/skill-ladder.md");

  // ---------- beats 1–2: the city
  const tDrop = [tOnce - 4, tOnce + 6];
  const tSplit = tOnce + 16;
  const drops = tDrop.map((at) => {
    const s = f < at ? 0 : sp(f, at, { damping: 13, stiffness: 190 });
    return {
      shown: f >= at,
      drop: f >= at ? Math.max(0, 1 - s) : 1,
      plot: f < at - 10 ? 0 : Math.min(1, (f - at + 10) / 6) * (1 - ez(f, at + 8, at + 16)),
      ring: f < at + 6 ? 0 : Math.min(1, (f - at - 6) / 18),
    };
  });
  const load = ez(f, tHuge, tOnce) * (1 - ez(f, tSplit, tSplit + 20));
  const red = ez(f, tBreak - 2, tBreak + 4);
  const crack = ez(f, tBreak + 2, tBreak + 14);
  const nudge = sp(f, tWhen, { damping: 200 });
  const cam = mixCam(RANGE_CAM, BREAK_CAM, nudge);
  const city = outAt(f, tReal, 10);

  const split = ez(f, tSplit - 4, tSplit + 8);
  const V = 0.13;
  const pulses: React.ReactNode[] = [];
  SOURCES.forEach((src, i) => {
    const sets: [number, number][] = [
      [0, 1 - split],
      [i % 3, split],
    ];
    sets.forEach(([ti, op], si) => {
      if (op <= 0.01) return;
      const pts = routeTo(src, TARGETS[ti]);
      const L = len(pts);
      const broken = ti === 2 && f >= tBreak;
      for (let k = 0; k < 4; k++) {
        const on = (k % 2 === 0 ? ez(f, tHuge - 4 + i * 2, tHuge + 4 + i * 2) : ez(f, tMillions + i * 2, tMillions + 8 + i * 2)) * (i < 3 || f >= tHuge - 4 ? 1 : 0);
        const base = i < 3 ? 1 : 0;
        const vis = Math.max(k === 0 ? base * (1 - ez(f, tHuge - 4, tHuge)) : 0, on);
        if (vis <= 0.01) continue;
        let t = ((f * V * (f > tMillions ? 1.35 : 1) + (k * L) / 4 + i * 1.7) % L) / L;
        if (broken) t = Math.min(t, 0.9);
        pulses.push(
          <g key={`p${i}-${si}-${k}`} opacity={vis * op}>
            <IsoPulse points={pts} t={t} color={broken ? C.red : C.accent} size={Math.max(6, cam.u * 0.1)} trail={1} trailLen={1.4} frame={f} />
          </g>,
        );
      }
    });
  });

  const lightC = (k: number) => (k === 2 && f >= tBreak ? C.red : f >= tSplit + 6 ? C.green : k === 0 ? (load > 0.5 ? C.red : C.accent) : C.green);
  const lightOn = (k: number) => (k === 2 ? (f < tBreak + 6 ? 1 : f < tBreak + 12 ? (Math.floor(f / 2) % 2 ? 1 : 0.1) : 0) : 1);
  const lightLift = (k: number) => (k === 0 ? 0 : drops[k - 1].drop * 3);

  // The asterisk leaves the dead server's status light and lands behind the bench as Aster
  const breakSt = stageOf(BREAK_CAM);
  const lp = isoPoint(breakSt, LIGHTS[2][0] + 0.09, LIGHTS[2][1] + 0.09, LIGHTS[2][2] + 0.2);
  const hop1From: Pt = [lp.x, lp.y];
  const hop1Op = f >= tReal - 6 && f < tClaude + 4 ? Math.min(ez(f, tReal - 6, tReal - 2), 1 - ez(f, tClaude, tClaude + 4)) : 0;

  // ---------- beat 3a: the workshop
  const ws = ez(f, tReal + 8, tReal + 18) * outAt(f, tSkills - 2, 10);
  const hostIn = ez(f, tClaude - 2, tClaude + 6);
  const mood = moodAt(f, [
    [0, "idle"],
    [tFirst, "think"],
    [tPrompt + 8, "gotit"],
  ]);
  const card = sp(f, tFirst - 6, { damping: 16, stiffness: 170 });

  // ---------- beat 3b: the skill file
  const ui = ez(f, tSkills - 4, tSkills + 6);
  const win = sp(f, tSkills - 2, { damping: 17, stiffness: 160 });
  const lines = ladder ? skillLines(ladder) : [];
  const typedTotal = Math.max(0, (f - tSkills - 2) * 5);
  let left = typedTotal;
  const typed = lines.map((l) => {
    const n = Math.max(0, Math.min(l.length, Math.floor(left)));
    left -= l.length;
    return n;
  });
  const cur = typed.findIndex((n, i) => n < lines[i].length);
  const curLine = cur < 0 ? lines.length - 1 : cur;
  const caret: Pt = [SKILL_WIN.x + 34 + (typed[curLine] ?? 0) * CHAR_W + 14, LINE_Y0 + curLine * LINE_H + 16];
  const ticks = [tRep, tRep + 9, tRep + 18];
  const boxAt = (k: number): Pt => [SKILL_WIN.x + 50, TASK_Y[k] + 35];
  const cursorAt = (g: number): Pt => {
    if (g < tSkills + 4) return hopAt(g, tSkills - 6, 10, HOST_C as Pt, caret, 140);
    if (g < ticks[0] - 4) return caret;
    if (g < ticks[1] - 4) return hopAt(g, ticks[0] - 4, 4, caret, boxAt(0), 30);
    if (g < ticks[2] - 4) return hopAt(g, ticks[1] - 4, 4, boxAt(0), boxAt(1), 30);
    return hopAt(g, ticks[2] - 4, 4, boxAt(1), boxAt(2), 30);
  };
  const cursorSize = lerp(70, 30, ez(f, tSkills - 6, tSkills + 4));

  return (
    <>
      <Sfx name="data" at={tHuge} volume={0.22} dur={tOnce - tHuge} />
      <Sfx name="thud" at={tDrop[0] + 3} volume={0.45} />
      <Sfx name="thud" at={tDrop[1] + 3} volume={0.45} />
      <Sfx name="ding" at={tSplit + 6} volume={0.3} />
      <Sfx name="crack" at={tBreak} volume={0.4} />
      <Sfx name="error" at={tBreak + 2} volume={0.2} />
      <Sfx name="whoosh" at={tReal - 6} volume={0.35} />
      <Sfx name="pop" at={tFirst - 4} volume={0.35} />
      <Sfx name="whoosh" at={tSkills - 6} volume={0.3} />
      {ticks.map((t, k) => (
        <Sfx key={k} name="click" at={t} volume={0.4} />
      ))}

      {/* beats 1–2 */}
      {city > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: city }}>
          <World
            cam={cam}
            route={{ progress: 1, opacity: 0 }}
            you={{ opacity: 0 }}
            goog={{ pin: 0, glow: 0.3 + 0.7 * load, rack: 0.5 + 0.5 * load }}
            actors={[
              { x: GOOG.x + GOOG.w / 2 + 0.01, y: GOOG.y + GOOG.d / 2, node: <Light p={LIGHTS[0]} color={lightC(0)} on={lightOn(0)} /> },
              ...drops.flatMap((d, k) => {
                if (!d.shown && d.plot <= 0) return [];
                const s = k === 0 ? S2 : S3;
                return [
                  {
                    x: s.x + s.w / 2,
                    y: s.y + s.d / 2,
                    node: (
                      <>
                        <Server s={s} f={f} drop={d.drop} plot={d.plot} ring={d.ring} red={k === 1 ? red : 0} crack={k === 1 ? crack : 0} seed={k * 2} />
                        {d.shown && <Light p={LIGHTS[k + 1]} color={lightC(k + 1)} on={lightOn(k + 1)} lift={lightLift(k + 1)} />}
                      </>
                    ),
                  },
                ];
              }),
            ]}
            overlay={
              <>
                {pulses}
                <Queue street={G.street} dir={-1} n={7 * load} color={C.accent} f={f} />
                <Queue street={S3.street} dir={1} n={f >= tBreak ? Math.min(8, (f - tBreak) / 5) : 0} color={C.red} f={f} />
              </>
            }
          />
        </div>
      )}
      <Ripple c={hop1From} p={f >= tReal - 6 ? (f - tReal + 6) / 16 : 0} r={40} color={C.accent} />

      {/* beat 3a: the workshop */}
      {ws > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: ws }}>
          <Stage cam={WIDE}>
            <Wall />
            <Host f={f} {...mood} opacity={hostIn} />
            <Bench>
              {card > 0.001 && <QuestionCard x={lerp(-280, 110, Math.min(1, card))} text="Plan my week" />}
            </Bench>
          </Stage>
        </div>
      )}

      {/* beat 3b: the skill file */}
      {ui > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: ui }}>
          <Space />
          <div style={{ opacity: Math.min(1, win * 1.3), transform: `translateY(${(1 - win) * 80}px)` }}>
            <Window kind="editor" title="SKILL.md" x={SKILL_WIN.x} y={SKILL_WIN.y} w={SKILL_WIN.w} h={SKILL_WIN.h} tilt={-4 + Math.sin(f / 50) * 1.5}>
              <div style={{ position: "absolute", left: 34, right: 20, top: 40, fontFamily: F.mono, fontSize: FONT, lineHeight: `${LINE_H}px`, whiteSpace: "pre", color: C.text }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ color: i === 0 ? C.muted : C.text }}>
                    {l.slice(0, typed[i])}
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", right: 26, bottom: 22, fontFamily: F.mono, fontSize: 18, letterSpacing: 1, color: C.muted }}>Ponytail SKILL.md · DietrichGebert · MIT</div>
            </Window>
          </div>
          {TASK_Y.map((y, k) => {
            const pIn = sp(f, tSkills + 8 + k * 3, { damping: 16, stiffness: 180 });
            const done = ez(f, ticks[k], ticks[k] + 6);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: SKILL_WIN.x,
                  width: SKILL_WIN.w,
                  top: y,
                  height: 70,
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  padding: "0 28px",
                  boxSizing: "border-box",
                  background: done > 0.5 ? "rgba(61,220,151,0.10)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${done > 0.5 ? C.green : "rgba(255,255,255,0.10)"}`,
                  opacity: Math.min(1, pIn * 1.4),
                  transform: `translateX(${(1 - Math.min(1, pIn)) * 80}px) scale(${1 + 0.03 * Math.sin(done * Math.PI)})`,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, border: `3px solid ${done > 0.5 ? C.green : "rgba(255,255,255,0.3)"}`, background: done > 0.5 ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {done > 0.5 && (
                    <svg width={26} height={26} viewBox="0 0 26 26">
                      <path d="M 5 13 L 11 19 L 21 7" fill="none" stroke="#06140D" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - done)} />
                    </svg>
                  )}
                </div>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 32, color: done > 0.5 ? C.text : C.muted }}>Format the weekly report</div>
              </div>
            );
          })}
        </div>
      )}

      {/* the asterisk */}
      <Star f={f} at={(g) => hopAt(g, tReal - 4, tClaude - tReal + 2, hop1From, HOST_C as Pt, 220)} size={lerp(34, 150, ez(f, tReal - 4, tClaude))} rotate={f * 5} opacity={hop1Op} trail={1} />
      <Star f={f} at={cursorAt} size={cursorSize} rotate={f * 4} opacity={f >= tSkills - 6 ? 1 : 0} trail={f < tSkills + 4 || (f >= ticks[0] - 4 && f < ticks[2]) ? 1 : 0} glow={0.7} />

      <BeatHeader kicker="MILLIONS AT ONCE" title={<>How big apps <span style={{ color: C.green }}>cope</span></>} opacity={outAt(f, tWhy - 4, 8)} />
      <BeatHeader kicker="WHEN IT FAILS" title={<>Why things <span style={{ color: C.red }}>break</span></>} opacity={ez(f, tWhy - 2, tWhy + 6) * outAt(f, tReal + 4, 8)} />
      <BeatHeader kicker="WORK WITH CLAUDE" title={<>Prompt to <span style={{ color: C.accent }}>skill</span></>} opacity={ez(f, tReal + 8, tReal + 16)} />
    </>
  );
};
