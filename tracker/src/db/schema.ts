import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
};

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(), // stored on episodes, comments and activity, so it never changes
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"), // "admin" or "member"
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  // Sessions carry this number; bumping it signs the user out everywhere.
  sessionVersion: integer("session_version").notNull().default(0),
  // Login lockout: wrong passwords in a row, and when the account opens again after too many.
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: text("locked_until"), // ISO time
  ...timestamps,
});

export const series = sqliteTable("series", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  prefix: text("prefix").notNull().unique(), // used for episode codes, e.g. HIS-001
  color: text("color").notNull().default("#7c5cff"),
  // Comma-separated weekdays this series publishes on (0=Sun … 6=Sat), e.g. "1" or "5,0"
  cadenceDays: text("cadence_days").notNull().default(""),
  description: text("description").notNull().default(""),
  formatNotes: text("format_notes").notNull().default(""),
  // How episodes are made: "video" (narrated Short) or "carousel" (still slides). Decides which stages apply.
  format: text("format").notNull().default("video"),
  // Visual style the storyboard and animation/design skills follow (a key from VISUAL_STYLES in lib/styles.ts).
  visualStyle: text("visual_style").notNull().default(""),
  // Target length of a video episode in seconds. Carousels have no spoken length and ignore it.
  targetSeconds: integer("target_seconds").notNull().default(60),
  ...timestamps,
});

export const episodes = sqliteTable("episodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  seriesId: integer("series_id").references(() => series.id, { onDelete: "set null" }),
  stage: text("stage").notNull().default("idea"),
  priority: text("priority").notNull().default("medium"),
  owner: text("owner"),
  position: real("position").notNull().default(0),

  // Idea
  hook: text("hook").notNull().default(""),
  summary: text("summary").notNull().default(""),
  whyNow: text("why_now").notNull().default(""),
  audience: text("audience").notNull().default(""),
  keyPoints: text("key_points").notNull().default(""),
  visualIdeas: text("visual_ideas").notNull().default(""),
  tags: text("tags").notNull().default(""),

  // Research → Storyboard
  research: text("research").notNull().default(""),
  sources: text("sources").notNull().default(""),
  script: text("script").notNull().default(""),
  factcheck: text("factcheck").notNull().default(""),
  storyboard: text("storyboard").notNull().default(""),

  // Production
  folderPath: text("folder_path").notNull().default(""),
  voiceoverUrl: text("voiceover_url").notNull().default(""),
  renderUrl: text("render_url").notNull().default(""),
  productionNotes: text("production_notes").notNull().default(""),
  voiceoverNotes: text("voiceover_notes").notNull().default(""), // Voiceover stage report (pronunciation check)
  renderNotes: text("render_notes").notNull().default(""), // Make stage: animation notes
  reviewReport: text("review_report").notNull().default(""), // Review stage QA report
  slides: text("slides").notNull().default(""), // Design stage (carousel): one slide image path per line, in order
  designNotes: text("design_notes").notNull().default(""), // Design stage notes

  // Packaging
  ytTitle: text("yt_title").notNull().default(""),
  ytDescription: text("yt_description").notNull().default(""),
  igCaption: text("ig_caption").notNull().default(""),
  tiktokCaption: text("tiktok_caption").notNull().default(""),
  hashtags: text("hashtags").notNull().default(""),
  thumbnailNotes: text("thumbnail_notes").notNull().default(""),

  // Publish & analytics
  publishDate: text("publish_date"), // YYYY-MM-DD
  publishPlan: text("publish_plan").notNull().default(""), // Publish stage: times and upload kit per platform
  postedYt: text("posted_yt").notNull().default(""),
  postedIg: text("posted_ig").notNull().default(""),
  postedTiktok: text("posted_tiktok").notNull().default(""),
  views: integer("views"),
  likes: integer("likes"),
  shares: integer("shares"),
  avgRetention: real("avg_retention"), // percent
  analyticsNotes: text("analytics_notes").notNull().default(""),

  checklist: text("checklist").notNull().default("{}"), // JSON: { "research:0": true }
  // Set by Claude via the API when a stage's work is done; cleared when a person moves the stage.
  readyForReview: integer("ready_for_review", { mode: "boolean" }).notNull().default(false),
  // A skill's proposal to send the episode back to an earlier stage with fixes. JSON: { stage, from, notes } or "".
  sendBack: text("send_back").notNull().default(""),
  createdBy: text("created_by"),
  ...timestamps,
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Null for a post on the team feed.
  episodeId: integer("episode_id").references(() => episodes.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/** One per person tagged per comment, so five tags in five places are five notifications. */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipient: text("recipient").notNull(),
  actor: text("actor").notNull(),
  // A notification is about a comment (an @mention), or about jobs that finished when there's no comment.
  commentId: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  message: text("message").notNull().default(""), // run notifications only
  href: text("href").notNull().default(""), // run notifications only
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const activity = sqliteTable("activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episode_id").references(() => episodes.id, { onDelete: "cascade" }),
  actor: text("actor").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/** Snapshot of one stage's output fields each time they change: v1, v2, … per episode and stage. */
export const revisions = sqliteTable("revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(), // JSON: { research: "…", sources: "…" }
  author: text("author").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/** "Request changes" notes on a stage. Open until a new version from Claude addresses them. */
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  version: integer("version"), // the version being reviewed, if any
  body: text("body").notNull(),
  author: text("author").notNull(),
  addressedIn: integer("addressed_in"), // version that answered it; null = still open
  // Pinned notes: the moment in the render a reviewer tapped, and the scene that moment falls in.
  atSec: real("at_sec"),
  scene: text("scene"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

/** A stage skill run started from the UI. Claude Code runs in the background; its output streams to a log file. */
export const runs = sqliteTable("runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  skill: text("skill").notNull(),
  status: text("status").notNull().default("running"), // queued | running | done | failed | stopped
  pid: integer("pid"),
  result: text("result").notNull().default(""), // Claude's final message
  model: text("model"), // model the run was started on (--model)
  effort: text("effort"),
  // From Claude Code's result line once the run ends. costUsd is the API price of the run; on a subscription
  // that's what the work would have cost, not what was billed.
  costUsd: real("cost_usd"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cacheReadTokens: integer("cache_read_tokens"),
  cacheWriteTokens: integer("cache_write_tokens"),
  durationSec: integer("duration_sec"),
  billing: text("billing"), // "api-key" or "subscription": how the run was paid for
  startedBy: text("started_by").notNull(),
  queuedAt: text("queued_at"), // when it joined the queue; empty on runs from before the queue
  startedAt: text("started_at").notNull().default(sql`(datetime('now'))`), // reset when it leaves the queue
  finishedAt: text("finished_at"),
  // What the run did so far ({ steps, skillsUsed }), copied from its log on the Mac so the hosted site can show it.
  progress: text("progress").notNull().default(""),
  // Set while a queued job is held back for something other than its turn (ElevenLabs credits): why, for people.
  heldFor: text("held_for").notNull().default(""),
  notified: integer("notified", { mode: "boolean" }).notNull().default(false), // its starter has been told how it ended
});

/** Small app-wide settings edited from the UI: per-stage model overrides, monthly plan fees. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type Series = typeof series.$inferSelect;
export type Episode = typeof episodes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Activity = typeof activity.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Run = typeof runs.$inferSelect;
