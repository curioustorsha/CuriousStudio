import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop } from "../../engine/kit";
import { Wordmark } from "../../brand";
import { CITY, JAM, jamPhones, trafficPhones, World } from "../his-007/scenes/world";

// Static cover: the Maps city with the jam ahead in red, the Curiously wordmark on top and the cover text.
// (The storyboard also asked for the HIS-003 rider in the foreground; it lives in a different world, so it is left out.)
const F0 = 40;

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <div style={{ position: "absolute", inset: 0, transform: "translateY(140px)" }}>
      <World
        cam={CITY}
        route={{ progress: 1, opacity: 1 }}
        seg={(i) => (i >= JAM[0] && i <= JAM[1] ? { tint: 1, on: 0.95, glow: 0.6 } : { tint: 0, on: 0.75 })}
        you={{ label: 1, ring: 1 }}
        goog={{ glow: 0.6, rack: 1 }}
        phones={[...trafficPhones(F0), ...jamPhones(F0, 1)]}
      />
    </div>
    <div style={{ position: "absolute", top: 190, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <Wordmark size={96} />
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 140, lineHeight: 0.95, letterSpacing: -5, color: C.text, textAlign: "center" }}>
        Behind your
        <br />
        <span style={{ color: C.accent }}>screen</span>
      </div>
    </div>
  </AbsoluteFill>
);
