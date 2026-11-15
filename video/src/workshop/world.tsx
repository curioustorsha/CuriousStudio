import React from "react";
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme";

/**
 * Claude's workshop (Claude Lab): one flat front-on stage set shared by every lesson.
 * World coordinates are the 1080 × 1920 frame at the WIDE camera. The workshop lives between
 * y 400 and 1250 (masked), so it never runs into the header or the captions.
 *
 * Fixed positions (keep them in every lesson):
 * - back wall 420–960, floor line 1180
 * - workbench (a counter) x 90–990, top at y 960
 * - Aster (the host, host.tsx) hovers behind the bench at x 640, centre y 735
 * - cabinet on the wall at the left (x 110–290), window high on the right (x 790–950)
 */

export type P2 = [number, number];
export type Cam = { x: number; y: number; z: number };

export const WS = {
  benchL: 90,
  benchR: 990,
  benchTop: 960,
  floor: 1180,
  claudeX: 640,
  headY: 585,
  headR: 58,
  bodyTop: 650,
  bodyW: 220,
};

export const COL = {
  sand: "#E8DCC8",
  sandDark: "#C9B79C",
  cream: "#F3EBDD",
  ink: "#2A2620",
  benchTop: "#4A4038",
  benchFront: "#2E2925",
  benchLine: "#3B342E",
  paper: "#B9BDC6",
  paperDark: "#8D929C",
  steel: "#5A5F69",
  steelDark: "#40444C",
};

// Cameras: focus point + zoom. The focus lands at the centre of the main area (540, 825).
export const WIDE: Cam = { x: 540, y: 825, z: 1 };
export const BENCH: Cam = { x: 560, y: 850, z: 1.12 };
export const WALL: Cam = { x: 520, y: 770, z: 1.05 };

export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });

// Motion helpers that take an explicit frame, so a scene can be drawn at any frame (covers, loop frames).
export const ez = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) });
export const sp = (f: number, at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  f < at ? 0 : spring({ frame: f - at, fps: FPS, config: { damping: 18, stiffness: 160, mass: 0.9, ...cfg } });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpP = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const MASK = "linear-gradient(to bottom, transparent 400px, black 452px, black 1196px, transparent 1250px)";

/** The workshop stage: masked to the main area, camera applied to everything inside (world coordinates). */
export const Stage: React.FC<{ cam: Cam; dim?: number; children: React.ReactNode }> = ({ cam, dim = 1, children }) => (
  <div style={{ position: "absolute", inset: 0, maskImage: MASK, WebkitMaskImage: MASK, opacity: dim }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1080,
        height: 1920,
        transformOrigin: "0 0",
        transform: `translate(${540 - cam.x * cam.z}px, ${825 - cam.y * cam.z}px) scale(${cam.z})`,
      }}
    >
      {children}
    </div>
  </div>
);

/** Back wall and floor. Drawn first. */
export const Wall: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <rect x={40} y={420} width={1000} height={760} rx={10} fill="rgba(255,255,255,0.025)" />
    {/* plank lines */}
    {[520, 640, 760, 880].map((y) => (
      <line key={y} x1={40} x2={1040} y1={y} y2={y} stroke="rgba(255,255,255,0.035)" strokeWidth={2} />
    ))}
    <line x1={0} x2={1080} y1={WS.floor} y2={WS.floor} stroke="rgba(255,255,255,0.14)" strokeWidth={3} />
  </svg>
);

/** The workbench: a counter with a wooden top. Drawn after Claude, before the cards. */
export const Bench: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <rect x={WS.benchL + 14} y={WS.benchTop + 26} width={WS.benchR - WS.benchL - 28} height={WS.floor - WS.benchTop - 26} fill={COL.benchFront} />
      {[0, 1].map((k) => (
        <rect key={k} x={WS.benchL + 60 + k * 440} y={WS.benchTop + 64} width={340} height={70} rx={8} fill="none" stroke={COL.benchLine} strokeWidth={3} />
      ))}
      {[0, 1].map((k) => (
        <rect key={`h${k}`} x={WS.benchL + 200 + k * 440} y={WS.benchTop + 94} width={60} height={10} rx={5} fill={COL.benchLine} />
      ))}
      <rect x={WS.benchL} y={WS.benchTop} width={WS.benchR - WS.benchL} height={26} rx={6} fill={COL.benchTop} />
      <rect x={WS.benchL} y={WS.benchTop} width={WS.benchR - WS.benchL} height={5} rx={3} fill="rgba(255,255,255,0.08)" />
    </svg>
    {children}
  </>
);

const REST_L: P2 = [585, 880];
const REST_R: P2 = [695, 880];
/** Where a placing "hand" rests: the host points at a hand once it moves away from here. */
export const CLAUDE_REST = { left: REST_L, right: REST_R };

