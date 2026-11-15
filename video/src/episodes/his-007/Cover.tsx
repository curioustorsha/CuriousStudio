import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../theme";
import { Backdrop, Kicker } from "../../engine/kit";
import { LogoMark } from "../../brand";
import { hookSeg } from "./scenes/Hook";
import { cartMid, JAM, jamPhones, trafficPhones, World, type Cam, type CartState, type P2, type Ping } from "./scenes/world";

// Static cover: tight on the red jam in front of Google's block. The handcart parked on the red stretch with
// its 99 glowing phones, pings arcing up to the Maps pin, and your amber route leading in from the left.
const COVER_CAM: Cam = { fx: 7.4, fy: 5.6, u: 62, sx: 520, sy: 930 };
const F0 = 40;
const CART: CartState = { path: [[5.4, 5.25], [11.2, 5.25]], d: 2.9, lit: 99 };

export const Cover: React.FC = () => {
  const jp = jamPhones(F0, 1);
  const cm = cartMid(CART);
  const pings: Ping[] = [
    ...jp.filter((_, k) => k % 2 === 0).map((p, k) => ({ from: [p.x, p.y] as P2, t: 0.35 + k * 0.12 })),
    { from: cm, t: 0.5 },
    { from: cm, t: 0.78 },
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <World
        cam={COVER_CAM}
        route={{ progress: 1, opacity: 1 }}
        seg={(i) => {
          const s = hookSeg(F0, 0, 1)(i);
          return i >= JAM[0] && i <= JAM[1] ? { ...s, glow: 0.6 } : s;
        }}
        you={{ opacity: 0 }}
        goog={{ glow: 0.7, rack: 1 }}
        phones={[...trafficPhones(F0), ...jp]}
        pings={pings}
        cart={CART}
      />
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Kicker text="HOW IT SCALES" />
        <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 140, lineHeight: 0.95, letterSpacing: -5, color: C.text, textAlign: "center" }}>
          Phones spot <span style={{ color: C.red }}>jams</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 160, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <LogoMark size={120} />
      </div>
    </AbsoluteFill>
  );
};
