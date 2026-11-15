import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, IsoLabel, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { GoogleMapsLogo } from "../../../logos";
import { camPoint, CART_LANE, cartMid, Chip, CLOSE, CLOSE_WIDE, LANE_PIECES, mixCam, PIECES, useMove, World, type CartState } from "./world";

/** Where the cart's walker is at scene-local frame f: rolls in from the left at a steady walk. */
export const cartD = (f: number, D: number) => 0.2 + (f / D) * 8.8;

/**
 * Berlin, 2020: a walker pulls a handcart of 99 second-hand phones along the empty lane by the park.
 * On "ninety-nine" the phones light up in a wave; on "turned red" every stretch it has passed flips red.
 */
export const Cart: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tBerlin = wf("cart", "berlin");
  const tNinety = wf("cart", "ninety");
  const tHand = wf("cart", "handcart");
  const tMaps = wf("cart", "maps");
  const tTurned = wf("cart", "turned");
  const tRed = wf("cart", "red");

  const pull = useMove(tTurned - 4, 34);
  const cam = mixCam(CLOSE, CLOSE_WIDE, pull);

  const d = cartD(frame, D);
  const lit = 99 * ease(frame, tNinety, tNinety + 26);
  const cart: CartState = { path: CART_LANE, d, lit };
  const m = cartMid(cart);

  // Each lane stretch flips green → amber → red once "turned red" is said, one after another,
  // and only once the cart has passed it.
  const lanePieces = [...LANE_PIECES].sort((a, b) => PIECES[a].m[0] - PIECES[b].m[0]);
  const tint = (pi: number) => {
    const k = lanePieces.indexOf(pi);
    if (k < 0) return null;
    const p = PIECES[pi];
    // frame at which the cart's rear (0.9 behind the walker at x = 0.4 + d) passes this piece's far end
    const passF = ((p.b[0] + 0.5 - 0.2) / 8.8) * D;
    const start = Math.max(tTurned + k * 4, passF + 8);
    const r = frame >= tTurned - 2 ? ease(frame, start, start + 16) : 0;
    return { tint: r, on: 0.75, glow: r > 0.95 ? 0.4 : 0 };
  };

  const pCount = useIn(tNinety - 2, { damping: 12, stiffness: 200 });
  const pHand = ease(frame, tHand, tHand + 10);
  const pMaps = useIn(tMaps - 2, { damping: 11, stiffness: 210 });
  const mapsOut = ease(frame, tRed + 30, tRed + 42);
  const mapsAt = camPoint(cam, 3.1, 7.5, 0);
  const mapsLift = 110 * (cam.u / CLOSE.u);

  return (
    <>
      <Sfx name="cart" at={0} volume={0.55} dur={120} />
      <Sfx name="cart" at={118} volume={0.55} dur={120} />
      <Sfx name="cart" at={236} volume={0.5} dur={Math.max(1, D - 236)} />
      <Sfx name="ticker" at={tNinety} volume={0.22} dur={26} />
      <Sfx name="pop" at={tMaps - 2} volume={0.35} />
      <Sfx name="thud" at={tRed} volume={0.32} />

      <Header>
        <Reveal at={0}>
          <Kicker text="BERLIN · 2020" />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            <span style={{ color: C.accent }}>99 phones</span>, one handcart
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        route={{ progress: 1, opacity: 0 }}
        you={{ opacity: 0 }}
        tint={tint}
        cart={cart}
        overlay={
          <>
            <Chip x={m[0]} y={m[1]} z={0.3} text={`${Math.round(lit)}`} color={C.accent} size={34} p={frame >= tNinety - 2 ? pCount : 0} lift={70 * (cam.u / CLOSE.u) + 20} />
            {pHand > 0.01 && <IsoLabel x={m[0]} y={m[1] + 0.6} z={0} text="HANDCART" color={C.text} opacity={pHand} lift={-30} size={24} />}
          </>
        }
      />

      {/* Google Maps chip over the lane behind the cart */}
      {frame >= tMaps - 2 && (
        <div
          style={{
            position: "absolute",
            left: mapsAt.x - 200,
            top: mapsAt.y - mapsLift - 40,
            width: 400,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(1, pMaps * 1.5) * (1 - mapsOut),
            transform: `scale(${0.6 + 0.4 * Math.min(1, pMaps)})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 10px 12px", borderRadius: 999, background: "rgba(7,8,12,0.94)", border: `2px solid ${C.stroke}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GoogleMapsLogo height={30} />
            </div>
            <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: C.text }}>GOOGLE MAPS</span>
          </div>
        </div>
      )}

      <Source text="Simon Weckert; The Register, 2020" at={tBerlin} />
    </>
  );
};
