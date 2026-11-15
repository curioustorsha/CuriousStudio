import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Record } from "./scenes/Record";
import { Follow } from "./scenes/Follow";
import { Bots } from "./scenes/Bots";
import { Gate } from "./scenes/Gate";
import { Reading } from "./scenes/Reading";
import { Writing } from "./scenes/Writing";
import { Copies } from "./scenes/Copies";
import { Cdn } from "./scenes/Cdn";
import { Offload } from "./scenes/Offload";
import { Onesystem } from "./scenes/Onesystem";
import { Limit } from "./scenes/Limit";
import { Upgrade } from "./scenes/Upgrade";
import { Outro } from "./scenes/Outro";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "HIS-001",
  title: "How IRCTC survives the Tatkal rush",
  seriesTag: "HOW IT SCALES",
  manifest,
  Cover,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    record: Record,
    follow: Follow,
    bots: Bots,
    gate: Gate,
    reading: Reading,
    writing: Writing,
    copies: Copies,
    cdn: Cdn,
    offload: Offload,
    onesystem: Onesystem,
    limit: Limit,
    upgrade: Upgrade,
    outro: Outro,
    cta: Cta,
  },
});
