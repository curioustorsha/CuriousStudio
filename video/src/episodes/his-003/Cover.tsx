import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, Kicker } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { CLOSE, R1, World, type Cam } from "./scenes/world";

// Static cover: your neighbourhood on the CLOSE camera, a little lower and larger. The Blinkit store glows,
// its territory is green, the rider pulse is halfway along the short road with its 15 km/h tag, and the
// long red road heads out of frame toward the warehouse (the long way round).
const COVER_CAM: Cam = { ...CLOSE, u: 124, sy: 900 };

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <World
      cam={COVER_CAM}
      terr={(k) => (k === 0 ? 1 : 0)}
      homeLit={(k) => (k === 0 ? 1 : 0)}
      store={(k) => ({ rise: k === 0 ? 1 : 0, glow: k === 0 ? 1 : 0 })}
      r0={{ progress: 1, opacity: 0.7, dashed: true }}
      rider={{ points: R1, t: 0.5, load: 1, moving: 1, tag: { text: "15 km/h", p: 1, scale: 1.7 } }}
    />
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <Kicker text="HOW IT SCALES" />
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 150, lineHeight: 0.95, letterSpacing: -6, color: C.text, textAlign: "center" }}>
        Only <span style={{ color: C.accent }}>15 km/h</span>
      </div>
    </div>
    <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={120} />
    </div>
  </AbsoluteFill>
);
