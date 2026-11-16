import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { Window } from "../../../productui";
import { CLIP_WIN, CLIPS, ClipId, PROOF } from "./common";

/** One of our renders playing in a big browser window, from scene frame `from` (offset `skip` frames into the clip). */
export const ClipWindow: React.FC<{ clip: ClipId; from?: number; skip?: number; zoom?: number; dim?: number }> = ({ clip, from = 0, skip = 0, zoom = 1, dim = 1 }) => {
  const c = CLIPS[clip];
  return (
    <div style={{ opacity: dim }}>
      <Window kind="browser" title={`curiously · ${c.label}`} {...CLIP_WIN}>
        <Sequence from={from} layout="none">
          <OffthreadVideo
            src={staticFile(`${PROOF}/clips/${c.file}.mp4`)}
            muted
            trimBefore={skip}
            style={{ width: CLIP_WIN.w, height: CLIP_WIN.h - 52, objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "50% 45%" }}
          />
        </Sequence>
      </Window>
    </div>
  );
};
