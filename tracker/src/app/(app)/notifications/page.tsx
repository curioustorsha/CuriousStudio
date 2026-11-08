import { Bell } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions";
import { SubmitButton } from "@/components/client";
import { Avatar, Empty, PageHeader, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/comments";

export default async function NotificationsPage() {
  const user = await requireUser();
  const rows = await listNotifications(user.username);
  const unread = rows.filter((r) => !r.notification.readAt).length;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : "You're all caught up."}>
        {unread > 0 && (
          <form action={markAllNotificationsReadAction}>
            <SubmitButton className="btn btn-ghost btn-sm" pendingText="Marking…">Mark All as Read</SubmitButton>
          </form>
        )}
      </PageHeader>
      {rows.length === 0 && <Empty icon={<Bell className="size-5" strokeWidth={1.8} />}>When someone tags you in a comment, or a job you started finishes, it shows up here.</Empty>}
      <ul className="space-y-2">
        {rows.map(({ notification: n, comment, code }) => (
          <li key={n.id}>
            {/* Plain <a>: see the route handler. Next's <Link> would prefetch it and mark it read unopened. */}
            <a href={`/notifications/${n.id}`} className={`card flex gap-3 p-4 transition-colors hover:bg-fg/[0.04] ${n.readAt ? "opacity-70" : ""}`}>
              <Avatar username={n.actor} size={28} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px]">
                  {comment ? (
                    <>
                      <span className="font-semibold">{n.actor}</span> tagged you {code ? `on ${code}` : "in the feed"}
                    </>
                  ) : (
                    n.message
                  )}
                  {!n.readAt && <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">New</span>}
                </div>
                {comment && <p className="mt-0.5 truncate text-[13px] text-muted">{comment.body}</p>}
              </div>
              <span className="shrink-0 text-xs text-faint">{timeAgo(n.createdAt)}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
