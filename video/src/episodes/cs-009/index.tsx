import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { MapScene } from "./scenes/Map";
import { Explore } from "./scenes/Explore";
import { Beyond } from "./scenes/Beyond";
import { Trick } from "./scenes/Trick";
import { Catch } from "./scenes/Catch";
import { Install } from "./scenes/Install";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CS-009",
  title: "Archify: click your codebase",
  seriesTag: "CLAUDE SKILLS",
  manifest,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  hardCuts: true,
  // let the three-line install command sit on screen after the line ends
  tail: { install: 1.0 },
  Cover,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    map: MapScene,
    explore: Explore,
    beyond: Beyond,
    trick: Trick,
    catch: Catch,
    install: Install,
    cta: Cta,
  },
});
