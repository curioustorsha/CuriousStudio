import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { clamp, Sfx, useWord } from "../../../engine/kit";
import { LogoKicker } from "../../../logos";
import { ez, lerp, sp } from "../../../workshop";
import { CLOSE as FOOD_CAM, door, Parcel, R1, STORES, World as FoodWorld, type Actor } from "../../his-003/scenes/world";
import { JAM, pinTop, routeDist, ROUTE, ROUTE_LEN, trafficPhones, jamPhones, World as MapsWorld, type Cam, type SegState } from "../../his-007/scenes/world";
import { at as atDist } from "../../his-007/scenes/world";
import { BeatHeader, Burst, hopAt, LOGO_STAR, LOGO_STAR_SIZE, outAt, Ripple, SourceAt, Star, type Pt } from "./common";

/** The Maps world framed on your drive: you on the avenue (x = 5), the jam ahead on y = 5, the Google block beyond it. */
export const MAPS_CAM: Cam = { fx: 6.8, fy: 5.9, u: 70, sx: 520, sy: 850 };
/** Where the asterisk spins on "How?" and where the next scene's logo forms. */
export const CENTRE: Pt = [540, 800];

const inOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

export type HookCues = { tTap: number; tFood: number; tTen: number; tMap: number; tKnows: number; tJam: number; tBefore: number; tHow: number };

/** The floating phone card over your street: one amber Order button whose centre sits on the logo star's spot (loop). */
const PhoneCard: React.FC<{ f: number; c: HookCues; opacity: number }> = ({ f, c, opacity }) => {
  if (opacity <= 0.001) return null;
  const press = f >= c.tTap ? Math.sin(Math.min(1, (f - c.tTap) / 8) * Math.PI) : 0;
  const ordered = f >= c.tTap + 4;
  const sweep = ez(f, c.tTen, c.tMap - 4);
  const R = 15;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{ position: "absolute", left: LOGO_STAR[0] - 190, top: 470, width: 380, opacity }}>
      <div style={{ borderRadius: 30, padding: "22px 26px 26px", background: "rgba(14,16,22,0.94)", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.mono, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: C.muted, height: 30 }}>
          <span>{ordered ? "ON ITS WAY" : "YOUR ORDER"}</span>
          {ordered && (
            <svg width={36} height={36} viewBox="-18 -18 36 36">
              <circle r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
              <circle r={R} fill="none" stroke={C.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${circ * sweep} ${circ}`} transform="rotate(-90)" />
            </svg>
          )}
        </div>
        <div
          style={{
            marginTop: 14,
            height: 76,
            borderRadius: 20,
            background: press > 0.3 ? C.accent : "rgba(255,181,71,0.14)",
            border: `2px solid ${C.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: F.sans,
            fontWeight: 900,
            fontSize: 38,
            letterSpacing: -0.5,
            color: press > 0.3 ? "#1A1206" : C.accent,
            transform: `scale(${1 - 0.07 * press})`,
          }}
        >
          {ordered ? "Ordered" : "Order"}
        </div>
      </div>
    </div>
  );
};

/** The hook at any frame `f` (the CTA draws f = 0 for the loop; the cover draws a settled frame). */
export const HookView: React.FC<{ f: number; c: HookCues }> = ({ f, c }) => {
  // --- first half: the delivery street
  const [sx, sy] = door(STORES[0], -0.05);
  const [rx, ry] = R1[0];
  const k = interpolate(f, [c.tFood, c.tFood + 14], [0, 1], clamp);
  const pPop = sp(f, c.tFood, { damping: 11, stiffness: 220 });
  const parcel: Actor[] = [{ x: sx + (rx - sx) * k, y: sy + (ry - sy) * k, node: <Parcel x={sx + (rx - sx) * k} y={sy + (ry - sy) * k} z={0.7 * Math.sin(k * Math.PI) + 0.1} scale={Math.min(1, pPop) * (1 - 0.5 * k)} opacity={f >= c.tFood && k < 0.95 ? 1 : 0} /> }];
  const load = f >= c.tFood + 12 ? Math.min(1, sp(f, c.tFood + 12, { damping: 9, stiffness: 240 })) : 0;
  const ride = inOut(interpolate(f, [c.tFood + 14, c.tMap + 6], [0, 0.92], clamp));
  const pTen = f >= c.tTen ? sp(f, c.tTen, { damping: 9, stiffness: 200 }) : 0;
  const food = outAt(f, c.tMap - 2, 10);

  // --- second half: your drive in the Maps world
  const maps = ez(f, c.tMap - 2, c.tMap + 8);
  const red = (i: number) => ez(f, c.tJam + (i - JAM[0]) * 4, c.tJam + (i - JAM[0]) * 4 + 8);
  const seg = (i: number): SegState => {
    if (i < JAM[0] || i > JAM[1]) return { tint: 0, on: 0.75 };
    const r = red(i);
    return { tint: 1, on: r, unknown: 1 - r, glow: f >= c.tJam ? Math.max(0, 1 - (f - c.tJam) / 30) : 0 };
  };
  const d0 = routeDist([5, 9.6]);
  const d1 = routeDist([5, 6.4]);
  const drive = lerp(d0, d1, ez(f, c.tMap, c.tHow + 20));
  const bounce = f >= c.tKnows ? ez(f, c.tKnows, c.tKnows + 14) : 0;
  const pin = pinTop(MAPS_CAM);
  const how = ez(f, c.tHow - 2, c.tHow + 8);
  const dimMaps = 1 - 0.6 * how;

  // --- the asterisk: starts as the logo's star on the Order button and taps it; hops to the Maps pin; spins at centre on "How?"
  const tapP = ez(f, 0, c.tTap + 2);
  const tapSize = lerp(LOGO_STAR_SIZE, 34, tapP);
  const tapOp = 1 - ez(f, c.tTap + 1, c.tTap + 6);
  const hopFrom: Pt = [LOGO_STAR[0], LOGO_STAR[1]];
  const hopTo: Pt = [pin.x, pin.y + 10];
  const hopOp = f >= c.tMap - 6 && f < c.tKnows + 2 ? Math.min(ez(f, c.tMap - 6, c.tMap - 2), 1 - ez(f, c.tKnows - 2, c.tKnows + 2)) : 0;
  const howOp = ez(f, c.tHow - 4, c.tHow + 2);
  const howSize = 120 * Math.min(1.1, sp(f, c.tHow - 4, { damping: 11, stiffness: 200 }));

  return (
    <>
      {food > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: food }}>
          <FoodWorld
            cam={FOOD_CAM}
            plainSign
            h0={{ label: 1 }}
            actors={parcel}
            rider={{ points: R1, t: ride, load, moving: ride > 0 && ride < 0.92 ? 1 : 0, parked: ride <= 0 ? 1 : 0, tag: { text: "10 MIN", p: pTen } }}
          />
          <PhoneCard f={f} c={c} opacity={1} />
        </div>
      )}
      {maps > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: maps }}>
          <MapsWorld
            cam={MAPS_CAM}
            dim={dimMaps}
            route={{ progress: 1, opacity: 0.55 }}
            seg={seg}
            you={{ opacity: 0, ghostT: drive / ROUTE_LEN }}
            goog={{ bounce, glow: f >= c.tKnows ? 0.5 * (1 - ez(f, c.tKnows + 10, c.tKnows + 40)) : 0, rack: f >= c.tKnows ? 1 : 0.4 }}
            phones={[...trafficPhones(f), ...jamPhones(f, 0.35 + 0.65 * ez(f, c.tJam, c.tJam + 16))]}
          />
          <YouTag f={f} d={drive} opacity={dimMaps} />
        </div>
      )}

      <BeatHeader kicker="10-MINUTE FOOD" title={<>Tap. Wait. <span style={{ color: C.accent }}>Eat.</span></>} opacity={food} />
      <BeatHeader kicker={<LogoKicker logo="googlemaps" text="GOOGLE MAPS" />} title={<>The jam, <span style={{ color: C.red }}>seen early</span></>} opacity={maps * (1 - 0.6 * how)} />
      <SourceAt text="Swiggy, 2024" opacity={ez(f, 12, 26) * food} />
      <SourceAt text="Google, 2020" opacity={maps * (1 - how)} />

      {/* the asterisk */}
      <Star f={f} at={() => [LOGO_STAR[0], LOGO_STAR[1] - 0]} size={tapSize} rotate={90 * tapP} opacity={tapOp} />
      <Ripple c={LOGO_STAR} p={f >= c.tTap ? (f - c.tTap) / 18 : 0} r={80} />
      <Star f={f} at={(g) => hopAt(g, c.tMap - 4, c.tKnows - c.tMap + 2, hopFrom, hopTo, 160)} size={46} rotate={f * 6} opacity={hopOp} trail={1} />
      <Ripple c={hopTo} p={f >= c.tKnows ? (f - c.tKnows) / 20 : 0} r={50} color={C.cyan} />
      <Star f={f} at={() => CENTRE} size={howSize} rotate={-30 + 150 * ez(f, c.tHow - 4, c.tHow + 16)} opacity={howOp} glow={1} />
      <Burst c={CENTRE} p={f >= c.tHow ? (f - c.tHow) / 22 : 0} r={95} />
    </>
  );
};

/** "YOU" over the moving car pulse. */
const YouTag: React.FC<{ f: number; d: number; opacity: number }> = ({ d, opacity }) => {
  const p = atDist(ROUTE, d);
  const cos = Math.cos(Math.PI / 6);
  const sin = Math.sin(Math.PI / 6);
  const x = MAPS_CAM.sx + ((p[0] - MAPS_CAM.fx) - (p[1] - MAPS_CAM.fy)) * cos * MAPS_CAM.u;
  const y = MAPS_CAM.sy + ((p[0] - MAPS_CAM.fx) + (p[1] - MAPS_CAM.fy)) * sin * MAPS_CAM.u;
  return (
    <div style={{ position: "absolute", left: x - 60, top: y - 92, width: 120, display: "flex", flexDirection: "column", alignItems: "center", opacity }}>
      <div style={{ padding: "6px 16px", borderRadius: 12, background: "rgba(7,8,12,0.94)", border: `2px solid ${C.accent}`, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: C.accent }}>YOU</div>
      <svg width={20} height={12}>
        <path d="M 2 0 L 10 10 L 18 0 Z" fill={C.accent} />
      </svg>
    </div>
  );
};

export const useHookCues = (): HookCues => {
  const wf = useWord();
  return {
    tTap: wf("hook", "tap"),
    tFood: wf("hook", "food"),
    tTen: wf("hook", "ten"),
    tMap: wf("hook", "map"),
    tKnows: wf("hook", "knows"),
    tJam: wf("hook", "jam"),
    tBefore: wf("hook", "before"),
    tHow: wf("hook", "how"),
  };
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const c = useHookCues();
  return (
    <>
      <Sfx name="click" at={c.tTap} volume={0.5} />
      <Sfx name="pop" at={c.tFood} volume={0.4} />
      <Sfx name="moped" at={c.tFood + 12} volume={0.3} />
      <Sfx name="ticker" at={c.tTen} volume={0.25} dur={30} />
      <Sfx name="whoosh" at={c.tMap - 5} volume={0.35} />
      <Sfx name="data" at={c.tKnows} volume={0.3} dur={30} />
      <Sfx name="error" at={c.tJam} volume={0.13} />
      <Sfx name="pop" at={c.tHow} volume={0.45} />
      <HookView f={f} c={c} />
    </>
  );
};
