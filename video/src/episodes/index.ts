// Episodes built with the engine (src/engine). `npm run ep:new -- <CODE>` adds the import and the entry.
// Each registers two compositions: <CODE> (the video) and <CODE>-cover (the thumbnail still).
import type { Episode } from "../engine/Episode";
import ep_his_003 from "./his-003";
// @episodes-imports

export const EPISODES: Episode[] = [
  ep_his_003,
  // @episodes-list
];
