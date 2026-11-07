import type { Comment } from "@/db";
import { linkMentions } from "@/lib/mentions";
import { Markdown } from "./client";
import { Avatar, timeAgo } from "./ui";

/** One comment. Its anchor is what notifications link to, and :target highlights it on arrival. */
export function CommentItem({ comment, usernames, context }: { comment: Comment; usernames: string[]; context?: React.ReactNode }) {
  return (
    <div id={`comment-${comment.id}`} className="-m-1.5 flex scroll-mt-20 gap-2.5 rounded-2xl p-1.5 target:bg-accent/10 target:ring-2 target:ring-accent/50">
      <Avatar username={comment.author} size={24} />
      <div className="min-w-0 flex-1">
        <div className="text-xs">
          <span className="font-medium">{comment.author}</span> {context} <span className="text-faint">{timeAgo(comment.createdAt)}</span>
        </div>
        <div className="mt-0.5 rounded-2xl rounded-tl-md bg-panel-2 px-3 py-1.5 text-[13px]">
          <Markdown>{linkMentions(comment.body, usernames)}</Markdown>
        </div>
      </div>
    </div>
  );
}
