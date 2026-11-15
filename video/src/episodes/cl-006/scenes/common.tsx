import React from "react";
import { C } from "../../../theme";
import { Header, Title } from "../../../engine/kit";
import { LessonKicker } from "../../../logos";
import { cardW } from "../../../workshop";

export const KICK = "LESSON 2 · TOKENS";

/** Kicker (no Claude mark, per the playbook) + the scene title. */
export const LessonHeader: React.FC<{ title: React.ReactNode; opacity?: number }> = ({ title, opacity = 1 }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <Header>
      <LessonKicker text={KICK} mark={false} />
      <Title size={80}>{title}</Title>
    </Header>
  </div>
);

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.accent }}>{children}</span>;

/** The running example of this lesson: the cream "strawberry" word card in the middle of the bench. */
export const STRAW = { text: "strawberry", size: 44 };
export const STRAW_W = cardW(STRAW.text, STRAW.size);
export const STRAW_X = 540 - STRAW_W / 2;

/** A short decaying shiver starting at `at`. */
export const shiver = (f: number, at: number, amp = 5, len = 14) => (f >= at && f < at + len ? Math.sin((f - at) * 2.4) * amp * (1 - (f - at) / len) : 0);
