/** How a series' episodes are made: narrated vertical videos, or a carousel of still slides. */
export const FORMATS = ["video", "carousel"] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<Format, string> = { video: "Video (vertical Short)", carousel: "Carousel (picture stack)" };

/** Models a stage can run on. Prices are API list prices per million tokens (input / output). */
export const MODELS = [
  { id: "claude-fable-5-1", label: "Fable 5.1", price: "$10 / $50" },
  { id: "claude-opus-5-5", label: "Opus 5.5", price: "$4 / $20" },
  { id: "claude-sonnet-5-5", label: "Sonnet 5.5", price: "$2 / $10" },
  { id: "claude-haiku-5-5", label: "Haiku 5.5", price: "$0.10 / $0.50" },
] as const;

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

export function modelLabel(id: string | null | undefined) {
  return MODELS.find((m) => m.id === id)?.label ?? id ?? "";
}

/**
 * Pipeline stages in order: one pipeline for every series. `fields` are the episode fields a stage produces
 * (snapshotted as v1, v2… for review); `skill` is the Claude Code skill that does the stage's work, run as
 * `/<skill> <code>`, or null for stages people do themselves. `model` and `effort` are what that skill runs on
 * unless changed on the skill's page. The format-specific work (storyboard, voiceover and animation for a
 * video; slides for a carousel) all happens inside Make: see `makeSteps`. `color` picks the --stage-N colour.
 */
export const STAGES = [
  {
    key: "idea",
    label: "Idea",
    color: 0,
    fields: ["hook", "summary", "whyNow", "audience", "keyPoints", "visualIdeas"],
    skill: null,
    description: "Captured with a hook and enough detail that either of us could pick it up.",
    checklist: ["Hook written (the first 2 seconds)", "Series assigned", "Clear 'why would someone share this?'"],
  },
  {
    key: "script",
    label: "Research & Script",
    color: 2,
    // Shown in this order on the episode page: research notes, script, fact-check, references.
    fields: ["research", "script", "factcheck", "sources"],
    skill: "script",
    model: "claude-opus-5-5",
    effort: "high",
    description: "One run: solid facts from good sources, a plain-words script that teaches one big idea, then every claim checked against its source.",
    checklist: [
      "2+ credible sources linked, every number sourced",
      "Hook in the first line (a question for How It Scales)",
      "Plain words, plus one big idea explained simply",
      "Length fits the target (never over 2 minutes)",
      "Every claim checked against its source",
      "Second person read-through",
    ],
  },
  {
    key: "make",
    label: "Make",
    color: 6,
    fields: ["storyboard", "voiceoverUrl", "voiceoverNotes", "renderUrl", "renderNotes", "slides", "designNotes", "reviewReport"],
    skill: "make",
    model: "claude-opus-5-5",
    effort: "high",
    description: "Plan first (storyboard or slide plan) and pause for approval, then build: voiceover and animation for a video, slides for a carousel. Automatic checks at the end.",
    checklist: [
      "Plan approved (storyboard or slide plan)",
      "Rendered at full size (1080×1920, and 4:5 slides for a carousel)",
      "Automatic checks pass (specs, loudness, listen-back, frames)",
      "Brand end card or slide template applied",
    ],
  },
  {
    key: "review",
    label: "Review",
    color: 7,
    fields: [],
    skill: null,
    description: "Watch it on a phone with fresh eyes. To fix something, move it back to Make and request changes.",
    checklist: [
      "Watched on a phone (sound on for video)",
      "Readable muted / without zooming",
      "Hook grabs in 2s (first frame or cover slide)",
      "Fixes done",
    ],
  },
  {
    key: "publish",
    label: "Publish",
    color: 8,
    fields: ["ytTitle", "ytDescription", "igCaption", "tiktokCaption", "hashtags", "thumbnailNotes", "publishDate", "publishPlan"],
    skill: "publish",
    model: "claude-sonnet-5-5",
    effort: "medium",
    description: "Titles, captions and cover; the next free publishing day; the upload kit. Then schedule it on each platform.",
    checklist: [
      "Titles, captions and hashtags written",
      "Cover chosen",
      "Publish date set",
      "Scheduled on YouTube",
      "Scheduled on Instagram",
      "Scheduled on TikTok",
    ],
  },
  {
    key: "posted",
    label: "Posted",
    color: 10,
    fields: ["postedYt", "postedIg", "postedTiktok", "analyticsNotes"],
    skill: null,
    description: "Live. Paste the links, pin the comment, and add 7-day stats.",
    checklist: ["Links saved", "Pinned comment added", "7-day stats recorded"],
  },
] as const;

/** Old stage keys (before the 7-stage pipeline) → the stage that now holds their work. */
export const LEGACY_STAGES: Record<string, string> = {
  research: "script",
  factcheck: "script",
  storyboard: "make",
  voiceover: "make",
  animation: "make",
  design: "make",
  packaging: "publish",
  scheduled: "publish",
};

/** The sub-steps inside Make for this format, each done once its output field is filled in. */
export function makeSteps(
  format: Format,
  ep: { storyboard: string; voiceoverUrl: string; renderUrl: string; slides: string },
): { label: string; done: boolean }[] {
  return format === "carousel"
    ? [
        { label: "Slide plan", done: Boolean(ep.storyboard) },
        { label: "Slides", done: Boolean(ep.slides) },
        { label: "Short", done: Boolean(ep.renderUrl) },
      ]
    : [
        { label: "Storyboard", done: Boolean(ep.storyboard) },
        { label: "Voiceover", done: Boolean(ep.voiceoverUrl) },
        { label: "Animation", done: Boolean(ep.renderUrl) },
      ];
}

export type Stage = (typeof STAGES)[number];

export type StageKey = (typeof STAGES)[number]["key"];

export const STAGE_KEYS = STAGES.map((s) => s.key) as StageKey[];

export function stageIndex(key: string) {
  return STAGE_KEYS.indexOf(key as StageKey);
}

export function getStage(key: string) {
  return STAGES[Math.max(0, stageIndex(key))];
}

export function isStage(key: string): key is StageKey {
  return stageIndex(key) !== -1;
}

export function isFormat(value: unknown): value is Format {
  return (FORMATS as readonly unknown[]).includes(value);
}

/** Whether a stage is part of this format's pipeline. Every series shares one pipeline now, so always true. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function inFormat(stage: Stage, format: Format) {
  return true;
}

/** The stages an episode of this format goes through, in order. */
export function stagesFor(format: Format) {
  return STAGES.filter((s) => inFormat(s, format));
}

/** The stage after (or, with -1, before) this one in the format's pipeline. */
export function stepStage(key: string, format: Format, step: 1 | -1 = 1): Stage | undefined {
  const list = stagesFor(format);
  const i = list.findIndex((s) => s.key === key);
  return i === -1 ? undefined : list[i + step];
}

/** Stages move one step at a time within the format's pipeline, forward or back, so none get skipped. */
export function canMove(from: string, to: string, format: Format = "video") {
  const list = stagesFor(format).map((s) => s.key as string);
  const a = list.indexOf(from);
  const b = list.indexOf(to);
  return a !== -1 && b !== -1 && Math.abs(a - b) <= 1;
}

/** Model and effort a stage's skill runs on, before any override saved from the skill's page. */
export function defaultModel(stage: Stage): { model: string; effort: Effort } | null {
  return "model" in stage ? { model: stage.model, effort: stage.effort } : null;
}

/** First publishing day. Nothing is expected to go out before this. */
export const LAUNCH = "2027-01-01";

/** Stages from which an episode counts as "ready" content in the backlog runway. */
export const READY_FROM = stageIndex("review");

export const PRIORITIES = ["high", "medium", "low"] as const;

/** Checklist items only a person can tick (by index per stage). Claude may leave a note but never ticks these. */
export const HUMAN_CHECKS: Partial<Record<StageKey, number[]>> = {
  script: [5], // Second person read-through
  make: [0], // Plan approved: the make skill only builds after a person ticks this
  review: [0, 1, 2, 3], // Review is done by people, on a phone
  publish: [3, 4, 5], // Scheduled on YouTube, Instagram, TikTok (done in each app)
  posted: [0, 1, 2],
};

/**
 * Checklist state lives in one JSON map per episode:
 *   "research:0": true            ticked
 *   "by:research:0": "claude"     who ticked it
 *   "note:research:0": "…"        Claude's note: why it's ticked, or what a person needs to look at
 */
export function checklistItems(stage: string, checklistJson: string) {
  let map: Record<string, unknown> = {};
  try {
    map = JSON.parse(checklistJson);
  } catch {}
  const human = HUMAN_CHECKS[stage as StageKey] ?? [];
  return getStage(stage).checklist.map((text, i) => ({
    item: i,
    text,
    done: Boolean(map[`${stage}:${i}`]),
    by: typeof map[`by:${stage}:${i}`] === "string" ? (map[`by:${stage}:${i}`] as string) : null,
    note: typeof map[`note:${stage}:${i}`] === "string" ? (map[`note:${stage}:${i}`] as string) : "",
    humanOnly: human.includes(i),
  }));
}

export function checklistProgress(stage: string, checklistJson: string) {
  const items = getStage(stage).checklist;
  let done = 0;
  try {
    const map = JSON.parse(checklistJson) as Record<string, boolean>;
    items.forEach((_, i) => {
      if (map[`${stage}:${i}`]) done++;
    });
  } catch {}
  return { done, total: items.length };
}
