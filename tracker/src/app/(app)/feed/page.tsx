import { addCommentAction } from "@/app/actions";
import { FeedItems } from "@/components/FeedItems";
import { MentionInput, SubmitButton } from "@/components/client";
import { Empty, PageHeader } from "@/components/ui";
import { listUsers, requireUser } from "@/lib/auth";
import { loadFeed } from "@/lib/comments";

export default async function FeedPage() {
  await requireUser();
  const [items, users] = await Promise.all([loadFeed(), listUsers()]);
  const usernames = users.map((u) => u.username);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Feed" subtitle="Team comments and everything that's been done, newest first." />
      <form action={addCommentAction.bind(null, null)} className="card mb-4 space-y-2 p-4">
        <MentionInput users={users.filter((u) => u.active)} label="Post to the team" placeholder="Post an update. Type @ to tag someone." />
        <div className="flex justify-end">
          <SubmitButton className="btn btn-primary btn-sm" pendingText="Posting…">Post</SubmitButton>
        </div>
      </form>
      {items.length === 0 && <Empty>Nothing yet.</Empty>}
      {items.length > 0 && (
        <div className="card p-5">
          <FeedItems items={items} usernames={usernames} />
        </div>
      )}
    </div>
  );
}
