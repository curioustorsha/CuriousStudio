import { ArrowRight, Lightbulb, MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { createEpisodeAction, deleteIdeaAction, moveEpisodeAction } from "@/app/actions";
import { db, series as seriesTable } from "@/db";
import { AutoSubmitSelect, FillIdeasButton, SelectAllIdeas, SubmitButton } from "@/components/client";
import { PageHeader, PriorityDot, ReadyBadge, SeriesTag, StageBadge, timeAgo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { commentCounts } from "@/lib/comments";
import { listEpisodes } from "@/lib/episodes";
import { FORMATS, isStage, PRIORITIES, STAGES } from "@/lib/stages";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as Record<string, number>;
const FORMAT_NAMES = { video: "Video", carousel: "Carousel" };
const FILTER_STYLE = { height: 34, fontSize: 13, paddingTop: 0, paddingBottom: 0 };

const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default async function IdeasPage({ searchParams }: PageProps<"/ideas">) {
  const user = await requireUser();
  const params = await searchParams;
  const seriesId = Number(params.series) || undefined;
  const stage = isStage(param(params.stage)) ? param(params.stage) : "";
  const priority = param(params.priority);
  const format = param(params.format);
  const query = param(params.q).trim();
  const filtered = Boolean(seriesId || stage || priority || format || query);

  const counts = await commentCounts();
  const [all, seriesList] = await Promise.all([listEpisodes({ seriesId, stage: stage || undefined }), db.select().from(seriesTable)]);
  const seriesById = new Map(seriesList.map((s) => [s.id, s]));
  const needle = query.toLowerCase();
  const ideas = all
    .filter((idea) => !priority || idea.priority === priority)
    .filter((idea) => !format || (idea.seriesId && seriesById.get(idea.seriesId)?.format === format))
    .filter((idea) => !needle || [idea.code, idea.title, idea.hook, idea.summary, idea.tags].some((text) => text.toLowerCase().includes(needle)))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));

  return (
    <div>
      <PageHeader title="Ideas" subtitle="Every idea and how far it has got. Promote the best ones into Research & Script.">
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
        {/* Remounts when the URL changes so the fields always show the filters in force, including after Clear. */}
        <Form key={JSON.stringify([seriesId, stage, priority, format, query])} action="/ideas" className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" strokeWidth={2} />
            <input name="q" type="search" defaultValue={query} placeholder="Search, then press Enter" aria-label="Search ideas" className="input" style={{ ...FILTER_STYLE, paddingLeft: 30 }} />
          </div>
          <div className="w-[140px]">
            <AutoSubmitSelect name="series" defaultValue={seriesId ?? ""} aria-label="Series" className="input" style={FILTER_STYLE}>
              <option value="">All series</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div className="w-[125px]">
            <AutoSubmitSelect name="stage" defaultValue={stage} aria-label="Stage" className="input" style={FILTER_STYLE}>
              <option value="">All stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div className="w-[125px]">
            <AutoSubmitSelect name="priority" defaultValue={priority} aria-label="Priority" className="input" style={FILTER_STYLE}>
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{capitalize(p)}</option>
              ))}
            </AutoSubmitSelect>
          </div>
          <div className="w-[120px]">
            <AutoSubmitSelect name="format" defaultValue={format} aria-label="Format" className="input" style={FILTER_STYLE}>
              <option value="">Any format</option>
              {FORMATS.map((f) => (
                <option key={f} value={f}>{FORMAT_NAMES[f]}</option>
              ))}
            </AutoSubmitSelect>
          </div>
          {filtered && (
            <Link href="/ideas" className="btn btn-sm">Clear</Link>
          )}
          <span className="ml-auto text-xs text-faint">{ideas.length} {ideas.length === 1 ? "idea" : "ideas"}</span>
        </Form>

        {ideas.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-14 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-panel-2 text-faint">
              <Lightbulb className="size-6" strokeWidth={1.6} />
            </span>
            <p className="text-[15px] font-medium">{filtered ? "No ideas match these filters" : "No ideas yet"}</p>
            <p className="text-[13px] text-muted">{filtered ? "Change or clear the filters to see more." : "Add your first one with the Add Idea button."}</p>
          </div>
        ) : (
          <>
          <div className="mb-3">
            <FillIdeasButton formId="fill-selected" label="Fill empty fields with AI" />
          </div>
          <div className="card overflow-x-auto">
            {/* Column shares of the width: 36 · 88 · 360 · 116 · 110 · 64 · 154 out of 928 */}
            <table className="w-full min-w-[800px] table-fixed border-collapse text-[13px]">
              <colgroup>
                <col className="w-[3.9%]" />
                <col className="w-[9.5%]" />
                <col className="w-[38.8%]" />
                <col className="w-[12.5%]" />
                <col className="w-[11.8%]" />
                <col className="w-[6.9%]" />
                <col className="w-[16.6%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-fg/10 text-[10px] font-semibold uppercase tracking-wide text-faint">
                  <th scope="col" className="py-2.5 pl-4">
                    <SelectAllIdeas
                      formId="fill-selected"
                      syncKey={ideas.map((idea) => idea.id).join()}
                    />
                  </th>
                  <th scope="col" className="py-2.5 pl-2 pr-2 text-left font-semibold">ID</th>
                  <th scope="col" className="px-2 py-2.5 text-left font-semibold">Idea</th>
                  <th scope="col" className="px-2 py-2.5 text-left font-semibold">Series</th>
                  <th scope="col" className="px-2 py-2.5 text-left font-semibold">Stage</th>
                  <th scope="col" className="px-2 py-2.5 text-left font-semibold">Added</th>
                  <th scope="col" className="px-3 py-2.5"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {ideas.map((idea) => (
                  <tr key={idea.id} className="border-b border-fg/5 transition-colors last:border-b-0 hover:bg-fg/[0.03]">
                    <td className="py-2 pl-4">
                      <input type="checkbox" name="ids" value={idea.id} form="fill-selected" aria-label={`Select ${idea.code}`} className="check-round block" />
                    </td>
                    <td className="whitespace-nowrap py-2 pl-2 pr-2 font-mono text-xs text-muted">{idea.code}</td>
                    <td className="px-2 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <PriorityDot priority={idea.priority} />
                        <Link href={`/episodes/${idea.id}`} title={idea.hook || idea.summary || idea.title} className="min-w-0 truncate font-medium leading-snug hover:text-accent">
                          {idea.title}
                        </Link>
                        {idea.readyForReview && <ReadyBadge />}
                        {!!counts.get(idea.id) && (
                          <Link href={`/episodes/${idea.id}#feed`} aria-label={`${counts.get(idea.id)} comments on ${idea.code}`} className="flex shrink-0 items-center gap-1 text-xs text-muted hover:text-accent">
                            <MessageSquare className="size-3" strokeWidth={2} /> {counts.get(idea.id)}
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="truncate px-2 py-2">
                      <SeriesTag series={idea.seriesId ? seriesById.get(idea.seriesId) : null} />
                    </td>
                    <td className="px-2 py-2">
                      <StageBadge stage={idea.stage} />
                    </td>
                    <td className="truncate px-2 py-2 text-xs text-faint">{timeAgo(idea.createdAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {idea.stage === "idea" && (
                          <form action={moveEpisodeAction.bind(null, idea.id, "script")}>
                            <SubmitButton className="btn btn-sm whitespace-nowrap" pendingText="Moving…">
                              Research <ArrowRight className="size-3" strokeWidth={2.2} />
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteIdeaAction.bind(null, idea.id)}>
                          <SubmitButton
                            className="btn btn-ghost btn-danger btn-sm"
                            pendingText="…"
                            confirmText={`Delete ${idea.code}?`}
                            confirmMessage={`“${idea.title}” and everything saved on it in the tracker (research, script, versions, notes, run history) will be lost. This can't be undone.`}
                            confirmLabel="Delete"
                          >
                            <Trash2 className="size-3.5" strokeWidth={2} aria-label={`Delete ${idea.code}`} />
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
