import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Cart } from "./scenes/Cart";
import { Phones } from "./scenes/Phones";
import { Future } from "./scenes/Future";
import { Memory } from "./scenes/Memory";
import { Graph } from "./scenes/Graph";
import { Spill } from "./scenes/Spill";
import { NumberScene } from "./scenes/Number";
import { Outro } from "./scenes/Outro";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "HIS-007",
  title: "How Google Maps knows there’s traffic",
  seriesTag: "HOW IT SCALES",
  manifest,
  Cover,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    cart: Cart,
    phones: Phones,
    future: Future,
    memory: Memory,
    graph: Graph,
    spill: Spill,
    number: NumberScene,
    outro: Outro,
    cta: Cta,
  },
});
