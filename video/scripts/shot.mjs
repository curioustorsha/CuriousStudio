#!/usr/bin/env node
/**
 * Screenshot a page with headless Chrome, for Claude Skills proof frames.
 *
 *   npm --prefix video run ep:shot -- <file.html|https://…> <out.png> [--size 1440x2400] [--scale 2]
 *
 * A tall size gives a full page the animation can scroll through.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const sizeAt = args.indexOf("--size");
const size = sizeAt >= 0 ? args.splice(sizeAt, 2)[1] : "1440x2400";
// --scale 2 renders at 2× pixel density (same layout), so a camera push-in stays sharp.
const scaleAt = args.indexOf("--scale");
const scale = scaleAt >= 0 ? Number(args.splice(scaleAt, 2)[1]) : 1;
const [input, out] = args;
if (!input || !out || !/^\d+x\d+$/.test(size)) {
  console.error("Usage: ep:shot -- <file.html|https://…> <out.png> [--size 1440x2400]");
  process.exit(1);
}

const chrome = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
  .find((p) => p && existsSync(p));
if (!chrome) {
  console.error("Chrome not found. Install Google Chrome or set CHROME_PATH.");
  process.exit(1);
}

const url = /^https?:\/\//.test(input) ? input : pathToFileURL(resolve(process.env.INIT_CWD ?? process.cwd(), input)).href;
const target = resolve(process.env.INIT_CWD ?? process.cwd(), out);
execFileSync(chrome, ["--headless=new", "--hide-scrollbars", "--disable-gpu", `--window-size=${size.replace("x", ",")}`, `--force-device-scale-factor=${scale}`, "--virtual-time-budget=4000", `--screenshot=${target}`, url], { stdio: "inherit" });
if (!existsSync(target)) {
  console.error("No screenshot written.");
  process.exit(1);
}
console.log(target);
