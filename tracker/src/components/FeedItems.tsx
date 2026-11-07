import Link from "next/link";
import type { loadFeed } from "@/lib/comments";
import { CommentItem } from "./CommentItem";
import { Avatar, timeAgo } from "./ui";

/** Comments and history in one list. On an episode's own page, showEpisode is off because it's all that episode. */
export function FeedItems({ items, usernames, showEpisode = true }: { items: Awaited<ReturnType<typeof loadFeed>>; usernames: string[]; showEpisode?: boolean }) {
  return (
    <ol className="space-y-4">
      {items.map((item) => {
        if ("comment" in item) {
          const onEpisode = showEpisode && item.comment.episodeId && (
            <span className="text-muted">
              on <Link href={`/episodes/${item.comment.episodeId}`} className="font-medium text-accent">{item.code}</Link>
            </span>
          );
          return <li key={`c${item.comment.id}`}><CommentItem comment={item.comment} usernames={usernames} context={onEpisode} /></li>;
        }
        const message = <span className="text-muted"><span className="font-medium text-fg">{item.event.actor}</span> {item.event.message}</span>;
        return (
          <li key={`a${item.event.id}`} className="flex gap-2.5 text-xs">
            <Avatar username={item.event.actor} size={24} />
            <span className="min-w-0 flex-1 self-center">
              {showEpisode && item.event.episodeId ? <Link href={`/episodes/${item.event.episodeId}`} className="hover:underline">{message}</Link> : message}
            </span>
            <span className="shrink-0 self-center text-faint">{timeAgo(item.at)}</span>
          </li>
        );
      })}
    </ol>
  );
}
