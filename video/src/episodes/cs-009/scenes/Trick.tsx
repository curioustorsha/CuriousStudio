import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { Sfx, useWord } from "../../../engine/kit";
import { CodePane, pop, Space, Window } from "../../../productui";
import { clampI, fold, Header, PROOF, SourceLine, useCandidate } from "./common";

const SIZE = 22;
const LH = SIZE * 1.55;
const ED = { x: 90, y: 420, w: 900, h: 452 };
const TERM = { x: 90, y: 895, w: 900, h: 196 };
/** Real lines of docs/cases/life/job-search.lifecycle.json: the first state (a box) and the first transition (an arrow). */
const RANGES: [number, number][] = [
  [24, 28],
  [109, 113],
];
const BROKEN = 112; // "to": "applied",
/** The finalize command from SKILL.md, filled in for this file (type lifecycle, output named in its meta). */
const CMD = ["node bin/archify.mjs finalize lifecycle", "  candidate.json job-search.lifecycle.html", "  --quality showcase --json"];

const rowY = (row: number) => ED.y + 52 + 18 + (row - 1) * LH + LH / 2;

/** "The trick? Claude never draws the picture. It writes a list of boxes and arrows, and Archify's checker bounces anything broken back to Claude. You get one HTML file to share." */
export const Trick: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wf = useWord();
  const json = useCandidate();
  if (!json) return null;
  const tNever = wf("trick", "never");
  const tPicture = wf("trick", "picture");
  const tWrites = wf("trick", "writes");
  const tBoxes = wf("trick", "boxes");
  const tArrows = wf("trick", "arrows");
  const tArchify = wf("trick", "archify");
  const tChecker = wf("trick", "checker");
  const tBroken = wf("trick", "broken");
  const tBack = wf("trick", "back");
  const tOne = wf("trick", "one");
  const tFile = wf("trick", "file");

  const code = fold(json, RANGES, 2);
  const brokenRow = code.at(BROKEN);
  const lines = code.text.split("\n");
  // retype the broken line after it comes back
  const retypeAt = tBack + 8;
  const fixed = lines[brokenRow - 1];
  const retyped = f >= retypeAt - 2 && f < retypeAt + 24 ? fixed.slice(0, Math.max(0, Math.floor((f - retypeAt) * 1.4))) : fixed;
  const shownText = lines.map((l, i) => (i === brokenRow - 1 ? retyped : l)).join("\n");

  // phase 0: a hand sketch that gets struck out
  const sketch = clampI(f, 0, tPicture);
  const strike = clampI(f, tPicture, tPicture + 10);
  const sketchOut = 1 - clampI(f, tWrites - 8, tWrites);
  // editor + terminal
  const ed = pop(f, tWrites - 6, fps);
  const shown = clampI(f, tWrites, tArrows + 6, 0, lines.length);
  const terminal = pop(f, tArchify - 6, fps);
  const cmdShown = clampI(f, tArchify - 2, tArchify + 10, 0, CMD.length);
  const finRing = clampI(f, tChecker - 2, tChecker + 10) * (1 - clampI(f, tBroken + 30, tBroken + 40));
  const packet = clampI(f, tChecker + 2, tChecker + 18);
  const red = clampI(f, tBroken - 2, tBroken + 4) * (1 - clampI(f, retypeAt + 2, retypeAt + 8));
  const arrow = clampI(f, tBroken + 2, tBack + 6);
  const amber = clampI(f, retypeAt + 22, retypeAt + 30);
  const pass = clampI(f, tOne - 4, tOne + 4);
  const chip = pop(f, tFile - 6, fps, 14);
  const thumb = pop(f, tFile + 4, fps);

  const arrowTop = rowY(brokenRow);
  const arrowBottom = TERM.y + 52 + 40;
  const arrowLen = arrowBottom - arrowTop + 80;

  return (
    <>
      <Sfx name="riser" at={0} volume={0.14} dur={30} />
      <Sfx name="swoosh" at={tNever} volume={0.2} />
      <Sfx name="thud" at={tPicture} volume={0.3} />
      {Array.from({ length: lines.length }, (_, i) => (
        <Sfx key={i} name="click" at={tWrites + Math.round((i * (tArrows + 6 - tWrites)) / lines.length)} volume={0.1} dur={10} />
      ))}
      <Sfx name="scan" at={tChecker} volume={0.22} dur={36} />
      <Sfx name="error" at={tBroken} volume={0.3} />
      <Sfx name="swoosh" at={tBroken + 8} volume={0.2} />
      <Sfx name="ding" at={tOne} volume={0.35} />
      <Sfx name="pop" at={tFile - 6} volume={0.3} />
      <Space />
      <Header title="Claude writes, it checks" />

      {sketchOut > 0 && (
        <svg style={{ position: "absolute", left: 190, top: 500, opacity: sketchOut }} width={700} height={360} viewBox="0 0 700 360">
          <g fill="none" stroke="rgba(245,245,247,0.75)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={2000} strokeDashoffset={2000 * (1 - sketch)}>
            <path d="M40 70 C 120 60, 200 78, 262 66 L 258 170 C 190 176, 110 168, 44 174 Z" />
            <path d="M438 190 C 520 182, 600 196, 660 186 L 656 300 C 580 306, 510 296, 442 302 Z" />
            <path d="M262 120 C 340 130, 380 170, 438 236" />
            <path d="M410 222 L 440 240 L 424 206" />
          </g>
          <line x1={20} y1={330} x2={680} y2={30} stroke={C.accent} strokeWidth={12} strokeLinecap="round" strokeDasharray={760} strokeDashoffset={760 * (1 - strike)} style={{ filter: `drop-shadow(0 0 12px ${C.accent})` }} />
        </svg>
      )}

      <div style={{ opacity: ed, transform: `translateY(${(1 - ed) * -40}px)` }}>
        <Window title="candidate.json" {...ED} accent={red > 0 ? C.red : C.accent}>
          <CodePane
            code={shownText}
            shown={shown}
            size={SIZE}
            spans={[
              { line: code.at(24), text: '"states"', p: clampI(f, tBoxes - 2, tBoxes + 8) },
              { line: code.at(109), text: '"transitions"', p: clampI(f, tArrows - 2, tArrows + 8) },
              // the line that comes back: red while it's bounced, amber once Claude has rewritten it
              ...(red > 0 ? [{ line: brokenRow, text: retyped.trim(), p: red, color: C.red }] : amber > 0 && f < tOne ? [{ line: brokenRow, text: fixed.trim(), p: amber }] : []),
            ]}
            glowLine={{ line: brokenRow, p: red > 0 ? red : amber * (1 - clampI(f, tOne, tOne + 10)), color: red > 0 ? C.red : C.accent }}
          />
        </Window>
      </div>

      {packet > 0 && packet < 1 && (
        <div style={{ position: "absolute", left: 380, top: ED.y + ED.h - 40 + (TERM.y + 80 - (ED.y + ED.h - 40)) * packet, padding: "8px 18px", borderRadius: 12, background: C.accent, color: "#111", fontFamily: F.mono, fontWeight: 700, fontSize: 22, opacity: Math.sin(packet * Math.PI) * 1.4, boxShadow: `0 0 30px ${C.accent}` }}>candidate.json</div>
      )}

      <div style={{ opacity: terminal, transform: `translateY(${(1 - terminal) * 50}px)` }}>
        <Window
          kind="terminal"
          title="claude · archify"
          {...TERM}
          accent={pass > 0 ? C.green : red > 0 ? C.red : C.accent}
          style={{ borderColor: pass > 0 ? `rgba(61,220,151,${0.3 + 0.7 * pass})` : red > 0 ? `rgba(255,92,92,${red})` : undefined }}
        >
          <div style={{ padding: "16px 28px", fontFamily: F.mono, fontSize: 25, lineHeight: "42px", color: C.text, whiteSpace: "pre" }}>
            {CMD.slice(0, Math.floor(cmdShown)).map((l, i) => (
              <div key={i}>
                <span style={{ color: C.accent }}>{i === 0 ? "> " : "  "}</span>
                {i === 0 ? (
                  <>
                    node bin/archify.mjs{" "}
                    <span style={{ borderRadius: 6, background: `rgba(255,181,71,${0.25 * finRing})`, boxShadow: finRing > 0 ? `0 0 0 ${3 * finRing}px ${C.accent}, 0 0 ${24 * finRing}px ${C.accent}` : undefined, color: finRing > 0.5 ? C.accent : undefined }}>finalize</span> lifecycle
                  </>
                ) : (
                  l
                )}
              </div>
            ))}
          </div>
          {pass > 0 && (
            <div style={{ position: "absolute", right: 34, top: 18, width: 64, height: 64, borderRadius: 32, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pass})`, boxShadow: `0 0 30px ${C.green}` }}>
              <svg width={36} height={36} viewBox="0 0 24 24">
                <path d="M4 12.5 L10 18 L20 6" fill="none" stroke="#06140D" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </Window>
      </div>

      {arrow > 0 && red > 0 && (
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: Math.min(1, red * 1.5) }} width={1080} height={1920}>
          <path
            d={`M 96 ${arrowBottom} C 30 ${arrowBottom}, 30 ${arrowTop}, 112 ${arrowTop}`}
            fill="none"
            stroke={C.red}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={arrowLen}
            strokeDashoffset={arrowLen * (1 - arrow)}
            style={{ filter: `drop-shadow(0 0 10px ${C.red})` }}
          />
          {arrow > 0.9 && <path d={`M 96 ${arrowTop - 14} L 116 ${arrowTop} L 96 ${arrowTop + 14}`} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      )}

      {chip > 0 && (
        <div style={{ position: "absolute", left: 90, top: 1112, display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ padding: "18px 26px", borderRadius: 16, border: `2px solid ${C.green}`, background: "rgba(61,220,151,0.1)", fontFamily: F.mono, fontWeight: 700, fontSize: 26, color: C.text, opacity: chip, transform: `translateY(${(1 - chip) * -60}px)`, boxShadow: `0 0 30px ${C.green}33` }}>
            <span style={{ color: C.green }}>1 file · </span>job-search.lifecycle.html
          </div>
          <div style={{ width: 230, height: 121, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)", opacity: thumb, transform: `scale(${0.6 + 0.4 * thumb})`, transformOrigin: "0 50%" }}>
            <Img src={staticFile(`${PROOF}/job-search.lifecycle.webp`)} style={{ width: 230, height: 121, display: "block" }} />
          </div>
        </div>
      )}
      <SourceLine text="SOURCE · Archify SKILL.md (finalize), README · JSON: docs/cases/life" />
    </>
  );
};
