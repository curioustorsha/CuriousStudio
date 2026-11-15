import React from "react";
import { C } from "../../../theme";
import { Header, Title } from "../../../engine/kit";
import { LessonKicker } from "../../../logos";

// placingHands now lives in the shared workshop (Lesson 2 reuses it); re-exported so Lesson 1's scenes are unchanged.
export { placingHands } from "../../../workshop";

export const KICK = "LESSON 1 · WHAT CLAUDE IS";

/** Kicker (Claude mark, Anthropic joins on its word) + the scene title. */
export const LessonHeader: React.FC<{ title: React.ReactNode; anthropic?: number; opacity?: number }> = ({ title, anthropic = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    <Header>
      <LessonKicker text={KICK} anthropic={anthropic} />
      <Title size={80}>{title}</Title>
    </Header>
  </div>
);

export const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => <span style={{ color: C.accent }}>{children}</span>;
