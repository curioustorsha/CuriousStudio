import React from "react";
import { C } from "../../../theme";
import { Header, Title } from "../../../engine/kit";
import { LessonKicker } from "../../../logos";
import { rowWidth, sp, tileXs, WS } from "../../../workshop";

export const KICK = "LESSON 3 · THE CONTEXT WINDOW";

/** Kicker (no Claude mark, per the playbook; Anthropic's wordmark joins it when Anthropic is named) + the scene title. */
export const LessonHeader: React.FC<{ title: React.ReactNode; opacity?: number; anthropic?: number; size?: number }> = ({ title, opacity = 1, anthropic = 0, size = 76 }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <Header>
      <LessonKicker text={KICK} mark={false} anthropic={anthropic} />
      <div style={{ whiteSpace: "nowrap" }}>
        <Title size={size}>{title}</Title>
      </div>
    </Header>
  </div>
);

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.accent }}>{children}</span>;

/** A short decaying shiver starting at `at`. */
export const shiver = (f: number, at: number, amp = 5, len = 14) => (f >= at && f < at + len ? Math.sin((f - at) * 2.4) * amp * (1 - (f - at) / len) : 0);

// Lesson 2's question, cut into tiles (callback → desk → notpaper).
export const T_SIZE = 30;
export const Q_TILES = ["Why", "is", "the", "sky", "blue", "?"];
export const Q_X = tileXs(Q_TILES, 560 - rowWidth(Q_TILES, 10, T_SIZE) / 2, 10, T_SIZE);
const CLOUD_DY = [-150, -205, -130, -190, -140, -200];
const CLOUD_DX = [-30, -10, 10, -6, 16, 34];
/** Where tile i floats while it has nowhere to sit (g = global frame, for a drift that carries across scenes). */
export const cloudPos = (i: number, g: number): [number, number] => [
  Q_X[i] + CLOUD_DX[i] + Math.sin(g * 0.06 + i * 1.7) * 7,
  WS.benchTop + 2 + CLOUD_DY[i] + Math.sin(g * 0.05 + i) * 9,
];

/** Pile timeline: how many slabs are on the desk at the end of each scene. */
export const N_PILE = 9; // report ×3 + Q1 A1 Q2 A2 Q3 A3
export const N_KEEPS = 11; // + Q4 A4
export const N_FIXED = 17; // + 3 quick pairs
export const N_FULL = 43; // the desk is full (thin slabs)

/** Slabs all landed. */
export const landed = (n: number) => Array.from({ length: n }).map(() => 1);
/** A slab landing with a small settle. */
export const slabLand = (f: number, at: number) => sp(f, at - 6, { damping: 14, stiffness: 230 });
