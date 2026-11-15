import React from "react";
import { F } from "../../../theme";
import { Product } from "../../../products";
import { cardW, COL, rowXs, WS } from "../../../workshop";

// The rhyme from Anthropic's study (Claude 3.5 Haiku):
// "He saw a carrot and had to grab it, / His hunger was like a starving rabbit"
export const ROW2 = ["His", "hunger", "was", "like", "a", "starving", "rabbit"];
export const R2_SIZE = 30;
export const ROW2_X = rowXs(ROW2, 132, 10, R2_SIZE);
export const END_X = ROW2_X[6];
export const END_CX = END_X + cardW("rabbit", R2_SIZE) / 2;
export const ROW1_BOTTOM = WS.benchTop - 86;

/** Line 1, already written: one long strip so it fits, with the carrot icon at its left. */
export const Row1: React.FC<{ bright: number }> = ({ bright }) => (
  <div
    style={{
      position: "absolute",
      left: 132,
      top: ROW1_BOTTOM - 72,
      height: 72,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 22px 0 14px",
      borderRadius: 12,
      background: COL.cream,
      filter: `brightness(${0.5 + 0.5 * bright})`,
      boxShadow: "0 8px 0 rgba(0,0,0,0.28)",
      fontFamily: F.sans,
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: -0.5,
      color: COL.ink,
      whiteSpace: "nowrap",
    }}
  >
    <Product p="carrot" size={44} />
    He saw a carrot and had to grab it,
  </div>
);
