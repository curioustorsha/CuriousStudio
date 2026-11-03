import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { clamp, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { Product } from "../products";

// Side-view stage
const STAGE = { x: 120, y: 720, w: 840, h: 510 };
const FLOOR = 440; // stage-local y of the floor line
const POD_W = 230;
const POD_BODY_H = 270;
const LEG_H = 66;
const ROBOT_W = 176;
const ROBOT_H = 46;
const POD_X0 = 120; // pod's resting left edge
const POD_X1 = 470; // pod's left edge at the station
const SHELF_ITEMS = [
  ["phone", "sock", "lamp"],
  ["book", "tennis"],
  ["headphones", "cap", "battery"],
  ["sneaker", "plant"],
];

const Pod: React.FC<{ x: number; lift: number; hi: number }> = ({ x, lift, hi }) => {
  const top = FLOOR - LEG_H - POD_BODY_H - lift;
  return (
    <div style={{ position: "absolute", left: x, top, width: POD_W, height: POD_BODY_H + LEG_H }}>
      {/* body */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: POD_W,
          height: POD_BODY_H,
          borderRadius: 10,
          background: "#141B27",
          border: `3px solid ${hi ? C.accent : "rgba(79,209,255,0.55)"}`,
          boxShadow: `0 0 ${hi * 40}px rgba(255,181,71,0.45)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {SHELF_ITEMS.map((row, r) => (
          <div
            key={r}
            style={{
              flex: 1,
              borderBottom: r < SHELF_ITEMS.length - 1 ? "3px solid rgba(79,209,255,0.35)" : "none",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-evenly",
              paddingBottom: 4,
            }}
          >
            {row.map((p) => (
              <Product key={p} p={p} size={42} />
            ))}
          </div>
        ))}
      </div>
      {/* legs */}
      {[8, POD_W - 20].map((lx) => (
        <div key={lx} style={{ position: "absolute", left: lx, top: POD_BODY_H, width: 12, height: LEG_H, background: "rgba(79,209,255,0.55)", borderRadius: 3 }} />
      ))}
    </div>
  );
};

const Robot: React.FC<{ x: number; lift: number; spin: number }> = ({ x, lift, spin }) => (
  <div style={{ position: "absolute", left: x, top: FLOOR - ROBOT_H - 10, width: ROBOT_W, height: ROBOT_H + 10 }}>
    {/* lift plate rises with the pod */}
    <div
      style={{
        position: "absolute",
        left: 40,
        top: -lift - 6,
        width: ROBOT_W - 80,
        height: 10 + lift,
        background: "linear-gradient(180deg, #FFE1A8, #C77A10)",
        borderRadius: 4,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: ROBOT_W,
        height: ROBOT_H,
        borderRadius: 14,
        background: "linear-gradient(180deg, #FFA43A, #DB6A00)",
        border: "2px solid rgba(255,255,255,0.3)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ position: "absolute", right: 10, top: 14, width: 18, height: 10, borderRadius: 4, background: "#FFF3D6", boxShadow: "0 0 14px #FFF3D6" }} />
    </div>
    {[26, ROBOT_W - 50].map((wx) => (
      <div
        key={wx}
        style={{
          position: "absolute",
          left: wx,
          top: ROBOT_H - 14,
          width: 24,
          height: 24,
          borderRadius: 12,
          background: "#1A1D24",
          border: "3px solid #3A3F4B",
          transform: `rotate(${spin}deg)`,
        }}
      >
        <div style={{ position: "absolute", left: 9, top: 0, width: 3, height: 18, background: "#6B7280" }} />
      </div>
    ))}
  </div>
);

export const Kiva: React.FC = () => {
  const frame = useCurrentFrame();
  const t2012 = wf("kiva", "2012");
  const tSeven = wf("kiva", "seven");
  const tDollars = wf("kiva", "dollars", 0, "end");
  const tRobots = wf("kiva", "robots");
  const tLift = wf("kiva", "lift");
  const tBring = wf("kiva", "bring");
  const tWorkers = wf("kiva", "workers", 0, "end");

  const pYear = useIn(t2012 - 4);
  const count = interpolate(frame, [tSeven, tDollars - 4], [0, 775], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const pNum = useIn(tSeven - 6);
  const pop = useIn(tDollars - 4, { damping: 9, stiffness: 240 });

  // Robot drives in under the pod, lifts it, then carries it to the worker.
  const driveIn = ease(frame, tRobots - 18, tLift);
  const lift = ease(frame, tLift, tLift + 10) * 30;
  const carry = ease(frame, tBring - 2, tWorkers + 2);
  const podX = POD_X0 + (POD_X1 - POD_X0) * carry;
  const underX = POD_X0 + (POD_W - ROBOT_W) / 2;
  const robotX = -ROBOT_W - 40 + (underX + ROBOT_W + 40) * driveIn + (POD_X1 - POD_X0) * carry;
  const spin = (robotX + 220) * 2.2;
  const arrived = ease(frame, tWorkers, tWorkers + 8);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.35} />
      <Sfx name="swoosh" at={t2012 - 4} volume={0.3} />
      <Sfx name="ticker" at={tSeven} volume={0.3} dur={Math.max(1, tDollars - tSeven)} />
      <Sfx name="impact" at={tDollars - 5} volume={0.65} />
      <Sfx name="robot" at={tRobots - 18} volume={0.45} />
      <Sfx name="riser" at={tLift - 2} volume={0.15} dur={14} />
      <Sfx name="ding" at={tWorkers} volume={0.45} />

      <Header>
        <Reveal at={0}>
          <Kicker text="2012 · ENTER THE ROBOTS" />
        </Reveal>
        <div style={{ opacity: Math.min(1, pYear), transform: `translateY(${(1 - pYear) * 30}px)` }}>
          <Title size={64}>Amazon buys Kiva Systems</Title>
        </div>
      </Header>

      <div
        style={{
          position: "absolute",
          top: 400,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: Math.min(1, pNum),
          transform: `scale(${(0.85 + 0.15 * pNum) * (1 + 0.06 * Math.sin(Math.min(1, pop) * Math.PI))})`,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 200,
            letterSpacing: -6,
            lineHeight: 1,
            background: `linear-gradient(180deg, #FFE1A8, ${C.accent})`,
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: `drop-shadow(0 0 ${30 * Math.min(1, pop)}px rgba(255,181,71,0.45))`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ${Math.round(count)}M
        </div>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: C.muted, marginTop: 6 }}>
          IN CASH · ANNOUNCED 19 MAR 2012
        </div>
      </div>

      {/* Side-view stage */}
      <div
        style={{
          position: "absolute",
          left: STAGE.x,
          top: STAGE.y,
          width: STAGE.w,
          height: STAGE.h,
          borderRadius: 28,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0D1017 0%, #10141D 100%)",
          border: `1px solid ${C.stroke}`,
          opacity: ease(frame, 4, 16),
        }}
      >
        {/* back row of pods, out of focus for depth */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 30 + i * 210,
              top: FLOOR - 300,
              width: 150,
              height: 240,
              borderRadius: 8,
              border: "2px solid rgba(79,209,255,0.12)",
              background: "repeating-linear-gradient(180deg, transparent 0 56px, rgba(79,209,255,0.1) 56px 59px)",
              filter: "blur(2px)",
            }}
          />
        ))}
        {/* floor */}
        <div style={{ position: "absolute", left: 0, right: 0, top: FLOOR, height: 3, background: "rgba(255,255,255,0.25)" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: FLOOR + 3,
            bottom: 0,
            background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 60px)",
          }}
        />

        {/* pick station + worker */}
        <div
          style={{
            position: "absolute",
            left: 720,
            top: FLOOR - 200,
            width: 100,
            height: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <div style={{ transform: `scale(${1 + 0.08 * Math.sin(arrived * Math.PI)})` }}>
            <Product p="worker" size={96} color={arrived > 0.5 ? C.green : "#7FE3B5"} />
          </div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 16, letterSpacing: 2, color: C.green, textAlign: "center", lineHeight: 1.2, paddingBottom: 8 }}>
            WORKER
          </div>
        </div>

        <Pod x={podX} lift={lift} hi={ease(frame, tLift, tLift + 8)} />
        <Robot x={robotX} lift={lift} spin={spin} />

        {/* lift callout */}
        <div
          style={{
            position: "absolute",
            left: POD_X0 + POD_W + 16,
            top: FLOOR - 120,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 2,
            color: C.accent,
            opacity: ease(frame, tLift, tLift + 6) * (1 - ease(frame, tBring - 6, tBring)),
          }}
        >
          ↑ LIFTS THE WHOLE SHELF
        </div>

        <div style={{ position: "absolute", left: 24, top: 18, fontFamily: F.mono, fontSize: 18, fontWeight: 700, letterSpacing: 2, color: C.muted }}>
          SIDE VIEW · ROBOTIC DRIVE UNIT
        </div>
      </div>

      <Source text="TECHCRUNCH, MAR 2012" at={t2012} />
    </>
  );
};
