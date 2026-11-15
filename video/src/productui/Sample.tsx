import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../theme";
import { Asterisk } from "../brand";
import { CatchCard, CodePane, InstallBar, Label, pop, RepoCard, Space, useProofText, Window } from ".";

// Silent style sample for Claude Skills (CS-016, Ponytail). Proof files are the maker's own benchmark output.
export const SAMPLE_FRAMES = 450;

const fade = (f: number, a: number, b: number) =>
  interpolate(f, [a, a + 10, b - 10, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const ProductUISample: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const before = useProofText("episodes/cs-016/proof/before.js");
  const after = useProofText("episodes/cs-016/proof/after.js");
  if (!before || !after) return null;

  const titles: [number, number, string][] = [
    [0, 105, "You asked for a debounce."],
    [105, 300, "116 lines → 10"],
    [300, 370, "Who it's for"],
    [370, SAMPLE_FRAMES + 10, "Install it"],
  ];
  const split = fade(f, 105, 300);
  const scroll = interpolate(f, [130, 290], [0, 2500], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = interpolate(f, [150, 230], [0, 14], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const drift = Math.sin(f / 40) * 2;

  return (
    <AbsoluteFill style={{ fontFamily: F.sans }}>
      <Space />

      {/* watermark + series tag */}
      <div style={{ position: "absolute", top: 56, left: 60, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", fontWeight: 800, fontSize: 32, color: "rgba(245,245,247,0.8)", letterSpacing: -0.5, lineHeight: 1 }}>
          curiously
          <span style={{ display: "flex", marginLeft: 3, marginTop: -3 }}>
            <Asterisk size={15} />
          </span>
        </div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: C.accent, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.accent}55` }}>CLAUDE SKILLS</div>
      </div>

      {/* header 170–400 */}
      <Label text="CLAUDE SKILLS · github.com/DietrichGebert/ponytail · ★191k" style={{ top: 200, left: 60, right: 60, fontSize: 20, letterSpacing: 1.5 }} />
      {titles.map(([a, b, t]) => (
        <div key={t} style={{ position: "absolute", top: 250, left: 60, right: 60, fontSize: 72, fontWeight: 800, letterSpacing: -2, color: C.text, opacity: fade(f, a, b) }}>
          {t}
        </div>
      ))}

      {/* 1. intro: repo card */}
      <div style={{ opacity: fade(f, 0, 105) }}>
        <RepoCard repo="ponytail" maker="DietrichGebert" stars={190910} at={12} x={110} y={560 + drift} />
      </div>

      {/* 2. before / after split */}
      <div style={{ opacity: split }}>
        <Label text="WITHOUT · 116 LINES" color={C.muted} style={{ top: 420, left: 70 }} />
        <Window title="search.js" x={60} y={450} w={960} h={320} tilt={-4 + drift} dim>
          <CodePane code={before} scroll={scroll} size={17} />
        </Window>
        <Label text="WITH PONYTAIL · 10 LINES" style={{ top: 792, left: 70, opacity: pop(f, 140, fps) }} />
        <Window title="search.js" x={60} y={830} w={960} h={420} tilt={4 - drift} style={{ opacity: pop(f, 140, fps), transform: `perspective(1600px) rotateY(${4 - drift}deg) scale(${0.94 + 0.06 * pop(f, 140, fps)})` }}>
          <CodePane code={after} shown={shown} size={17} />
        </Window>
        <div style={{ position: "absolute", top: 1262, left: 60, right: 60, fontFamily: F.mono, fontSize: 20, color: C.muted, letterSpacing: 1 }}>
          EXAMPLE · from the ponytail repo · maker&apos;s benchmark
        </div>
      </div>

      {/* 3. the catch */}
      <div style={{ opacity: fade(f, 300, 370) }}>
        <CatchCard x={110} y={600} p={pop(f, 304, fps)} text="Coding only. And those numbers are the maker's own benchmark." />
      </div>

      {/* 4. install */}
      <div style={{ opacity: fade(f, 370, SAMPLE_FRAMES + 10) }}>
        <InstallBar command={"/plugin marketplace add DietrichGebert/ponytail\n/plugin install ponytail@ponytail"} link="github.com/DietrichGebert/ponytail" at={374} x={110} y={640} />
      </div>
    </AbsoluteFill>
  );
};
