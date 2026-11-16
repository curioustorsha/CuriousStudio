import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { What } from "./scenes/What";
import { Range } from "./scenes/Range";
import { PromiseScene } from "./scenes/Promise";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "PB-001",
  title: "Curiously: the channel intro",
  // Not a series episode: the tag says what it is instead of repeating the wordmark beside it.
  seriesTag: "CHANNEL INTRO",
  manifest,
  Cover,
  // The CTA is its own logo end card and loops into the hook.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    what: What,
    range: Range,
    promise: PromiseScene,
    cta: Cta,
  },
});
