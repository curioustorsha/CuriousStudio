import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  bg: "#07080C",
  panel: "#11131A",
  panel2: "#191C26",
  stroke: "rgba(255,255,255,0.09)",
  text: "#F5F5F7",
  muted: "#8A8F9C",
  accent: "#FFB547",
  cyan: "#4FD1FF",
  green: "#3DDC97",
  red: "#FF5C5C",
};

export const F = {
  sans: loadInter("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin"] }).fontFamily,
  display: loadGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily,
  mono: loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily,
};
