Made in the Make stage (15 Nov 2026), not by either proof run.

`src/TitleCard.tsx` is `proof/after/src/TitleCard.tsx` with one line changed (line 39, the Title's `translate`):

- before: `interpolate(frame, [0, 0.6 * fps], ['0px 80px', '0px 0px'], …)`
- after:  `interpolate(frame, [0, 1 * fps], ['0px 80px', '0px -160px'], …)` (title dragged 160 px up, its end keyframe moved from 0.6 s to 1 s)

That is the edit Remotion Studio's docs describe for dragging an element (writes `translate`) and dragging a keyframe right (changes its frame). We typed this edit by hand to illustrate the trick scene; we did not open Studio. The episode's trick scene renders this file live in its preview window.
