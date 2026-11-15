import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Maker } from "./scenes/Maker";
import { Keyboard } from "./scenes/Keyboard";
import { Bench } from "./scenes/Bench";
import { Search } from "./scenes/Search";
import { Rabbit } from "./scenes/Rabbit";
import { Habit } from "./scenes/Habit";
import { Outro } from "./scenes/Outro";
import { Tease } from "./scenes/Tease";
import { Next } from "./scenes/Next";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CL-005",
  title: "Lesson 1 · What Claude actually is",
  seriesTag: "CLAUDE LAB",
  manifest,
  Cover,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    maker: Maker,
    keyboard: Keyboard,
    bench: Bench,
    search: Search,
    rabbit: Rabbit,
    habit: Habit,
    outro: Outro,
    tease: Tease,
    next: Next,
    cta: Cta,
  },
});
