import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../theme";
import { Backdrop, Kicker } from "../lib";
import { KEY, Shelf, SHELF_W } from "./Shelf";
import { LogoMark, Wordmark } from "../brand";

// Static cover / thumbnail for the Short.
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <Kicker text="HOW IT SCALES" />
      <div
        style={{
          fontFamily: F.sans,
          fontWeight: 900,
          fontSize: 104,
          lineHeight: 1,
          letterSpacing: -4,
          color: C.text,
          textAlign: "center",
          padding: "0 120px",
        }}
      >
        Why Amazon's warehouses are <span style={{ color: C.accent, whiteSpace: "nowrap" }}>a mess</span>
      </div>
    </div>

    <div style={{ position: "absolute", left: (1080 - SHELF_W) / 2, top: 640, filter: "brightness(0.6) blur(1.5px)" }}>
      <Shelf popStart={-100} glow={(i) => (i === KEY.phone || i === KEY.cookbook || i === KEY.dog ? 0.6 : 0)} />
    </div>

    <div style={{ position: "absolute", top: 930, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "26px 48px",
          border: `10px solid ${C.accent}`,
          borderRadius: 32,
          color: C.accent,
          fontFamily: F.sans,
          fontWeight: 900,
          fontSize: 112,
          letterSpacing: -4,
          lineHeight: 1,
          transform: "rotate(-5deg)",
          background: "rgba(7,8,12,0.7)",
          boxShadow: "0 0 100px rgba(255,181,71,0.4)",
          textShadow: "0 0 40px rgba(255,181,71,0.5)",
        }}
      >
        ON PURPOSE.
      </div>
    </div>

    <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      <LogoMark size={96} />
      <Wordmark size={72} />
    </div>
  </AbsoluteFill>
);
