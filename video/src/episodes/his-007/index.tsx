import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Cart } from "./scenes/Cart";
import { Phones } from "./scenes/Phones";
import { Reports } from "./scenes/Reports";
import { Future } from "./scenes/Future";
import { Memory } from "./scenes/Memory";
import { Lockdown } from "./scenes/Lockdown";
import { Super } from "./scenes/Super";
import { Graph } from "./scenes/Graph";
import { Spill } from "./scenes/Spill";
import { Eta } from "./scenes/Eta";
import { Route } from "./scenes/Route";
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
    reports: Reports,
    future: Future,
    memory: Memory,
    lockdown: Lockdown,
    super: Super,
    graph: Graph,
    spill: Spill,
    eta: Eta,
    route: Route,
    number: NumberScene,
    outro: Outro,
    cta: Cta,
  },
});
