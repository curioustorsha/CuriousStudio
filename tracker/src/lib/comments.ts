import "server-only";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { activity, comments, db, episodes, notifications } from "@/db";
import { listUsers } from "./auth";
import { mentionedUsernames } from "./mentions";

const MAX_COMMENT_LENGTH = 5000;
const FEED_ACTIVITY_LIMIT = 200;

/** Posts a comment on an episode, or on the team feed when episodeId is null. Everyone tagged gets one notification. */
export async function addComment(author: string, body: string, episodeId: number | null) {
  const text = body.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!text) return;
  const active = (await listUsers()).filter((u) => u.active).map((u) => u.username);
  const [comment] = await db.insert(comments).values({ author, body: text, episodeId }).returning();
  const tagged = mentionedUsernames(text, active).filter((u) => u !== author);
  if (tagged.length) await db.insert(notifications).values(tagged.map((recipient) => ({ recipient, actor: author, commentId: comment.id })));
}

export function commentHref(comment: { id: number; episodeId: number | null }) {
  return `${comment.episodeId ? `/episodes/${comment.episodeId}` : "/feed"}#comment-${comment.id}`;
}

/** The team feed, or one episode's when given its id. */
export async function loadFeed(episodeId?: number) {
  // shortcut: every comment loads but only recent activity, fine for a team of 10; paginate if the page gets slow.
  const [posts, events] = await Promise.all([
    db
      .select({ comment: comments, code: episodes.code })
      .from(comments)
      .leftJoin(episodes, eq(comments.episodeId, episodes.id))
      .where(episodeId ? eq(comments.episodeId, episodeId) : undefined),
    db
      .select({ event: activity, code: episodes.code })
      .from(activity)
      .leftJoin(episodes, eq(activity.episodeId, episodes.id))
      .where(episodeId ? eq(activity.episodeId, episodeId) : undefined)
      .orderBy(desc(activity.id))
      .limit(FEED_ACTIVITY_LIMIT),
  ]);
  return [...posts.map((p) => ({ ...p, at: p.comment.createdAt })), ...events.map((e) => ({ ...e, at: e.event.createdAt }))].sort((a, b) =>
    b.at.localeCompare(a.at),
  );
}

/** Comment count per episode, for lists. */
export async function commentCounts() {
  const rows = await db
    .select({ episodeId: comments.episodeId, n: sql<number>`count(*)` })
    .from(comments)
    .where(isNotNull(comments.episodeId))
    .groupBy(comments.episodeId);
  return new Map(rows.map((r) => [r.episodeId, r.n]));
}

export async function unreadCount(username: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.recipient, username), isNull(notifications.readAt)));
  return row.n;
}

export function listNotifications(username: string) {
  return db
    .select({ notification: notifications, comment: comments, code: episodes.code })
    .from(notifications)
    .leftJoin(comments, eq(notifications.commentId, comments.id))
    .leftJoin(episodes, eq(comments.episodeId, episodes.id))
    .where(eq(notifications.recipient, username))
    .orderBy(desc(notifications.id));
}

/** Marks the notification read and says where its comment is. Null if it isn't this user's. */
export async function openNotification(username: string, id: number) {
  const [row] = await db
    .select({ comment: comments, href: notifications.href })
    .from(notifications)
    .leftJoin(comments, eq(notifications.commentId, comments.id))
    .where(and(eq(notifications.id, id), eq(notifications.recipient, username)));
  if (!row) return null;
  await db.update(notifications).set({ readAt: sql`(datetime('now'))` }).where(and(eq(notifications.id, id), isNull(notifications.readAt)));
  return row.comment ? commentHref(row.comment) : row.href || null;
}

export async function markAllRead(username: string) {
  await db
    .update(notifications)
    .set({ readAt: sql`(datetime('now'))` })
    .where(and(eq(notifications.recipient, username), isNull(notifications.readAt)));
}
