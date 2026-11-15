import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Callback } from "./scenes/Callback";
import { Tiles } from "./scenes/Tiles";
import { Strawberry } from "./scenes/Strawberry";
import { Twice } from "./scenes/Twice";
import { Price } from "./scenes/Price";
import { Five } from "./scenes/Five";
import { Outro } from "./scenes/Outro";
import { Next } from "./scenes/Next";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CL-006",
  title: "Lesson 2 · Tokens: how Claude reads",
  seriesTag: "CLAUDE LAB",
  manifest,
  Cover,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    callback: Callback,
    tiles: Tiles,
    strawberry: Strawberry,
    twice: Twice,
    price: Price,
    five: Five,
    outro: Outro,
    next: Next,
    cta: Cta,
  },
});
