import React from "react";
import { Check } from "@phosphor-icons/react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Bin, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { Product } from "../products";

const BIN_W = 400;
const BIN_H = 300;
const LEFTS = [120, 560];

const Shirt: React.FC<{ size: string }> = ({ size }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <Product p="shirt" size={130} />
    <div
      style={{
        position: "absolute",
        right: -10,
        bottom: 0,
        width: 56,
        height: 56,
        borderRadius: 28,
        background: C.text,
        color: "#0B0B0F",
        fontFamily: F.sans,
        fontWeight: 900,
        fontSize: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {size}
    </div>
  </div>
);

export const Benefits: React.FC = () => {
  const frame = useCurrentFrame();
  const tLook = wf("benefits", "look");
  const tApart = wf("benefits", "apart");
  const tPick = wf("benefits", "pickers");
  const tWrong = wf("benefits", "wrong");

  const pBins = useIn(2);
  const split = useIn(tApart - 6, { damping: 14, stiffness: 120 });
  const pick = useIn(tWrong - 6, { damping: 12 });
  const confuse = ease(frame, tLook, tLook + 6) * (1 - split);

  return (
    <>
      <Sfx name="whoosh" at={0} volume={0.3} />
      <Sfx name="error" at={tLook + 2} volume={0.25} />
      <Sfx name="swoosh" at={tApart - 6} volume={0.45} />
      <Sfx name="scan" at={tPick} volume={0.35} />
      <Sfx name="ding" at={tWrong - 4} volume={0.5} />

      <Header>
        <Reveal at={0}>
          <Kicker text="FEWER MISTAKES" color={C.green} />
        </Reveal>
        <Reveal at={4} scaleFrom={0.9}>
          <Title size={88}>
            Look-alikes, <span style={{ color: C.green }}>kept apart</span>
          </Title>
        </Reveal>
      </Header>

      {[0, 1].map((k) => (
        <div
          key={k}
          style={{ position: "absolute", top: 500, left: LEFTS[k], opacity: Math.min(1, pBins), transform: `scale(${0.9 + 0.1 * Math.min(1, pBins)})` }}
        >
          <Bin w={BIN_W} h={BIN_H} code={k === 0 ? "C-19" : "F-40"} glow={k === 0 ? pick * 0.7 : 0} glowColor={C.green}>
            <div style={{ position: "absolute", right: 30, top: 34, opacity: split }}>
              <Product p={k === 0 ? "book" : "headphones"} size={78} />
            </div>
          </Bin>
        </div>
      ))}

      {/* Two near-identical shirts start side by side (confusing), then split into separate bins. */}
      {(["M", "L"] as const).map((size, k) => {
        const together = 540 + (k === 0 ? -85 : 85);
        const target = LEFTS[k] + 150;
        const x = together + (target - together) * split;
        const y = 650 + 30 * split;
        return (
          <div key={size} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${confuse * (k ? 6 : -6) * Math.sin(frame * 0.8)}deg)` }}>
            <Shirt size={size} />
          </div>
        );
      })}

      {/* "Which one?" while they're together */}
      <div
        style={{
          position: "absolute",
          top: 860,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: F.mono,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 2,
          color: C.red,
          opacity: confuse,
        }}
      >
        SAME BIN = EASY TO MIX UP
      </div>

      <div
        style={{
          position: "absolute",
          top: 900,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: Math.min(1, pick),
          transform: `translateY(${(1 - Math.min(1, pick)) * 30}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "20px 34px",
            borderRadius: 20,
            background: "rgba(61,220,151,0.12)",
            border: `2px solid ${C.green}`,
            fontFamily: F.sans,
            fontWeight: 800,
            fontSize: 40,
            color: C.green,
          }}
        >
          <Check size={44} weight="bold" /> Picked: T-shirt, size M
        </div>
      </div>

      <Source text="AMAZON PATENT US 8,341,040" at={20} />
    </>
  );
};
