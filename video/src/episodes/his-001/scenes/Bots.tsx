import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../../../theme";
import { ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn, useWord } from "../../../engine/kit";
import { bots, CITY, crowd, GATE, mixCam, useMove, World, YOU_PATH, YouPulse } from "./world";
import { RailwaysTag } from "./parts";

/** Your place in the queue, at the front of it (by the turnstile), and once through it. */
export const D_QUEUE = 10.25;
export const D_FRONT = 10.75;
export const D_THROUGH = 11.9;

/** The tally under the gate: amber people and red bots side by side, the red half pulsing. */
const Tally: React.FC<{ p: number; frame: number }> = ({ p, frame }) => {
  if (p <= 0.01) return null;
  const k = Math.min(1, p);
  const red = 0.5 * k;
  const beat = 0.75 + 0.25 * Math.sin(frame * 0.35);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1050, display: "flex", justifyContent: "center", opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - k) * 20}px)` }}>
      <div style={{ padding: "16px 26px 18px", borderRadius: 24, background: "rgba(7,8,12,0.92)", border: `2px solid ${C.red}`, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.text }}>
          UP TO <span style={{ color: C.red }}>50%</span> BOTS
        </div>
        <div style={{ width: 480, height: 26, borderRadius: 13, overflow: "hidden", display: "flex", background: "#1A1D27" }}>
          <div style={{ width: `${(1 - red) * 100}%`, background: C.accent }} />
          <div style={{ width: `${red * 100}%`, background: C.red, opacity: beat }} />
        </div>
        <div style={{ display: "flex", width: 480, justifyContent: "space-between", fontFamily: F.mono, fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>
          <span style={{ color: C.accent }}>PEOPLE</span>
          <span style={{ color: C.red }}>BOTS</span>
        </div>
      </div>
    </div>
  );
};

/** Step one, getting in: up to half the login attempts at Tatkal's opening were bots; most are now blocked. */
export const Bots: React.FC = () => {
  const frame = useCurrentFrame();
  const wf = useWord();
  const tGet = wf("bots", "getting");
  const tHalf = wf("bots", "half");
  const tMost = wf("bots", "most");
  const tRail = wf("bots", "railways");

  const glide = useMove(0, 30);
  const cam = mixCam(CITY, GATE, glide);
  const pLabel = useIn(tGet, { damping: 12, stiffness: 200 });
  const pTally = useIn(tHalf, { damping: 12, stiffness: 180 });
  const pTag = useIn(tRail, { damping: 14, stiffness: 180 });
  const glow = ease(frame, tMost, tMost + 8);
  const bs = bots(frame, tGet - 30, tMost + 4, { n: 14, slipEvery: 6, speed: 0.07 });

  // You: waiting in the queue, then up to the turnstile once the barrier is guarding (the check is next scene)
  const tPass = tMost + 22;
  const d = D_QUEUE + (D_FRONT - D_QUEUE) * ease(frame, tPass, tPass + 20);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.2} />
      <Sfx name="pop" at={tGet} volume={0.3} />
      <Sfx name="robot" at={tHalf} volume={0.22} />
      <Sfx name="error" at={tMost + 8} volume={0.16} />
      <Sfx name="error" at={tMost + 20} volume={0.14} />
      <Sfx name="error" at={tMost + 34} volume={0.14} />
      <Sfx name="click" at={tPass + 8} volume={0.35} />

      <Header>
        <Reveal at={0}>
          <Kicker text="STEP 1 · GETTING IN" />
        </Reveal>
        <Reveal at={4}>
          <Title size={84}>
            Half were <span style={{ color: C.red }}>bots</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={cam}
        clock={{ time: "10:00" }}
        gate={{ glow, label: frame >= tGet ? pLabel : 0 }}
        pulses={crowd(frame + 400, 0, { n: 26, every: 3, speed: 0.06 })}
        bots={bs}
        overlay={<YouPulse pts={YOU_PATH} d={d} tag="YOU" moving={frame >= tPass && frame < tPass + 26} />}
      />

      <Tally p={frame >= tHalf ? pTally : 0} frame={frame} />
      <RailwaysTag p={frame >= tRail ? pTag : 0} x={540} y={1190} text="THE RAILWAYS SAYS" />
      <Source text="Ministry of Railways, Jun 2025" at={tHalf} />
    </>
  );
};
