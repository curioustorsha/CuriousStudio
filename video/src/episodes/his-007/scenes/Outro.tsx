import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../../theme";
import { ease, Header, isoPoint, Kicker, Reveal, Sfx, Title, useIn, useIsoStage, useWord } from "../../../engine/kit";
import { hookSeg } from "./Hook";
import { cartMid, Chip, CITY, JAM, JAM_MID, jamPhones, trafficPhones, World, type CartState, type P2, type Ping } from "./world";

/** The hook's "?" over the jam turning into a green check. */
const CheckChip: React.FC<{ p: number }> = ({ p }) => {
  const s = useIsoStage();
  if (p <= 0.01) return null;
  const pt = isoPoint(s, JAM_MID[0], JAM_MID[1], 0);
  const sc = 0.6 + 0.4 * Math.min(1, p);
  return (
    <g transform={`translate(${pt.x},${pt.y - 70}) scale(${sc})`} opacity={Math.min(1, p * 1.6)}>
      <rect x={-34} y={-30} width={68} height={60} rx={17} fill="rgba(7,8,12,0.94)" stroke={C.green} strokeWidth={3} />
      <path d="M -14 0 L -4 11 L 15 -11" fill="none" stroke={C.green} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** The handcart's route in the outro: along the jam stretch on avenue y = 5. */
const OUTRO_CART: P2[] = [
  [5.4, 5.25],
  [11.2, 5.25],
];

/** Back to the hook's frame: the phones already stuck in the jam are what told Google. Even phones in a handcart. */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames: D } = useVideoConfig();
  const wf = useWord();
  const tBefore = wf("outro", "before");
  const tPhones = wf("outro", "phones");
  const tHelped = wf("outro", "helped");
  const tEven = wf("outro", "even");
  const tHand = wf("outro", "handcart");

  const gap = ease(frame, tBefore, tBefore + 16);
  const jp = jamPhones(frame, 1);
  const pings: Ping[] = jp.map((p, k) => ({ from: [p.x, p.y] as P2, t: (frame - tPhones - k * 3) / 20 }));

  const glow = frame >= tHelped ? 0.5 + 0.5 * Math.sin((frame - tHelped) * 0.25) : 0;
  const q = 1 - ease(frame, tHelped - 2, tHelped + 4);
  const pCheck = useIn(tHelped + 4, { damping: 10, stiffness: 220 });

  // The handcart rolls in along the jam on "Even phones in a handcart"; its phones ping too.
  const cartP = ease(frame, tEven - 6, D, 0, 1);
  const cart: CartState | undefined = frame >= tEven - 6 ? { path: OUTRO_CART, d: 0.2 + cartP * 5.0, lit: 99 } : undefined;
  const cm = cart ? cartMid(cart) : null;
  const cartPings: Ping[] = cm ? [0, 1, 2].map((k) => ({ from: cm, t: ((frame - tHand - k * 8) % 30) / 20 })).filter((pg) => frame >= tHand) : [];

  return (
    <>
      <Sfx name="whoosh" at={tBefore} volume={0.22} />
      <Sfx name="data" at={tPhones + 2} volume={0.3} />
      <Sfx name="ding" at={tHelped + 4} volume={0.3} />
      <Sfx name="cart" at={Math.max(0, tEven - 6)} volume={0.45} dur={Math.max(1, D - tEven + 6)} />
      <Sfx name="data" at={tHand + 2} volume={0.22} />

      <Header>
        <Reveal at={0}>
          <Kicker text="THE ANSWER" color={C.green} />
        </Reveal>
        <Reveal at={4}>
          <Title size={80}>
            The phones <span style={{ color: C.accent }}>ahead</span>
          </Title>
        </Reveal>
      </Header>

      <World
        cam={CITY}
        route={{ progress: 1, opacity: 1 }}
        seg={(i) => {
          const s = hookSeg(frame, 0, 1)(i);
          return i >= JAM[0] && i <= JAM[1] ? { ...s, glow } : s;
        }}
        gap={gap}
        you={{ label: 1 }}
        office={{ label: 1 }}
        goog={{ glow: frame >= tHelped ? 0.7 : 0, rack: frame >= tPhones ? 0.9 : 0.3 }}
        phones={[...trafficPhones(frame), ...jp.map((p) => ({ ...p, opacity: 1 }))]}
        pings={[...pings, ...cartPings]}
        cart={cart}
        overlay={
          <>
            <Chip x={JAM_MID[0]} y={JAM_MID[1]} text="?" color={C.text} size={38} p={q} lift={70} />
            <CheckChip p={frame >= tHelped + 4 ? pCheck : 0} />
          </>
        }
      />
    </>
  );
};
