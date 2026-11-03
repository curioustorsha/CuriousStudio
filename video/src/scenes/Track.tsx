import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Bin, ease, Header, Kicker, Reveal, Sfx, Source, Title, useIn } from "../lib";
import { wf } from "../timing";
import { Product } from "../products";

const ROWS = [
  { icon: "", k: "BIN", v: "P-1-A204", accent: true },
  { icon: "phone", k: "Phone case", v: "× 1" },
  { icon: "book", k: "Cookbook", v: "× 1" },
  { icon: "bone", k: "Dog toy", v: "× 1" },
];

export const Track: React.FC = () => {
  const frame = useCurrentFrame();
  const tNot = wf("track", "not");
  const tComp = wf("track", "computers");
  const tTrack = wf("track", "track");
  const tKnows = wf("track", "single");
  const tWhich = wf("track", "exact");
  const pBin = useIn(2);
  const scan = ease(frame, tComp - 2, tComp + 20);
  const scanOn = frame >= tComp - 2 && frame < tComp + 24;
  const rowAt = (i: number) => tTrack + 4 + i * 6;
  const pStatus = useIn(tKnows);
  const pulse = frame >= tWhich ? 0.5 + 0.5 * Math.sin((frame - tWhich) * 0.35) : 0;
  const swap = ease(frame, tNot - 3, tNot + 5);

  return (
    <>
      <Sfx name="swoosh" at={tNot - 2} volume={0.35} />
      <Sfx name="scan" at={tComp} volume={0.5} />
      <Sfx name="scan" at={tComp + 9} volume={0.4} />
      <Sfx name="data" at={tTrack + 2} volume={0.35} />
      <Sfx name="ding" at={tKnows} volume={0.4} />

      <Header>
        <Reveal at={0}>
          <Kicker text="EVERY ITEM, TRACKED" color={C.cyan} />
        </Reveal>
        <div style={{ position: "relative", height: 100, width: 1000 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - swap, transform: `translateY(${-swap * 30}px)` }}>
            <Reveal at={3} scaleFrom={0.9}>
              <Title size={104}>Risky?</Title>
            </Reveal>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: swap, transform: `translateY(${(1 - swap) * 30}px)` }}>
            <Title size={104} color={C.green}>
              Not really.
            </Title>
          </div>
        </div>
      </Header>

      {/* Big bin */}
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 420,
          opacity: Math.min(1, pBin),
          transform: `scale(${0.85 + 0.15 * pBin})`,
        }}
      >
        <Bin w={740} h={300} code="P-1-A204" glow={pulse * 0.6} glowColor={C.cyan}>
          <Product p="phone" size={130} style={{ display: "inline-block", transform: "rotate(-12deg)" }} />
          <Product p="book" size={140} style={{ display: "inline-block", transform: "rotate(8deg)", margin: "0 30px" }} />
          <Product p="bone" size={120} style={{ display: "inline-block", transform: "rotate(-20deg)" }} />
        </Bin>
        {scanOn && (
          <div
            style={{
              position: "absolute",
              top: -10,
              bottom: -10,
              left: scan * 740 - 3,
              width: 6,
              background: C.cyan,
              boxShadow: `0 0 30px 8px ${C.cyan}`,
              borderRadius: 3,
            }}
          />
        )}
      </div>

      {/* Data panel */}
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 770,
          width: 740,
          padding: "28px 34px",
          borderRadius: 24,
          background: "rgba(17,19,26,0.85)",
          border: `1px solid rgba(79,209,255,0.25)`,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          opacity: ease(frame, tTrack - 2, tTrack + 6),
          transform: `translateY(${(1 - ease(frame, tTrack - 2, tTrack + 10)) * 40}px)`,
        }}
      >
        {ROWS.map((r, i) => {
          const o = ease(frame, rowAt(i), rowAt(i) + 6);
          const hi = r.accent ? pulse : 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 12px",
                borderBottom: i < ROWS.length - 1 ? `1px solid ${C.stroke}` : "none",
                fontFamily: F.mono,
                fontSize: 36,
                fontWeight: 700,
                color: r.accent ? C.cyan : C.text,
                opacity: o,
                transform: `translateX(${(1 - o) * -30}px)`,
                background: `rgba(79,209,255,${hi * 0.12})`,
                borderRadius: 10,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 18 }}>{r.icon && <Product p={r.icon} size={40} />}{r.k}</span>
              <span style={{ color: r.accent ? C.cyan : C.muted }}>{r.v}</span>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: F.mono,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: 2,
            color: C.green,
            opacity: Math.min(1, pStatus),
            transform: `scale(${0.9 + 0.1 * pStatus})`,
            transformOrigin: "left center",
          }}
        >
          <span style={{ width: 16, height: 16, borderRadius: 8, background: C.green, boxShadow: `0 0 18px ${C.green}` }} />
          LOCATION KNOWN
        </div>
      </div>

      <Source text="ABOUTAMAZON.COM" at={20} />
    </>
  );
};
