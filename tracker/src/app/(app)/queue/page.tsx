import { LoaderCircle, Square } from "lucide-react";
import Link from "next/link";
import { stopRunAction } from "@/app/actions";
import { RunWatcher, SubmitButton } from "@/components/client";
import { Avatar, Empty, PageHeader, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { runLabel, loadQueue } from "@/lib/runner";

const STATUS_STYLE: Record<string, string> = { done: "text-ok", failed: "text-danger", stopped: "text-faint" };

type Row = Awaited<ReturnType<typeof loadQueue>>["live"][number];

function JobTitle({ row }: { row: Row }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate text-[14px] font-medium">
        <Link href={`/episodes/${row.run.episodeId}`} className="hover:text-accent">
          <span className="font-mono text-[13px]">{row.code}</span> {row.title}
        </Link>
      </div>
      <div className="text-xs text-muted">{runLabel(row.run)} · {row.run.startedBy}</div>
    </div>
  );
}

export default async function QueuePage() {
  await requireUser();
  const { live, recent } = await loadQueue();
  const running = live.find((r) => r.run.status === "running");
  const waiting = live.filter((r) => r.run.status === "queued");

  return (
    <div className="max-w-3xl">
      <PageHeader title="Queue" subtitle="Claude does one job at a time, first in, first out. The order can't be changed." />
      <div className="space-y-6">
        <section>
          <h2 className="section-title mb-3">Running Now</h2>
          {running ? (
            <div className="card flex items-center gap-3 p-4">
              <LoaderCircle className="size-5 shrink-0 animate-spin text-accent" strokeWidth={2} />
              <JobTitle row={running} />
              <span className="shrink-0 text-xs text-faint">Started {timeAgo(running.run.startedAt)}</span>
            </div>
          ) : (
            <Empty>Claude is free.</Empty>
          )}
        </section>

        <section>
          <h2 className="section-title mb-3">Waiting ({waiting.length})</h2>
          {waiting.length === 0 && <Empty>Nothing is waiting.</Empty>}
          <ol className="space-y-2">
            {waiting.map((row, i) => (
              <li key={row.run.id} className="card flex items-center gap-3 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-xs font-semibold tabular-nums" aria-label={`Number ${i + 1} in line`}>{i + 1}</span>
                <JobTitle row={row} />
                <span className="shrink-0 text-xs text-faint">Queued {timeAgo(row.run.queuedAt ?? row.run.startedAt)}</span>
                <form action={stopRunAction.bind(null, row.run.id)}>
                  <SubmitButton className="btn btn-ghost btn-sm" pendingText="Removing…" confirmText="Remove this job from the queue?" confirmMessage="Everything behind it moves up one place. To run it later, it joins the back of the line." confirmLabel="Remove">
                    <Square className="size-3" strokeWidth={2.4} /> Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="section-title mb-3">Recently Finished</h2>
          {recent.length === 0 && <Empty>No finished jobs yet.</Empty>}
          <ul className="space-y-2">
            {recent.map((row) => (
              <li key={row.run.id} className="card flex items-center gap-3 p-4">
                <Avatar username={row.run.startedBy} size={24} />
                <JobTitle row={row} />
                <span className={`shrink-0 text-xs font-medium capitalize ${STATUS_STYLE[row.run.status] ?? ""}`}>{row.run.status}</span>
                <span className="shrink-0 text-xs text-faint">{timeAgo(row.run.startedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {live.length > 0 && <RunWatcher />}
    </div>
  );
}
