import React from "react";
import { C, F } from "../theme";
import { COL, ez, lerp, sp, WS, type P2 } from "./world";

/** A small mono label chip. */
export const Chip: React.FC<{ text: string; x: number; y: number; p?: number; color?: string; size?: number; opacity?: number }> = ({
  text,
  x,
  y,
  p = 1,
  color = C.text,
  size = 26,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`,
      opacity: Math.min(1, p * 1.5) * opacity,
      padding: "10px 20px",
      borderRadius: 12,
      background: "rgba(14,16,22,0.92)",
      border: `2px solid ${color === C.text ? "rgba(255,255,255,0.22)" : color}`,
      fontFamily: F.mono,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 2,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** A plain flat search box with 3 grey result rows (no brand). `fold` 0→1 folds it flat and slides it away. */
export const SearchBox: React.FC<{ blink?: number; fold?: number }> = ({ blink = 0, fold = 0 }) => {
  const sy = 1 - 0.92 * ez(fold, 0, 0.45);
  const dx = ez(fold, 0.35, 1) * -900;
  return (
    <div
      style={{
        position: "absolute",
        left: 170 + dx,
        top: 450,
        width: 740,
        transform: `scaleY(${sy})`,
        transformOrigin: "50% 50%",
        opacity: 1 - ez(fold, 0.7, 1),
        borderRadius: 24,
        background: "#1A1D26",
        border: "2px solid rgba(255,255,255,0.16)",
        padding: 26,
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ height: 64, borderRadius: 32, border: "2px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 16, padding: "0 22px" }}>
        <svg width={30} height={30} viewBox="0 0 30 30">
          <circle cx={12} cy={12} r={9} fill="none" stroke={C.muted} strokeWidth={3.5} />
          <line x1={19} y1={19} x2={27} y2={27} stroke={C.muted} strokeWidth={3.5} strokeLinecap="round" />
        </svg>
        <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: C.muted }}>Why is the sky blue?</div>
      </div>
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10, opacity: 1 - 0.6 * blink }}>
          <div style={{ width: 300 - k * 40, height: 16, borderRadius: 8, background: "rgba(245,245,247,0.32)" }} />
          <div style={{ width: 600 - k * 70, height: 12, borderRadius: 6, background: "rgba(245,245,247,0.14)" }} />
        </div>
      ))}
    </div>
  );
};

/** A tall stack of paper pages (the model's training text, packed into Claude). */
export const PaperStack: React.FC<{ x: number; drop: number; pack: number }> = ({ x, drop, pack }) => {
  const h = 260 * (1 - pack);
  const y = WS.benchTop - h - (1 - drop) * 500;
  const dx = pack * (WS.claudeX - x - 50);
  if (pack > 0.98) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: Math.min(1, drop * 3) * (1 - ez(pack, 0.7, 1)) }}>
      {Array.from({ length: 13 }).map((_, k) => {
        const ph = h / 13;
        return <rect key={k} x={x + dx + (k % 2 ? 4 : -4)} y={y + k * ph} width={110} height={Math.max(1, ph - 3)} rx={2} fill={k % 3 === 0 ? COL.paperDark : COL.paper} />;
      })}
    </svg>
  );
};

/** The mountain of paper on the back wall (training text). `grow` 0→1 stacks it up bottom-first. */
export const PaperMountain: React.FC<{ grow: number; cx?: number; base?: number }> = ({ grow, cx = 300, base = WS.benchTop + 4 }) => {
  const rows = 16;
  const shown = grow * rows;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: rows }).map((_, r) => {
        const vis = Math.max(0, Math.min(1, shown - r));
        if (vis <= 0) return null;
        const w = 400 * (1 - r / (rows + 2));
        const n = Math.max(1, Math.round(w / 64));
        const pw = w / n;
        const y = base - (r + 1) * 24 - (1 - vis) * 40;
        return (
          <g key={r} opacity={vis}>
            {Array.from({ length: n }).map((_, k) => (
              <rect
                key={k}
                x={cx - w / 2 + k * pw + ((r * 7 + k * 3) % 5) - 2}
                y={y}
                width={pw - 4}
                height={21}
                rx={2}
                fill={(r + k) % 3 === 0 ? COL.paperDark : COL.paper}
                transform={`rotate(${((r * 5 + k * 11) % 7) - 3} ${cx - w / 2 + k * pw + pw / 2} ${y + 10})`}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};

/** Small pages flowing from the paper mountain into Claude. `on` 0→1 fades the stream in. */
export const PageStream: React.FC<{ f: number; on: number; from?: P2; to?: P2 }> = ({ f, on, from = [300, 600], to = [WS.claudeX, 760] }) => {
  if (on <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: on }}>
      {Array.from({ length: 9 }).map((_, k) => {
        const t = ((f / 26 + k / 9) % 1 + 1) % 1;
        const cx = lerp(from[0], to[0], t);
        const cy = lerp(from[1], to[1], t) - Math.sin(t * Math.PI) * 120;
        const o = Math.sin(t * Math.PI);
        return <rect key={k} x={cx - 16} y={cy - 11} width={32} height={22} rx={2} fill={COL.paper} opacity={o} transform={`rotate(${(t * 140 + k * 30) % 60 - 30} ${cx} ${cy})`} />;
      })}
    </svg>
  );
};

/** A flat phone outline with a half-typed message and its 3-word suggestion bar. */
export const PhoneKeyboard: React.FC<{ f: number; rise: number; chips: number; pick: number; shrink: number }> = ({ f, rise, chips, pick, shrink }) => {
  const words = ["minute", "bit", "few"];
  const x = lerp(340, 110, shrink);
  const y = lerp(460, 860, shrink) + (1 - rise) * 500;
  const s = 1 - 0.7 * shrink;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 400,
        height: 640,
        transform: `scale(${s})`,
        transformOrigin: "0 0",
        opacity: Math.min(1, rise * 2) * (1 - ez(shrink, 0.6, 1)),
        borderRadius: 54,
        background: "#12151D",
        border: "6px solid #C9CDD4",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 150, width: 100, height: 18, borderRadius: 9, background: "#2A2E38" }} />
      {/* message bubble */}
      <div
        style={{
          position: "absolute",
          top: 90,
          right: 24,
          maxWidth: 330,
          padding: "16px 20px",
          borderRadius: "24px 24px 6px 24px",
          background: "#2A2F3B",
          fontFamily: F.sans,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: 1.2,
          color: C.text,
        }}
      >
        I'll be there in a{" "}
        {pick > 0.6 ? (
          <span style={{ color: C.accent }}>bit</span>
        ) : (
          <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: C.accent }}>|</span>
        )}
      </div>
      {/* suggestion bar */}
      <div style={{ position: "absolute", top: 300, left: 14, right: 14, height: 70, borderRadius: 14, background: "#1C2029", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
        {words.map((w, k) => {
          const p = sp(f, chips + k * 3, { damping: 12, stiffness: 220 });
          const mid = k === 1;
          const fly = mid ? ez(pick, 0, 1) : 0;
          return (
            <div
              key={w}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: mid && pick > 0 ? C.accent : "rgba(255,255,255,0.08)",
                color: mid && pick > 0 ? "#1A1408" : C.text,
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: 30,
                transform: `scale(${0.5 + 0.5 * p}) translate(${fly * 90}px, ${-fly * 190}px)`,
                opacity: Math.min(1, p * 1.5) * (mid ? 1 - ez(pick, 0.55, 0.65) : 1),
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
      {/* keys */}
      <div style={{ position: "absolute", top: 390, left: 14, right: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {[10, 9, 7].map((n, r) => (
          <div key={r} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {Array.from({ length: n }).map((_, k) => (
              <div key={k} style={{ width: 28, height: 50, borderRadius: 7, background: "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ width: 220, height: 44, borderRadius: 7, background: "rgba(255,255,255,0.1)" }} />
        </div>
      </div>
    </div>
  );
};

/** A grey filing cabinet on the wall: what Claude is NOT. `open` 0→1 lifts a ready-made answer out of the top drawer; `strike` crosses it out. */
export const Cabinet: React.FC<{ open?: number; strike?: number; opacity?: number }> = ({ open = 0, strike = 0, opacity = 1 }) => {
  const x = 110;
  const y = 600;
  const w = 180;
  const dh = 110;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {/* the stored answer card rising out of the top drawer */}
      <div
        style={{
          position: "absolute",
          left: x + 22,
          top: y + 10 - open * 120,
          width: w - 44,
          height: 120,
          borderRadius: 8,
          background: COL.cream,
          padding: "12px 14px",
          boxSizing: "border-box",
          opacity: open > 0.02 ? 1 : 0,
        }}
      >
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 15, letterSpacing: 1.5, color: "#6B655C" }}>ANSWER</div>
        {[100, 80, 92].map((ww, k) => (
          <div key={k} style={{ marginTop: 9, width: `${ww}%`, height: 8, borderRadius: 4, background: "rgba(42,38,32,0.3)" }} />
        ))}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={x} y={y} width={w} height={WS.benchTop - y} rx={10} fill={COL.steel} />
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x={x + 12} y={y + 12 + k * (dh + 8) + (k === 0 ? open * 10 : 0)} width={w - 24} height={dh} rx={6} fill={COL.steelDark} />
            <rect x={x + w / 2 - 30} y={y + 40 + k * (dh + 8) + (k === 0 ? open * 10 : 0)} width={60} height={12} rx={6} fill="#8A8F9C" />
            <rect x={x + w / 2 - 24} y={y + 62 + k * (dh + 8) + (k === 0 ? open * 10 : 0)} width={48} height={22} rx={3} fill="none" stroke="#8A8F9C" strokeWidth={2} />
          </g>
        ))}
        {strike > 0 && (
          <line x1={x - 14} y1={y + 30} x2={x - 14 + (w + 28) * strike} y2={y + 30 + 300 * strike} stroke="#C9CDD4" strokeWidth={10} strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};

export const WINDOW = { x: 790, y: 440, w: 160, h: 170 };

/** The window to the outside (web search). `open` 0→1 swings the shutters open and lets light in. */
export const WindowObj: React.FC<{ open?: number; light?: number }> = ({ open = 0, light = 0 }) => {
  const { x, y, w, h } = WINDOW;
  const half = w / 2;
  const shut = 1 - 0.82 * open;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {/* light falling in */}
      <polygon
        points={`${x},${y + h} ${x + w},${y + h} ${x + w + 40},${WS.benchTop} ${x - 160},${WS.benchTop}`}
        fill={C.cyan}
        opacity={0.07 * light}
      />
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={10} fill="#3A3F4A" />
      <rect x={x} y={y} width={w} height={h} fill={open > 0 ? `rgba(79,209,255,${0.12 + 0.3 * open})` : "#151820"} />
      {open > 0 && (
        <g opacity={open}>
          <circle cx={x + w * 0.7} cy={y + h * 0.32} r={20} fill="rgba(245,245,247,0.55)" />
          <rect x={x + 16} y={y + h * 0.62} width={60} height={16} rx={8} fill="rgba(245,245,247,0.35)" />
        </g>
      )}
      {/* shutters */}
      <rect x={x} y={y} width={half * shut} height={h} fill="#262A33" stroke="#4A505C" strokeWidth={3} />
      <rect x={x + w - half * shut} y={y} width={half * shut} height={h} fill="#262A33" stroke="#4A505C" strokeWidth={3} />
      <rect x={x - 14} y={y + h + 6} width={w + 28} height={12} rx={4} fill="#3A3F4A" />
    </svg>
  );
};

/** A web page card with a small link chip (what web search brings in). */
export const PageCard: React.FC<{ x: number; y: number; rot?: number; opacity?: number; scale?: number }> = ({ x, y, rot = 0, opacity = 1, scale = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 120,
      height: 140,
      borderRadius: 8,
      background: "#DDE3EA",
      padding: "12px 12px",
      boxSizing: "border-box",
      transform: `rotate(${rot}deg) scale(${scale})`,
      opacity,
      boxShadow: "0 8px 0 rgba(0,0,0,0.25)",
    }}
  >
    {[90, 70, 84, 60].map((ww, k) => (
      <div key={k} style={{ marginTop: k ? 8 : 0, width: `${ww}%`, height: 8, borderRadius: 4, background: "rgba(30,34,44,0.3)" }} />
    ))}
    <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: C.cyan, fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: "#06222C" }}>
      LINK
    </div>
  </div>
);

/** A big round lens: looking inside the model. Shows a small glowing dot (the planned word). */
export const Lens: React.FC<{ c: P2; p: number; dot?: number; r?: number }> = ({ c, p, dot = 0, r = 112 }) => {
  if (p <= 0.01) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${c[0]} ${c[1]}) scale(${p})`} opacity={Math.min(1, p * 1.4)}>
        <line x1={r * 0.72} y1={r * 0.72} x2={r * 1.35} y2={r * 1.35} stroke="#C9CDD4" strokeWidth={22} strokeLinecap="round" />
        <circle r={r} fill="rgba(10,12,18,0.72)" stroke="#C9CDD4" strokeWidth={14} />
        {/* faint wiring inside */}
        {[-40, 0, 40].map((yy) => (
          <line key={yy} x1={-70} x2={70} y1={yy} y2={yy} stroke="rgba(245,245,247,0.12)" strokeWidth={3} />
        ))}
        {[-40, 0, 40].map((xx) => (
          <circle key={xx} cx={xx} cy={xx === 0 ? -40 : 40} r={7} fill="rgba(245,245,247,0.3)" />
        ))}
        <circle cx={30} cy={0} r={12 + 6 * dot} fill={C.accent} opacity={0.25 + 0.75 * dot} />
        <circle cx={30} cy={0} r={(12 + 6 * dot) * 2.2} fill="none" stroke={C.accent} strokeWidth={3} opacity={0.5 * dot} />
      </g>
    </svg>
  );
};

/** A small flat toggle switch. `on` 1 = on (amber knob right), 0 = off. */
export const Toggle: React.FC<{ x: number; y: number; on: number; label?: string; opacity?: number }> = ({ x, y, on, label, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 12, opacity, transform: "translate(-50%, -50%)" }}>
    <div style={{ width: 96, height: 50, borderRadius: 25, background: on > 0.5 ? "rgba(255,181,71,0.35)" : "#2A2E38", border: "2px solid rgba(255,255,255,0.2)", position: "relative" }}>
      <div style={{ position: "absolute", top: 5, left: 5 + 46 * on, width: 36, height: 36, borderRadius: 18, background: on > 0.5 ? C.accent : "#8A8F9C" }} />
    </div>
    {label && <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: on > 0.5 ? C.text : C.muted }}>{label}</div>}
  </div>
);

/** A loop arrow that circles back over the row ("and goes again"). */
export const LoopArrow: React.FC<{ p: number; cx: number; cy: number; r?: number; opacity?: number }> = ({ p, cx, cy, r = 70, opacity = 1 }) => {
  if (p <= 0) return null;
  const a0 = -Math.PI * 0.15;
  const a1 = a0 + Math.PI * 1.6 * p;
  const pt = (a: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const tang = a1 + Math.PI / 2;
  const head = (d: number) => [x1 + Math.cos(tang + d) * 26, y1 + Math.sin(tang + d) * 26];
  const [hx1, hy1] = head(Math.PI - 0.5);
  const [hx2, hy2] = head(Math.PI + 0.5);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke="#F5F5F7" strokeWidth={8} strokeLinecap="round" />
      <polyline points={`${hx1},${hy1} ${x1},${y1} ${hx2},${hy2}`} fill="none" stroke="#F5F5F7" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
