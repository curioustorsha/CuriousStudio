import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../theme";

// Claude Skills "Product launch UI": glossy windows in a dark, deep space. Shared by every CS episode.

export const pop = (frame: number, at: number, fps: number, damping = 18) =>
  spring({ frame: frame - at, fps, config: { damping, mass: 0.9 } });

// Static floor: scenes cut between each other, so a moving grid would jump at every cut.
export const Space: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#05060A", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 50% 38%, rgba(255,181,71,0.10), transparent 60%)" }} />
      <AbsoluteFill
        style={{
          transform: "perspective(900px) rotateX(62deg) translateY(380px)",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 35%, transparent 80%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%, transparent 80%)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.75))" }} />
    </AbsoluteFill>
  );
};

type WindowProps = {
  kind?: "browser" | "terminal" | "editor";
  title?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tilt?: number; // degrees around Y
  dim?: boolean;
  accent?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const Window: React.FC<WindowProps> = ({ kind = "editor", title, x, y, w, h, tilt = 0, dim, accent = C.accent, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 22,
      background: "linear-gradient(180deg, rgba(30,33,44,0.96), rgba(16,18,25,0.96))",
      border: `1px solid ${dim ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)"}`,
      boxShadow: dim ? "0 30px 60px rgba(0,0,0,0.5)" : `0 40px 90px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22, 0 0 60px ${accent}18`,
      transform: `perspective(1600px) rotateY(${tilt}deg)`,
      overflow: "hidden",
      filter: dim ? "saturate(0.2) brightness(0.8)" : undefined,
      ...style,
    }}
  >
    <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: dim ? "#555" : c }} />
      ))}
      <div style={{ flex: 1, textAlign: "center", fontFamily: F.mono, fontSize: 19, color: C.muted, marginRight: 60, ...(kind === "browser" ? { background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "4px 0" } : {}) }}>
        {title}
      </div>
    </div>
    <div style={{ position: "relative", height: h - 52, overflow: "hidden" }}>{children}</div>
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(160deg, rgba(255,255,255,0.07), transparent 35%)" }} />
  </div>
);

/** Loads a proof text file from public/ (real output only, never typed by hand). */
export const useProofText = (path: string) => {
  const [text, setText] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`proof ${path}`));
  useEffect(() => {
    fetch(staticFile(path))
      .then((r) => r.text())
      .then((t) => {
        setText(t);
        continueRender(handle);
      });
  }, [path, handle]);
  return text;
};

/** Code with line numbers. `shown` reveals lines one by one; `scroll` is pixels scrolled. */
// Line numbers are off by default: they count blank lines, so they would disagree with a "lines of code" figure.
export const CodePane: React.FC<{ code: string; shown?: number; scroll?: number; size?: number; numbers?: boolean }> = ({ code, shown = Infinity, scroll = 0, size = 19, numbers = false }) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const lh = size * 1.55;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 18 - scroll, fontFamily: F.mono, fontSize: size, lineHeight: `${lh}px` }}>
      {lines.slice(0, Math.floor(shown)).map((l, i) => (
        <div key={i} style={{ display: "flex", whiteSpace: "pre", minHeight: lh }}>
          {numbers ? <span style={{ width: 64, textAlign: "right", paddingRight: 18, color: "rgba(255,255,255,0.22)" }}>{i + 1}</span> : <span style={{ width: 32 }} />}
          <span style={{ color: l.trim().startsWith("//") ? C.muted : C.text }}>{l}</span>
        </div>
      ))}
    </div>
  );
};

export const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`);

export const RepoCard: React.FC<{ repo: string; maker: string; stars: number; at: number; x: number; y: number }> = ({ repo, maker, stars, at, x, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, at, fps);
  const count = interpolate(f, [at + 8, at + 50], [0, stars], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 860, opacity: p, transform: `perspective(1400px) translateY(${(1 - p) * 80}px) rotateX(${(1 - p) * 18}deg)` }}>
      <Window kind="browser" title="github.com" x={0} y={0} w={860} h={330}>
        <div style={{ padding: "34px 44px", fontFamily: F.sans, color: C.text }}>
          <div style={{ fontSize: 26, color: C.muted, fontFamily: F.mono }}>{maker} /</div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.5, marginTop: 4 }}>{repo}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 30, fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: C.accent }}>
            <span style={{ fontSize: 40 }}>★</span>
            {compact(count)}
            <span style={{ fontSize: 22, color: C.muted, fontWeight: 500 }}>GitHub stars</span>
          </div>
        </div>
      </Window>
    </div>
  );
};

export const Label: React.FC<{ text: string; color?: string; style?: React.CSSProperties }> = ({ text, color = C.accent, style }) => (
  <div style={{ position: "absolute", fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color, ...style }}>{text}</div>
);

export const CatchCard: React.FC<{ text: string; x: number; y: number; p: number }> = ({ text, x, y, p }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 860,
      padding: "34px 40px",
      borderRadius: 22,
      border: `2px solid ${C.accent}`,
      background: "rgba(255,181,71,0.06)",
      boxShadow: `0 0 50px ${C.accent}22`,
      fontFamily: F.sans,
      color: C.text,
      opacity: p,
      transform: `scale(${0.9 + 0.1 * p})`,
    }}
  >
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: C.accent }}>THE CATCH</div>
    <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25, marginTop: 14 }}>{text}</div>
  </div>
);

/** Terminal typing the install command(s), one per line, with the link under it. */
export const InstallBar: React.FC<{ command: string; link: string; at: number; x: number; y: number }> = ({ command, link, at, x, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, at, fps);
  const typed = command.slice(0, Math.max(0, Math.floor((f - at - 6) * 1.6)));
  const cursorOn = Math.floor(f / 15) % 2 === 0;
  const lines = command.split("\n").length;
  const h = 110 + lines * 48;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <Window kind="terminal" title="claude" x={0} y={0} w={860} h={h}>
        <div style={{ padding: "26px 32px", fontFamily: F.mono, fontSize: 26, lineHeight: "48px", color: C.text, whiteSpace: "pre" }}>
          {typed.split("\n").map((l, i, all) => (
            <div key={i}>
              <span style={{ color: C.accent }}>&gt; </span>
              {l}
              {i === all.length - 1 && <span style={{ opacity: cursorOn ? 1 : 0, color: C.accent }}>▍</span>}
            </div>
          ))}
        </div>
      </Window>
      <div style={{ position: "absolute", top: h + 26, width: 860, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: C.muted }}>{link}</div>
    </div>
  );
};
