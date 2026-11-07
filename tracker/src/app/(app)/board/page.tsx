import { Plus } from "lucide-react";
import Link from "next/link";
import { isNull } from "drizzle-orm";
import { db, feedback, series as seriesTable } from "@/db";
import { Board } from "@/components/Board";
import { PageHeader } from "@/components/ui";
import { listUsers, requireUser } from "@/lib/auth";
import { listEpisodes, parseSendBack } from "@/lib/episodes";
import { getStage } from "@/lib/stages";

export default async function BoardPage({ searchParams }: PageProps<"/board">) {
  await requireUser();
  const { series: s, owner } = await searchParams;
  const seriesId = Number(s) || undefined;
  const ownerFilter = typeof owner === "string" ? owner : undefined;
  const [items, seriesList, openNotes] = await Promise.all([
    listEpisodes({ seriesId, owner: ownerFilter }),
    db.select().from(seriesTable),
    db.select({ episodeId: feedback.episodeId, stage: feedback.stage }).from(feedback).where(isNull(feedback.addressedIn)),
  ]);
  const stageOf = new Map(items.map((e) => [e.id, e.stage]));
  const sendBacks = Object.fromEntries(
    items.flatMap((e) => {
      const p = parseSendBack(e);
      return p ? [[e.id, getStage(p.stage).label]] : [];
    }),
  );
  const changesRequested = [...new Set(openNotes.filter((n) => stageOf.get(n.episodeId) === n.stage).map((n) => n.episodeId))];

  const query = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { series: seriesId ? String(seriesId) : undefined, owner: ownerFilter, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/board?${qs}` : "/board";
  };

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Drag cards between stages. Each card shows its checklist progress.">
        <Link href="/ideas" className="btn btn-primary">
          <Plus className="size-4" strokeWidth={2.2} /> New Idea
        </Link>
      </PageHeader>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="segmented">
          <Link href={query({ series: undefined })} data-active={!seriesId}>All Series</Link>
          {seriesList.map((x) => (
            <Link key={x.id} href={query({ series: String(x.id) })} data-active={seriesId === x.id}>
              <span className="size-2 rounded-full" style={{ background: x.color }} />
              {x.name}
            </Link>
          ))}
        </div>
        <div className="segmented">
          <Link href={query({ owner: undefined })} data-active={!ownerFilter}>Everyone</Link>
          {(await listUsers()).filter((u) => u.active).map((u) => (
            <Link key={u.username} href={query({ owner: u.username })} data-active={ownerFilter === u.username}>
              {u.name}
            </Link>
          ))}
        </div>
      </div>
      <Board episodes={items} series={seriesList} changesRequested={changesRequested} sendBacks={sendBacks} />
    </div>
  );
}
