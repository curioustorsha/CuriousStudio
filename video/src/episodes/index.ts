// Episodes built with the engine (src/engine). `npm run ep:new -- <CODE>` adds the import and the entry.
// Each registers two compositions: <CODE> (the video) and <CODE>-cover (the thumbnail still).
import type { Episode } from "../engine/Episode";
import ep_his_003 from "./his-003";
import ep_his_007 from "./his-007";
import ep_cl_005 from "./cl-005";
import ep_cl_006 from "./cl-006";
import ep_his_001 from "./his-001";
import ep_cs_016 from "./cs-016";
// @episodes-imports

export const EPISODES: Episode[] = [
  ep_his_003,
  ep_his_007,
  ep_cl_005,
  ep_cl_006,
  ep_his_001,
  ep_cs_016,
  // @episodes-list
];
