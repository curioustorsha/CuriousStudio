import { makeEpisode } from "../../engine/Episode";
import manifest from "./manifest.json";
import { Cover } from "./Cover";
// @scene-imports
import { Hook } from "./scenes/Hook";
import { Intro } from "./scenes/Intro";
import { Callback } from "./scenes/Callback";
import { Desk } from "./scenes/Desk";
import { Notpaper } from "./scenes/Notpaper";
import { Onit } from "./scenes/Onit";
import { Pile } from "./scenes/Pile";
import { Keeps } from "./scenes/Keeps";
import { Gatsby } from "./scenes/Gatsby";
import { Size } from "./scenes/Size";
import { Fixed } from "./scenes/Fixed";
import { Outro } from "./scenes/Outro";
import { Next } from "./scenes/Next";
import { Cta } from "./scenes/Cta";

export default makeEpisode({
  code: "CL-007",
  title: "Lesson 3 · The context window: Claude's desk",
  seriesTag: "CLAUDE LAB",
  manifest,
  Cover,
  // The cta scene is the sign-off end card, so no generic logo sting after it.
  endSting: false,
  scenes: {
    // @scenes
    hook: Hook,
    intro: Intro,
    callback: Callback,
    desk: Desk,
    notpaper: Notpaper,
    onit: Onit,
    pile: Pile,
    keeps: Keeps,
    gatsby: Gatsby,
    size: Size,
    fixed: Fixed,
    outro: Outro,
    next: Next,
    cta: Cta,
  },
});
