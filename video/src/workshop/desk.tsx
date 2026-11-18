import React from "react";
import { C, F } from "../theme";
import { COL, ez, lerp, WS } from "./world";

/**
 * Lesson 3 objects (the context window). Metaphor sheet rows: Context window, A message on the desk,
 * A file you share, How full the desk is.
 * - The desk: a fixed amber outline on the workbench (x 150–930, bench top 960 up to 680), heavy corner brackets,
 *   mono `CONTEXT WINDOW` tag on its top-left edge. It never changes size or moves.
 * - Slabs: a front-on pile on the left of the desk. Dark with an amber edge = you, cream = Claude, grey = a file.
 * - The ruler up the desk's right edge: top mark `1M TOKENS`, an amber marker at the pile's level.
 */

export const DESK = { l: 150, r: 930, top: 680, bottom: WS.benchTop };
export const DESK_W = DESK.r - DESK.l;
export const DESK_H = DESK.bottom - DESK.top;
export const PILE = { x: 180, w: 290 };
export const RULER_X = 900;
const TAG = { x: 168, y: DESK.top };

const AMBER = C.accent;

/** The desk outline. `draw` 0→1 draws it on (corners snap in last); `lock` 0→1 locks the corners; `ghost` 0→1→0 a dashed copy stretching outward. */
export const Desk: React.FC<{
  draw?: number;
  glow?: number;
  outsideDim?: number;
  lock?: number;
  ghost?: number;
  tag?: number;
  opacity?: number;
}> = ({ draw = 1, glow = 0, outsideDim = 0, lock = 0, ghost = 0, tag = 1, opacity = 1 }) => {
  if (draw <= 0.001 && outsideDim <= 0.001) return null;
  const { l, r, top, bottom } = DESK;
  const path = `M ${l} ${bottom} L ${l} ${top} L ${r} ${top} L ${r} ${bottom} Z`;
  const corners = ez(draw, 0.82, 1);
  const B = 46;
  const bw = 12 + 4 * lock;
  const g = ghost * 46;
  const cornerPts: [number, number, number, number][] = [
    [l, top, 1, 1],
    [r, top, -1, 1],
    [r, bottom, -1, -1],
    [l, bottom, 1, -1],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {outsideDim > 0 && (
          <path
            d={`M 0 380 H 1080 V 1270 H 0 Z M ${l} ${top} V ${bottom} H ${r} V ${top} Z`}
            fillRule="evenodd"
            fill="#07080C"
            opacity={0.62 * outsideDim}
          />
        )}
        {draw > 0.001 && (
          <>
            <rect x={l} y={top} width={r - l} height={bottom - top} fill={AMBER} opacity={0.035 + 0.05 * glow} />
            {glow > 0 && <path d={path} fill="none" stroke={AMBER} strokeWidth={18} opacity={0.22 * glow} strokeLinejoin="round" />}
            <path d={path} fill="none" stroke={AMBER} strokeWidth={5} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinejoin="round" opacity={0.9} />
            {corners > 0 &&
              cornerPts.map(([x, y, sx, sy], i) => {
                const k = 0.4 + 0.6 * corners;
                return (
                  <g key={i} opacity={corners}>
                    <polyline
                      points={`${x + sx * B * k} ${y} ${x} ${y} ${x} ${y + sy * B * k}`}
                      fill="none"
                      stroke={AMBER}
                      strokeWidth={bw}
                      strokeLinecap="square"
                    />
                    {lock > 0 && <rect x={x + sx * 10 - 7} y={y + sy * 10 - 7} width={14} height={14} rx={3} fill={COL.cream} opacity={lock} />}
                  </g>
                );
              })}
            {ghost > 0.01 && (
              <rect x={l - g} y={top - g * 0.6} width={r - l + 2 * g} height={bottom - top + g * 0.6} fill="none" stroke={AMBER} strokeWidth={3} strokeDasharray="14 12" opacity={0.7 * Math.min(1, ghost * 2)} />
            )}
          </>
        )}
      </svg>
      {draw > 0.001 && tag > 0 && (
        <div
          style={{
            position: "absolute",
            left: TAG.x,
            top: TAG.y,
            transform: "translateY(-50%)",
            opacity: Math.min(1, tag * 1.5) * Math.min(1, draw * 2),
            padding: "6px 14px",
            borderRadius: 8,
            background: "#0E1016",
            border: `2px solid ${AMBER}`,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 2,
            color: AMBER,
            whiteSpace: "nowrap",
          }}
        >
          CONTEXT WINDOW
        </div>
      )}
    </div>
  );
};
/** Where the desk's tag sits (so a chip can fly into it). */
export const DESK_TAG = { x: TAG.x + 108, y: TAG.y };

/** A shared file: a grey document with a folded corner and a mono name tag. Bottom-left at (x, y). */
export const FileDoc: React.FC<{ x: number; y?: number; w?: number; h?: number; opacity?: number; scale?: number; rot?: number; name?: string }> = ({
  x,
  y = WS.benchTop + 2,
  w = 150,
  h = 186,
  opacity = 1,
  scale = 1,
  rot = 0,
  name = "REPORT.pdf",
}) => {
  const fold = 36;
  return (
    <div style={{ position: "absolute", left: x, top: y - h, width: w, height: h, opacity, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: "50% 100%" }}>
      <svg width={w} height={h + 8} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={`M 0 8 L ${w - fold} 8 L ${w} ${fold + 8} L ${w} ${h + 8} L 0 ${h + 8} Z`} fill="rgba(0,0,0,0.28)" />
        <path d={`M 0 0 L ${w - fold} 0 L ${w} ${fold} L ${w} ${h} L 0 ${h} Z`} fill={COL.paper} />
        <path d={`M ${w - fold} 0 L ${w - fold} ${fold} L ${w} ${fold} Z`} fill={COL.paperDark} />
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={18} y={30 + k * 20} width={(k === 0 ? 0.5 : k % 2 ? 0.78 : 0.68) * (w - 36)} height={8} rx={4} fill="rgba(42,38,32,0.28)" />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 12,
          padding: "5px 0",
          borderRadius: 6,
          background: "#2A2E38",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: 1,
          color: COL.cream,
          textAlign: "center",
        }}
      >
        {name}
      </div>
    </div>
  );
};

/** Claude's reply: a cream card with grey text lines. Amber while it's being written. Bottom-left at (x, y). */
export const ReplyCard: React.FC<{ x: number; y?: number; w?: number; amber?: boolean; opacity?: number; scale?: number }> = ({
  x,
  y = WS.benchTop + 2,
  w = 214,
  amber = false,
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - 124,
      width: w,
      height: 124,
      borderRadius: 14,
      background: amber ? AMBER : COL.cream,
      boxSizing: "border-box",
      padding: "12px 16px",
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: "50% 100%",
      boxShadow: "0 8px 0 rgba(0,0,0,0.28)",
    }}
  >
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 17, letterSpacing: 2, color: amber ? "#5A3A08" : "#6B655C" }}>CLAUDE</div>
    {[0.92, 0.78, 0.6].map((ww, k) => (
      <div key={k} style={{ marginTop: k ? 10 : 12, width: `${ww * 100}%`, height: 10, borderRadius: 5, background: amber ? "rgba(26,20,8,0.35)" : "rgba(42,38,32,0.3)" }} />
    ))}
  </div>
);

export type SlabKind = "file" | "you" | "claude";

/** The running pile of this lesson: a report (3 page slabs), then Q1 A1 Q2 A2 … */
export const PILE_KINDS = (n: number): SlabKind[] =>
  Array.from({ length: n }).map((_, i) => (i < 3 ? "file" : (i - 3) % 2 === 0 ? "you" : "claude"));
export const slabTag = (i: number) => (i < 3 ? "REPORT" : `${(i - 3) % 2 === 0 ? "Q" : "A"}${Math.floor((i - 3) / 2) + 1}`);

const slabH = (thin: number) => lerp(12, 5, thin);
const slabGap = (thin: number) => lerp(2, 1.5, thin);
/** y of the top of a pile of n slabs. */
export const pileTop = (n: number, thin = 0) => DESK.bottom - n * (slabH(thin) + slabGap(thin));
/** 0→1 how full the desk is for a pile of n slabs. */
export const pileLevel = (n: number, thin = 0) => (DESK.bottom - pileTop(n, thin)) / DESK_H;

/**
 * The pile of slabs. `lands[i]` 0→1 brings slab i in (you: from the left, Claude: from Aster, file: drops).
 * `bright[i]` lights a slab (read sweep). `tagAt` shows the tag of that slab beside the pile.
 */
export const Pile: React.FC<{
  lands: number[];
  thin?: number;
  bright?: number[];
  opacity?: number;
  dx?: number;
  tagAt?: number;
  tagP?: number;
  teeter?: number;
}> = ({ lands, thin = 0, bright = [], opacity = 1, dx = 0, tagAt = -1, tagP = 0, teeter = 0 }) => {
  const kinds = PILE_KINDS(lands.length);
  const h = slabH(thin);
  const step = h + slabGap(thin);
  const x0 = PILE.x + dx;
  const last = lands.length - 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {lands.map((p, i) => {
          if (p <= 0.001) return null;
          const k = kinds[i];
          const q = Math.min(1, p);
          const y = DESK.bottom - (i + 1) * step;
          const ox = k === "you" ? -(1 - q) * 320 : k === "claude" ? (1 - q) * 300 : 0;
          const oy = k === "file" ? -(1 - q) * 160 : k === "claude" ? -(1 - q) * 120 : 0;
          const b = bright[i] ?? 0;
          const fill = k === "file" ? (i % 2 ? COL.paperDark : COL.paper) : k === "you" ? "#1E222C" : COL.cream;
          const rot = i === last ? teeter : 0;
          const cx = x0 + PILE.w / 2;
          return (
            <g key={i} opacity={Math.min(1, p * 3)} transform={`translate(${ox} ${oy}) rotate(${rot} ${cx} ${y + h})`}>
              <rect x={x0 + (i % 3) * 3 - 3} y={y} width={PILE.w} height={h} rx={Math.min(3, h / 2)} fill={fill} />
              {k === "you" && <rect x={x0 + (i % 3) * 3 - 3} y={y} width={PILE.w} height={h} rx={Math.min(3, h / 2)} fill="none" stroke={AMBER} strokeWidth={Math.min(2.5, h / 3)} />}
              {b > 0 && <rect x={x0 + (i % 3) * 3 - 7} y={y - 2} width={PILE.w + 8} height={h + 4} rx={4} fill="#F5F5F7" opacity={0.45 * b} />}
            </g>
          );
        })}
      </svg>
      {tagAt >= 0 && tagAt < lands.length && tagP > 0 && (
        <div
          style={{
            position: "absolute",
            left: x0 + PILE.w + 14,
            top: DESK.bottom - (tagAt + 1) * step + h / 2,
            transform: `translateY(-50%) scale(${0.7 + 0.3 * tagP})`,
            transformOrigin: "0 50%",
            opacity: Math.min(1, tagP * 1.5),
            padding: "3px 10px",
            borderRadius: 7,
            background: "rgba(14,16,22,0.92)",
            border: `2px solid ${kinds[tagAt] === "you" ? AMBER : "rgba(255,255,255,0.25)"}`,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 1,
            color: kinds[tagAt] === "you" ? AMBER : C.text,
            whiteSpace: "nowrap",
          }}
        >
          {slabTag(tagAt)}
        </div>
      )}
    </div>
  );
};

/** The ruler up the desk's right edge. `draw` 0→1 grows it upward; `level` 0→1 where the amber marker sits; a dashed line joins it to the pile. */
export const DeskRuler: React.FC<{ draw: number; level?: number; levelP?: number; label?: number; opacity?: number }> = ({
  draw,
  level = 0,
  levelP = 0,
  label = 1,
  opacity = 1,
}) => {
  if (draw <= 0.001) return null;
  const x = RULER_X;
  const y0 = DESK.bottom;
  const y1 = lerp(y0, DESK.top, draw);
  const ly = DESK.bottom - level * DESK_H;
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <rect x={x - 4} y={y1} width={8} height={y0 - y1} rx={3} fill="#C9CDD4" opacity={0.85} />
        {Array.from({ length: 11 }).map((_, k) => {
          const ty = y0 - (k / 10) * DESK_H;
          if (ty < y1 - 0.5) return null;
          const big = k % 5 === 0;
          return <rect key={k} x={x - (big ? 26 : 16)} y={ty - 2} width={big ? 26 : 16} height={4} rx={2} fill="#C9CDD4" />;
        })}
        {levelP > 0 && (
          <g opacity={levelP}>
            <line x1={PILE.x + PILE.w + 6} x2={x - 30} y1={ly} y2={ly} stroke={AMBER} strokeWidth={3} strokeDasharray="10 9" opacity={0.75} />
            <polygon points={`${x - 30},${ly} ${x - 50},${ly - 13} ${x - 50},${ly + 13}`} fill={AMBER} />
          </g>
        )}
      </svg>
      {draw > 0.95 && label > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 24,
            top: DESK.top - 46,
            transform: "translateX(-100%)",
            opacity: Math.min(1, label * 1.5) * ez(draw, 0.95, 1),
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 2,
            color: C.text,
            whiteSpace: "nowrap",
          }}
        >
          1M TOKENS
        </div>
      )}
    </div>
  );
};

/** One plank shelf high on the wall (holds the small paper mountain in Lesson 3). */
export const WallShelf: React.FC<{ x?: number; y?: number; w?: number; opacity?: number }> = ({ x = 140, y = 655, w = 240, opacity = 1 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
    <rect x={x + 26} y={y + 10} width={10} height={34} rx={3} fill={COL.steelDark} />
    <rect x={x + w - 36} y={y + 10} width={10} height={34} rx={3} fill={COL.steelDark} />
    <rect x={x} y={y} width={w} height={14} rx={4} fill={COL.benchTop} />
    <rect x={x} y={y} width={w} height={4} rx={2} fill="rgba(255,255,255,0.08)" />
  </svg>
);

/** A faint cloth-swipe arc sweeping right → left over the desk (`p` 0→1), stopping short, then struck through (`strike`). */
export const SwipeArc: React.FC<{ p: number; strike?: number; x0?: number; x1?: number; y?: number; opacity?: number }> = ({ p, strike = 0, x0 = 900, x1 = 520, y = 860, opacity = 1 }) => {
  if (p <= 0.001) return null;
  const xe = lerp(x0, x1, p);
  const mid = (x0 + xe) / 2;
  const sag = 70 * Math.min(1, p * 1.5);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity, overflow: "visible" }}>
      <path d={`M ${x0} ${y - 50} Q ${mid} ${y + sag} ${xe} ${y - 50}`} fill="none" stroke="rgba(245,245,247,0.28)" strokeWidth={44} strokeLinecap="round" />
      <path d={`M ${x0} ${y - 50} Q ${mid} ${y + sag} ${xe} ${y - 50}`} fill="none" stroke="rgba(245,245,247,0.5)" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 14" />
      {strike > 0 && (
        <line x1={x1 - 10} y1={y - 110} x2={lerp(x1 - 10, x0 + 10, strike)} y2={lerp(y - 110, y + 70, strike)} stroke="#C9CDD4" strokeWidth={10} strokeLinecap="round" />
      )}
    </svg>
  );
};

/**
 * A plain flat book (no cover art): slate cover with a cream title. `open` 0→1 opens it into one big page of grey lines;
 * line `hit` turns amber with `hitP`; `read` (a line index, float) moves a read-light down the page; `lens` 0→1 snaps a ring onto the hit line.
 * Bottom-centre at (cx, y).
 */
export const Book: React.FC<{
  cx: number;
  y?: number;
  drop?: number;
  open?: number;
  hit?: number;
  hitP?: number;
  read?: number;
  lens?: number;
  title?: string[];
  opacity?: number;
}> = ({ cx, y = WS.benchTop + 2, drop = 1, open = 0, hit = 7, hitP = 0, read = -1, lens = 0, title = ["THE GREAT", "GATSBY"], opacity = 1 }) => {
  const dy = -(1 - Math.min(1, drop)) * 260;
  const cw = 190;
  const ch = 240;
  const pw = 380;
  const ph = 252;
  const LINES = 10;
  const lineY = (k: number) => y - ph + 30 + k * 21.5;
  const closed = 1 - ez(open, 0, 0.5);
  const page = ez(open, 0.3, 1);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: opacity * Math.min(1, drop * 3), transform: `translateY(${dy}px)` }}>
      {closed > 0.01 && (
        <div style={{ position: "absolute", left: cx - cw / 2, top: y - ch, width: cw, height: ch, opacity: closed, transform: `scaleX(${0.4 + 0.6 * closed})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "6px 12px 12px 6px", background: COL.steelDark, boxShadow: "0 8px 0 rgba(0,0,0,0.3)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, borderRadius: "6px 0 0 6px", background: "#33363D" }} />
          <div style={{ position: "absolute", left: 30, right: 12, top: 50, fontFamily: F.sans, fontWeight: 900, fontSize: 30, lineHeight: 1.05, letterSpacing: -0.5, color: COL.cream }}>
            {title.map((t) => (
              <div key={t}>{t}</div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 34, height: 4, borderRadius: 2, background: "rgba(243,235,221,0.4)" }} />
        </div>
      )}
      {page > 0.01 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: Math.min(1, page * 2) }}>
          <g transform={`translate(${cx} ${y}) scale(${0.5 + 0.5 * page} 1) translate(${-cx} ${-y})`}>
            <rect x={cx - pw / 2} y={y - ph + 8} width={pw} height={ph} rx={10} fill="rgba(0,0,0,0.3)" />
            <rect x={cx - pw / 2} y={y - ph} width={pw} height={ph} rx={10} fill={COL.cream} />
            {Array.from({ length: LINES }).map((_, k) => {
              const isHit = k === hit && hitP > 0;
              const w = [0.88, 0.94, 0.8, 0.9, 0.86, 0.92, 0.7, 0.9, 0.84, 0.6][k] * (pw - 50);
              const lit = read >= 0 && Math.abs(read - k) < 0.6;
              return (
                <rect key={k} x={cx - pw / 2 + 25} y={lineY(k)} width={w} height={10} rx={5} fill={isHit ? AMBER : lit ? "rgba(42,38,32,0.6)" : "rgba(42,38,32,0.26)"} opacity={isHit ? 0.4 + 0.6 * hitP : 1} />
              );
            })}
            {read >= 0 && read < LINES && (
              <rect x={cx - pw / 2 + 8} y={lineY(read) - 9} width={pw - 16} height={28} rx={8} fill="rgba(245,245,247,0.0)" stroke="rgba(42,38,32,0.45)" strokeWidth={3} />
            )}
          </g>
          {lens > 0.01 && (
            <g transform={`translate(${cx + 10} ${lineY(hit) + 5}) scale(${0.6 + 0.4 * Math.min(1.1, lens)})`} opacity={Math.min(1, lens * 2)}>
              <line x1={52} y1={30} x2={100} y2={62} stroke="#C9CDD4" strokeWidth={16} strokeLinecap="round" />
              <ellipse rx={92} ry={36} fill="rgba(255,181,71,0.08)" stroke="#C9CDD4" strokeWidth={9} />
            </g>
          )}
        </svg>
      )}
    </div>
  );
};
