import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Repo } from "./scenes/Repo";
import { Honest } from "./scenes/Honest";
import { Task } from "./scenes/Task";
import { Before } from "./scenes/Before";
import { After } from "./scenes/After";
import { Catch } from "./scenes/Catch";
import { Install } from "./scenes/Install";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CS-015",
  title: "Karpathy's CLAUDE.md: it asks first",
  seriesTag: "CLAUDE SKILLS",
  manifest,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  hardCuts: true,
  Cover,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    repo: Repo,
    task: Task,
    before: Before,
    after: After,
    honest: Honest,
    catch: Catch,
    install: Install,
    cta: Cta,
  },
});
