Done. I added a 3-second vertical title card.

**What I made**

- `src/TitleCard.tsx` - the card. Dark background, "How It Scales" in big white bold type, centred. Each word springs up from below, one after another (5 frames apart), starting at frame 8. Once the title has landed (around frame 26), "by Curiously" fades and slides up underneath in yellow. It then holds until the end so it reads cleanly before the next shot.
- `src/Root.tsx` - registers the `TitleCard` composition at 1080x1920, 30 fps, 90 frames (3 s). I left your `src/index.ts` as is; it should already call `registerRoot(RemotionRoot)`.

All motion is driven by `useCurrentFrame()` with `spring()` and `interpolate()`, so it renders the same every time. No new packages needed; it uses a system font stack (Inter if installed, otherwise SF Pro / Helvetica).

**To preview and render**

```
npx remotion studio
npx remotion render TitleCard out/title-card.mp4
```

**Optional next steps**

- If you want a fixed font everywhere, add `@remotion/google-fonts` and load Inter (or your brand font) in `TitleCard.tsx`.
- Swap the background and yellow for your exact brand colours, or add the Curiously mark next to the byline.
- If this card leads straight into the video, I can add a quick fade-out over the last 6-8 frames.
