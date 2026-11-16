import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
// `marks` (1-based line numbers) get a green diff gutter bar and tint, faded in by `markP`.
// `spans` ring an exact piece of text on a line (first match), drawn on by `p`, so a callout sits on the real code
// without guessing character widths. `glowLine` softly lights one whole line (0→1).
export type CodeSpan = { line: number; text: string; p: number; color?: string };
export const CodePane: React.FC<{ code: string; shown?: number; scroll?: number; size?: number; numbers?: boolean; marks?: number[]; markP?: number; spans?: CodeSpan[]; glowLine?: { line: number; p: number; color?: string } }> = ({ code, shown = Infinity, scroll = 0, size = 19, numbers = false, marks = [], markP = 1, spans = [], glowLine }) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const lh = size * 1.55;
  const renderLine = (l: string, n: number) => {
    const s = spans.find((x) => x.line === n && x.p > 0 && l.includes(x.text));
    if (!s) return l;
    const i = l.indexOf(s.text);
    const c = s.color ?? C.accent;
    return (
      <>
        {l.slice(0, i)}
        <span style={{ color: s.p > 0.5 ? C.text : undefined, borderRadius: 6, background: `${c}${Math.round(0x30 * s.p).toString(16).padStart(2, "0")}`, boxShadow: `0 0 0 ${2 * s.p}px ${c}, 0 0 ${18 * s.p}px ${c}88` }}>{s.text}</span>
        {l.slice(i + s.text.length)}
      </>
    );
  };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 18 - scroll, fontFamily: F.mono, fontSize: size, lineHeight: `${lh}px` }}>
      {lines.slice(0, Math.floor(shown)).map((l, i) => (
        <div key={i} style={{ display: "flex", whiteSpace: "pre", minHeight: lh, position: "relative" }}>
          {marks.includes(i + 1) && (
            <div style={{ position: "absolute", inset: 0, opacity: markP, background: `${C.green}14`, borderLeft: `5px solid ${C.green}` }} />
          )}
          {glowLine && glowLine.line === i + 1 && glowLine.p > 0 && (
            <div style={{ position: "absolute", inset: 0, opacity: glowLine.p, background: `${glowLine.color ?? C.accent}22` }} />
          )}
          {numbers ? <span style={{ width: 64, textAlign: "right", paddingRight: 18, color: "rgba(255,255,255,0.22)" }}>{i + 1}</span> : <span style={{ width: 32, flexShrink: 0 }} />}
          <span style={{ position: "relative", color: l.trim().startsWith("//") ? C.muted : C.text }}>{renderLine(l, i + 1)}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * A small 9:16 window that shows a full 1080×1920 composition scaled down to width `w` (e.g. a proof card's real
 * component inside <Loop> or <Freeze>). Children are laid out at full size; `children` coords stay 1080×1920.
 */
export const PreviewWindow: React.FC<{ x: number; y: number; w: number; title?: string; dim?: boolean; tilt?: number; accent?: string; overlay?: React.ReactNode; children?: React.ReactNode }> = ({ x, y, w, title = "Preview", dim, tilt = 0, accent, overlay, children }) => {
  const s = w / 1080;
  const h = Math.round(1920 * s) + 52;
  return (
    <Window kind="browser" title={title} x={x} y={y} w={w} h={h} tilt={tilt} dim={dim} accent={accent}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${s})`, transformOrigin: "0 0", overflow: "hidden" }}>
        {children}
        {overlay}
      </div>
    </Window>
  );
};

/** A pointer cursor at (x, y) (the arrow's tip); `click` 0→1 plays a press and an amber ring. */
export const Cursor: React.FC<{ x: number; y: number; click?: number; opacity?: number }> = ({ x, y, click = 0, opacity = 1 }) => {
  const press = click > 0 && click < 1 ? Math.sin(click * Math.PI) : 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none" }}>
      {click > 0 && click < 1 && (
        <div style={{ position: "absolute", left: -40 * click, top: -40 * click, width: 80 * click, height: 80 * click, borderRadius: "50%", border: `3px solid ${C.accent}`, opacity: 1 - click }} />
      )}
      <svg width={44} height={52} viewBox="0 0 22 26" style={{ transform: `scale(${1 - 0.15 * press})`, transformOrigin: "0 0", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))" }}>
        <path d="M1 1 L1 20 L6 15.5 L9.5 23.5 L13 22 L9.6 14.2 L16 14.2 Z" fill="#FFFFFF" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${Math.round(n)}`);

/** Whether a file in public/ exists (HEAD request). Missing proof shows a placeholder instead of breaking the render. */
export const useStaticExists = (path: string) => {
  const [ok, setOk] = useState<boolean | null>(null);
  const [handle] = useState(() => delayRender(`exists ${path}`));
  useEffect(() => {
    fetch(staticFile(path), { method: "HEAD" })
      .then((r) => r.ok && !(r.headers.get("content-type") ?? "").includes("text/html"))
      .catch(() => false)
      .then((v) => {
        setOk(v);
        continueRender(handle);
      });
  }, [path, handle]);
  return ok;
};

/**
 * A proof image (the maker's demo or our screenshot) seen through a camera: `cx`/`cy` is the point of the image
 * (in its own `natW`-wide units) at the pane's centre, `scale` the zoom. Children are drawn in image units, so
 * callouts stay pinned to the image while the camera moves. A missing file shows a labelled placeholder, never a redraw.
 */
export const ImagePane: React.FC<{
  src: string;
  natW: number;
  natH: number;
  pw: number;
  ph: number;
  cx: number;
  cy: number;
  scale: number;
  grey?: number;
  label?: string;
  children?: React.ReactNode;
}> = ({ src, natW, natH, pw, ph, cx, cy, scale, grey = 0, label = "Proof image", children }) => {
  const ok = useStaticExists(src);
  const left = pw / 2 - cx * scale;
  const top = ph / 2 - cy * scale;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph, overflow: "hidden" }}>
      {ok ? (
        <div style={{ position: "absolute", left, top, width: natW, height: natH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <Img src={staticFile(src)} style={{ width: natW, height: natH, display: "block", filter: grey ? `saturate(${1 - grey}) brightness(${1 - 0.3 * grey})` : undefined }} />
          {children}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 24, borderRadius: 18, border: `3px dashed ${C.red}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, fontFamily: F.mono, color: C.red, textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>MISSING PROOF</div>
          <div style={{ fontSize: 22, color: C.muted }}>{label}</div>
          <div style={{ fontSize: 20, color: C.muted }}>public/{src}</div>
        </div>
      )}
    </div>
  );
};

/** An amber rounded ring that draws itself on (p 0→1) around a region; use inside ImagePane for image units. */
export const Ring: React.FC<{ x: number; y: number; w: number; h: number; p: number; opacity?: number; color?: string; stroke?: number }> = ({ x, y, w, h, p, opacity = 1, color = C.accent, stroke = 4 }) => {
  const r = Math.min(14, h / 2);
  const len = 2 * (w + h);
  return (
    <svg style={{ position: "absolute", left: x - stroke, top: y - stroke, overflow: "visible", opacity: opacity * Math.min(1, p * 3) }} width={w + stroke * 2} height={h + stroke * 2}>
      <rect x={stroke} y={stroke} width={w} height={h} rx={r} fill={`${color}14`} stroke={color} strokeWidth={stroke} strokeDasharray={len} strokeDashoffset={len * (1 - p)} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </svg>
  );
};

/** A "N lines" counter pill. */
export const CountPill: React.FC<{ value: number; unit?: string; color?: string; x?: number; y: number; right?: number; scale?: number; opacity?: number }> = ({ value, unit = "lines", color = C.red, x, y, right, scale = 1, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      right,
      top: y,
      padding: "12px 24px",
      borderRadius: 16,
      background: `${color}1F`,
      border: `2px solid ${color}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: 40,
      color,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "100% 50%",
      whiteSpace: "nowrap",
    }}
  >
    {Math.round(value)} {unit}
  </div>
);

// `repoSize` shrinks a long repo name (64px fits ~20 characters in the 860 card); `byline` adds a maker credit under it.
export const RepoCard: React.FC<{ repo: string; maker: string; stars: number; at: number; x: number; y: number; full?: boolean; countFrom?: number; countTo?: number; licence?: string; licenceP?: number; repoSize?: number; byline?: string; children?: React.ReactNode }> = ({ repo, maker, stars, at, x, y, full, countFrom, countTo, licence, licenceP = 1, repoSize = 64, byline, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, at, fps);
  const count = interpolate(f, [countFrom ?? at + 8, countTo ?? at + 50], [0, stars], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 860, opacity: p, transform: `perspective(1400px) translateY(${(1 - p) * 80}px) rotateX(${(1 - p) * 18}deg)` }}>
      <Window kind="browser" title="github.com" x={0} y={0} w={860} h={330}>
        <div style={{ padding: "34px 44px", fontFamily: F.sans, color: C.text }}>
          <div style={{ fontSize: 26, color: C.muted, fontFamily: F.mono }}>{maker} /</div>
          <div style={{ fontSize: repoSize, fontWeight: 800, letterSpacing: -1.5, marginTop: 4 }}>{repo}</div>
          {byline && <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>{byline}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: byline ? 18 : 30, fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: C.accent }}>
            <span style={{ fontSize: 40 }}>★</span>
            {full ? Math.round(count).toLocaleString("en-US") : compact(count)}
            <span style={{ fontSize: 22, color: C.muted, fontWeight: 500 }}>GitHub stars</span>
            {licence && (
              <span style={{ marginLeft: "auto", padding: "6px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)", fontSize: 22, letterSpacing: 2, color: C.text, opacity: licenceP, transform: `scale(${0.7 + 0.3 * licenceP})` }}>{licence}</span>
            )}
          </div>
        </div>
      </Window>
      {children}
    </div>
  );
};

export const Label: React.FC<{ text: string; color?: string; style?: React.CSSProperties }> = ({ text, color = C.accent, style }) => (
  <div style={{ position: "absolute", fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: 3, color, ...style }}>{text}</div>
);

export const CatchCard: React.FC<{ text: React.ReactNode; x: number; y: number; p: number }> = ({ text, x, y, p }) => (
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
// `lineAts` starts each line typing on its own frame (cue them to words); `cps` is characters per frame; `linkAt` underlines the link.
// `size` is the command font size and `w` the terminal width, for long commands (26px mono fits ~48 characters in 860).
export const InstallBar: React.FC<{ command: string; link: string; at: number; x: number; y: number; lineAts?: number[]; cps?: number; linkAt?: number; size?: number; w?: number }> = ({ command, link, at, x, y, lineAts, cps = 1.6, linkAt, size = 26, w = 860 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = pop(f, at, fps);
  const typed = lineAts
    ? command
        .split("\n")
        .map((l, i) => l.slice(0, Math.max(0, Math.floor((f - lineAts[i]) * cps))))
        .filter((l, i) => i === 0 || f >= lineAts[i])
        .join("\n")
    : command.slice(0, Math.max(0, Math.floor((f - at - 6) * cps)));
  const under = linkAt === undefined ? 0 : interpolate(f, [linkAt, linkAt + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cursorOn = Math.floor(f / 15) % 2 === 0;
  const lines = command.split("\n").length;
  const h = 110 + lines * 48;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
      <Window kind="terminal" title="claude" x={0} y={0} w={w} h={h}>
        <div style={{ padding: "26px 32px", fontFamily: F.mono, fontSize: size, lineHeight: "48px", color: C.text, whiteSpace: "pre" }}>
          {typed.split("\n").map((l, i, all) => (
            <div key={i}>
              <span style={{ color: C.accent }}>&gt; </span>
              {l}
              {i === all.length - 1 && <span style={{ opacity: cursorOn ? 1 : 0, color: C.accent }}>▍</span>}
            </div>
          ))}
        </div>
      </Window>
      <div style={{ position: "absolute", top: h + 26, width: w, textAlign: "center", fontFamily: F.mono, fontSize: 28, color: under ? C.text : C.muted }}>
        <span style={{ backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`, backgroundRepeat: "no-repeat", backgroundPosition: "0 100%", backgroundSize: `${under * 100}% 3px`, paddingBottom: 6 }}>{link}</span>
      </div>
    </div>
  );
};

/** A chat reply (reply.md) split into blocks: paragraphs and list items, blank lines dropped. */
export const chatBlocks = (md: string) =>
  md
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** The leading **bold** run of a block, with its list number ("3. **Before or after tax?**"). Cut from the real text, never retyped. */
export const boldHead = (block: string) => {
  const m = block.match(/^((?:\d+\.\s+)?\*\*[^*]+\*\*)/);
  return m ? m[1] : block;
};

/** Inline Markdown for chat lines: **bold** in white, `code` in amber mono. */
const inline = (s: string) =>
  s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith("**") ? (
      <b key={i} style={{ color: C.text, fontWeight: 700 }}>{part.slice(2, -2)}</b>
    ) : part.startsWith("`") ? (
      <span key={i} style={{ fontFamily: F.mono, fontSize: "0.9em", color: C.accent }}>{part.slice(1, -1)}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

/**
 * A chat reply shown block by block. `shown` is how many blocks are visible (the fraction fades the next one in);
 * `ring` maps a block index to a 0→1 progress that draws an amber outline around it.
 */
export const ChatPane: React.FC<{ blocks: string[]; shown?: number; size?: number; gap?: number; ring?: Record<number, number>; color?: string }> = ({ blocks, shown = Infinity, size = 26, gap = 12, ring = {}, color = "rgba(245,245,247,0.78)" }) => (
  <div style={{ position: "absolute", left: 28, right: 28, top: 22, fontFamily: F.sans, fontSize: size, lineHeight: 1.35, color }}>
    {blocks.map((b, i) => {
      const p = Math.max(0, Math.min(1, shown - i));
      if (p <= 0) return null;
      const r = ring[i] ?? 0;
      return (
        <div
          key={i}
          style={{
            marginBottom: gap,
            padding: "6px 14px",
            borderRadius: 12,
            border: `3px solid rgba(255,181,71,${r})`,
            background: `rgba(255,181,71,${0.1 * r})`,
            boxShadow: r > 0 ? `0 0 ${30 * r}px ${C.accent}44` : undefined,
            color: r > 0.5 ? C.text : undefined,
            opacity: p,
            transform: `translateY(${(1 - p) * 24}px) scale(${1 + 0.02 * r})`,
            transformOrigin: "0 50%",
          }}
        >
          {inline(b)}
        </div>
      );
    })}
  </div>
);
