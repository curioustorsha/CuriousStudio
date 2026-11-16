Your title card is ready as a new composition called **TitleCard**: 1080x1920, 30 fps, 90 frames (3 seconds).

**What it does**
- **0 to 0.6 s:** "How It Scales" fades in, rises about 80px and grows slightly from 90% to full size. It's set in Inter ExtraBold at 120px on a near-black background.
- **0.7 to 1.2 s:** "by Curiously" fades and slides up underneath it, in Inter Medium at 56px in a yellow accent.
- **1.2 to 3 s:** both lines hold so they're easy to read.

All text stays inside the safe area: at least 80px from the sides and 100px from the top and bottom.

**Files**
- `src/TitleCard.tsx`: the card. Each line is its own named element ("Title" and "Byline"), and all the animation values are written directly on those elements. That means you can change the text, timing, easing and colours in Remotion Studio and the edits save back to the code.
- `src/Root.tsx`: registers the composition. It exports `RemotionRoot`, which is the name the blank template's `src/index.ts` already uses, so `index.ts` doesn't need changing.

**Next steps (I couldn't run commands here)**
1. Install the font package. Run this once from the project folder:
   `npx remotion add @remotion/google-fonts`
2. Open the preview with `npx remotion studio`, then pick **TitleCard** (or go to `http://localhost:3000/TitleCard`). Normally I'd have Studio open before writing the card so you could watch it come together.
3. I haven't rendered a video because you asked for the card, not an export. When you want the MP4, use the Render button in Studio or run:
   `npx remotion render TitleCard out/title-card.mp4`

**Colours to check:** the yellow (`#FFD60A`) and the background (`#0B0B0F`) are my guesses. If you want this to match the Curiously brand exactly, swap in the real brand colours. You can also add the yellow asterisk mark next to "by Curiously".
