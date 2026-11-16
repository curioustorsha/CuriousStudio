import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Repo } from "./scenes/Repo";
import { City, Numbers, Product, Workshop } from "./scenes/Montage";
import { Trick } from "./scenes/Trick";
import { Catch } from "./scenes/Catch";
import { Install } from "./scenes/Install";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CS-032",
  title: "Remotion skills: this channel is made with it",
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
    city: City,
    workshop: Workshop,
    numbers: Numbers,
    product: Product,
    trick: Trick,
    catch: Catch,
    install: Install,
    cta: Cta,
  },
});
