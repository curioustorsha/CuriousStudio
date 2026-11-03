import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
import { Hook } from "./scenes/Hook";
import { Naive } from "./scenes/Naive";
import { Stores } from "./scenes/Stores";
import { Area } from "./scenes/Area";
import { Clock } from "./scenes/Clock";
import { Scale } from "./scenes/Scale";
import { Outro } from "./scenes/Outro";
// @scene-imports

export default makeEpisode({
  code: "HIS-003",
  title: "How 10-minute delivery actually works",
  seriesTag: "HOW IT SCALES",
  manifest,
  Cover,  scenes: {
    hook: Hook,
    naive: Naive,
    stores: Stores,
    area: Area,
    clock: Clock,
    scale: Scale,
    outro: Outro,
    // @scenes
  },
});
