import { ArrowRight, Lightbulb, Plus, Quote } from "lucide-react";
import Link from "next/link";
import { createEpisodeAction, moveEpisodeAction } from "@/app/actions";
import { db, series as seriesTable } from "@/db";
import { SubmitButton } from "@/components/client";
import { Avatar, PageHeader, PriorityDot, SeriesTag, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listEpisodes } from "@/lib/episodes";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as Record<string, number>;

export default async function IdeasPage({ searchParams }: PageProps<"/ideas">) {
  const user = await requireUser();
  const { series: seriesFilter } = await searchParams;
  const seriesId = Number(seriesFilter) || undefined;
  const [ideas, seriesList] = await Promise.all([
    listEpisodes({ stage: "idea", seriesId }),
    db.select().from(seriesTable),
  ]);
  const seriesById = new Map(seriesList.map((s) => [s.id, s]));
  ideas.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  return (
    <div>
      <PageHeader title="Ideas" subtitle="Capture every idea in detail. Promote the best ones into research.">
        <form action={createEpisodeAction}>
          <input type="hidden" name="_open" value="1" />
          <input type="hidden" name="owner" value={user.username} />
          {seriesId && <input type="hidden" name="seriesId" value={seriesId} />}
          <SubmitButton pendingText="Adding…">
            <Plus className="size-4" strokeWidth={2.2} /> Add Idea
          </SubmitButton>
        </form>
      </PageHeader>

        <div>
          <div className="mb-5 overflow-x-auto">
            <div className="segmented">
              <Link href="/ideas" data-active={!seriesId}>All <span className="text-faint">{!seriesId ? ideas.length : ""}</span></Link>
              {seriesList.map((s) => (
                <Link key={s.id} href={`/ideas?series=${s.id}`} data-active={seriesId === s.id}>
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          {ideas.length === 0 && (
            <div className="card flex flex-col items-center gap-3 p-14 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-panel-2 text-faint">
                <Lightbulb className="size-6" strokeWidth={1.6} />
              </span>
              <p className="text-[15px] font-medium">No ideas yet</p>
              <p className="text-[13px] text-muted">Add your first one with the Add Idea button.</p>
            </div>
          )}

          {ideas.length > 0 && (
            <div className="hidden grid-cols-[minmax(0,1fr)_170px_150px_150px] gap-6 px-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-faint lg:grid">
              <span>Idea</span>
              <span>Series</span>
              <span>Owner</span>
              <span />
            </div>
          )}
          <div className="space-y-3">
            {ideas.map((idea) => (
              <article
                key={idea.id}
                className="card grid gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lg)] lg:grid-cols-[minmax(0,1fr)_170px_150px_150px] lg:items-center lg:gap-6 lg:px-6"
              >
                <div className="min-w-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <PriorityDot priority={idea.priority} />
                    <span className="font-mono text-[11px] text-faint">{idea.code}</span>
                  </div>
                  <Link href={`/episodes/${idea.id}`} className="text-[15px] font-semibold leading-snug tracking-tight hover:text-accent">
                    {idea.title}
                  </Link>
                  {idea.hook && (
                    <p className="mt-1.5 flex gap-1.5 text-[13px] text-muted">
                      <Quote className="mt-0.5 size-3 shrink-0 text-faint" strokeWidth={2} />
                      <span className="italic">{idea.hook}</span>
                    </p>
                  )}
                  {idea.summary && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{idea.summary}</p>}
                </div>
                <div>
                  <SeriesTag series={idea.seriesId ? seriesById.get(idea.seriesId) : null} />
                </div>
                <div className="flex items-center gap-2">
                  <Avatar username={idea.owner} size={20} />
                  <span className="text-xs text-faint">{timeAgo(idea.createdAt)}</span>
                </div>
                <form action={moveEpisodeAction.bind(null, idea.id, "research")} className="lg:justify-self-end">
                  <SubmitButton className="btn btn-sm" pendingText="Moving…">
                    Start Research <ArrowRight className="size-3.5" strokeWidth={2.2} />
                  </SubmitButton>
                </form>
              </article>
            ))}
          </div>
        </div>
    </div>
  );
}
