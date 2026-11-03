/**
 * Visual styles a series can use. The rules for each live in the storyboard, animate and design skills under a
 * heading with the same key ("### isometric"), so they're edited from the skill pages like the rest of the
 * instructions. The key reaches the skills as `series.visualStyle` in the episode JSON.
 */
export const VISUAL_STYLES = [
  { key: "isometric", label: "Isometric 2D", hint: "Systems as isometric blocks, grids and flows" },
  { key: "flat-metaphor", label: "Flat 2D vector + metaphors", hint: "Flat shapes, one visual metaphor per idea" },
  { key: "carousel-editorial", label: "Carousel: editorial slides", hint: "Fixed weekly slide template, bold type" },
] as const;

export type VisualStyle = (typeof VISUAL_STYLES)[number]["key"];

export function styleLabel(key: string) {
  return VISUAL_STYLES.find((s) => s.key === key)?.label ?? "Not set";
}

export function isVisualStyle(key: unknown): key is VisualStyle {
  return VISUAL_STYLES.some((s) => s.key === key);
}
