import React from "react";
import { useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { Product } from "../products";
import { Bin, rnd, useIn } from "../lib";

// 4 x 5 random-stow shelf. Index 1 = phone case, 10 = cookbook, 15 = dog toy.
export const SHELF: string[][] = [
  ["lotion", "sock"], ["phone"], ["headphones", "umbrella"], ["gift"],
  ["sneaker"], ["battery", "puzzle"], ["coffee"], ["game", "cap"],
  ["plant"], ["watch", "lamp"], ["book"], ["sock", "flashlight"],
  ["camera", "package"], ["palette"], ["magnet", "ball"], ["bone"],
  ["sunglasses", "lotion"], ["keyboard"], ["plug", "notebook"], ["cookie", "tennis"],
];
export const KEY = { phone: 1, cookbook: 10, dog: 15 };

export const COLS = 4;
export const BW = 200;
export const BH = 150;
export const GAP = 14;
export const SHELF_W = COLS * BW + (COLS - 1) * GAP;
export const SHELF_H = 5 * BH + 4 * GAP;

export const binXY = (i: number) => ({
  x: (i % COLS) * (BW + GAP),
  y: Math.floor(i / COLS) * (BH + GAP),
});

const code = (i: number) => `${String.fromCharCode(65 + Math.floor(i / COLS))}-${String(12 + (i % COLS) * 7).padStart(2, "0")}`;

const Item: React.FC<{ e: string; i: number; j: number; delay: number; shake: number }> = ({ e, i, j, delay, shake }) => {
  const frame = useCurrentFrame();
  const p = useIn(delay, { damping: 11, stiffness: 180 });
  const rot = (rnd(`r${i}-${j}`) - 0.5) * 30 + Math.sin((frame + i * 7) * 0.9) * shake * 10;
  return (
    <div style={{ transform: `scale(${p}) rotate(${rot}deg) translateY(${(rnd(`y${i}${j}`) - 0.5) * 14}px)` }}>
      <Product p={e} size={j === 0 ? 78 : 60} />
    </div>
  );
};

export const Shelf: React.FC<{
  popStart?: number;
  glow?: (i: number) => number;
  dim?: (i: number) => number;
  shake?: number;
}> = ({ popStart = 0, glow = () => 0, dim = () => 0, shake = 0 }) => {
  const order = SHELF.map((_, i) => i).sort((a, b) => rnd(`o${a}`) - rnd(`o${b}`));
  return (
    <div style={{ position: "relative", width: SHELF_W, height: SHELF_H }}>
      {SHELF.map((items, i) => {
        const { x, y } = binXY(i);
        const delay = popStart + order.indexOf(i) * 1.4;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y }}>
            <Bin w={BW} h={BH} code={code(i)} glow={glow(i)} dim={dim(i)}>
              {items.map((e, j) => (
                <Item key={j} e={e} i={i} j={j} delay={delay + j * 2} shake={shake} />
              ))}
            </Bin>
          </div>
        );
      })}
    </div>
  );
};

export const Tag: React.FC<{ text: string; p: number; color?: string; style?: React.CSSProperties }> = ({
  text,
  p,
  color = C.accent,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      padding: "12px 22px",
      borderRadius: 14,
      background: color,
      color: "#0B0B0F",
      fontFamily: F.sans,
      fontWeight: 800,
      fontSize: 34,
      whiteSpace: "nowrap",
      boxShadow: `0 12px 40px rgba(0,0,0,.5), 0 0 30px ${color}55`,
      opacity: Math.min(1, p),
      transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`,
      ...style,
    }}
  >
    {text}
  </div>
);
