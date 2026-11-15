import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, Kicker } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { berth, crowd, RES, World, type Cam } from "./scenes/world";

// Static cover: the district at 10:00, the amber flood converging on the gate from every neighbourhood, the clock
// lit, IRCTC's sign glowing and the seat grid flashing amber at the back.
const COVER_CAM: Cam = { fx: 6.8, fy: 6.6, u: 50, sx: 520, sy: 960 };
const F0 = 400;

export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <World
      cam={COVER_CAM}
      clock={{ time: "10:00" }}
      hall={{ glow: 0.8, rack: 1, wire: 1 }}
      gate={{ glow: 0.6 }}
      res={{ glow: 0.4, seat: (i) => ((berth(RES, i).col + berth(RES, i).row) % 3 === 0 ? { color: C.accent } : null) }}
      pulses={crowd(F0, 0, { queue: true, n: 40, every: 1.5, speed: 0.15 })}
    />
    <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <Kicker text="HOW IT SCALES" />
      <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 150, lineHeight: 0.95, letterSpacing: -5, color: C.text, textAlign: "center" }}>
        Tatkal at <span style={{ color: C.accent }}>10</span>
      </div>
    </div>
    <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <LogoMark size={120} />
    </div>
  </AbsoluteFill>
);
