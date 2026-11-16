import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Task } from "./scenes/Task";
import { Before } from "./scenes/Before";
import { After } from "./scenes/After";
import { Trick } from "./scenes/Trick";
import { Catch } from "./scenes/Catch";
import { Install } from "./scenes/Install";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CS-032",
  title: "Remotion skills (remotion-dev/skills)",
  seriesTag: "CLAUDE SKILLS",
  manifest,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  Cover,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    task: Task,
    before: Before,
    after: After,
    trick: Trick,
    catch: Catch,
    install: Install,
    cta: Cta,
  },
});
