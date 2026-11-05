/** Idea fields AI can fill in, with what each should hold. Series and title are always a person's call. */
export const IDEA_FILL_FIELDS = {
  hook: { label: "Hook", brief: "One spoken line for the first 2 seconds, at most 14 words, that stops the scroll." },
  summary: { label: "Details", brief: "2 or 3 sentences: the story, and what a viewer walks away with." },
  whyNow: { label: "Why now", brief: "1 or 2 sentences on why people would watch and share this. Don't mention recent events." },
  audience: { label: "Audience", brief: "One sentence naming who this is for." },
  keyPoints: { label: "Key points", brief: "3 to 5 Markdown bullets naming the ideas to cover." },
  visualIdeas: { label: "Visual ideas", brief: "2 or 3 Markdown bullets that fit the series' visual style." },
  tags: { label: "Tags", brief: "3 to 6 lowercase tags, comma separated." },
} as const;

export type IdeaFillField = keyof typeof IDEA_FILL_FIELDS;

const FIELD_KEYS = Object.keys(IDEA_FILL_FIELDS) as IdeaFillField[];

export function emptyIdeaFields(idea: Record<IdeaFillField, string>) {
  return FIELD_KEYS.filter((f) => !idea[f].trim());
}
