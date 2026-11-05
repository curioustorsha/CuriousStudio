import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { saveSeriesAction } from "@/app/actions";
import { db, episodes, series as seriesTable, type Series } from "@/db";
import { MarkdownField, SubmitButton } from "@/components/client";
import { cadenceLabel, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { FORMAT_LABELS, FORMATS } from "@/lib/stages";
import { styleLabel, VISUAL_STYLES } from "@/lib/styles";

const DAYS = [
  [1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"],
] as const;

export default async function SeriesPage() {
  await requireUser();
  const [list, all] = await Promise.all([db.select().from(seriesTable), db.select({ seriesId: episodes.seriesId }).from(episodes)]);
  const perWeek = list.reduce((n, s) => n + s.cadenceDays.split(",").filter(Boolean).length, 0);

  return (
    <div>
      <PageHeader
        title="Series"
        subtitle={`Each series has a fixed day, colour and format. Current plan: ${perWeek} posts per week.`}
      />
      <div className="space-y-4">
        {list.map((s) => (
          <SeriesForm key={s.id} series={s} count={all.filter((e) => e.seriesId === s.id).length} />
        ))}
        <details className="card p-5">
          <summary className="flex cursor-pointer items-center gap-2 text-[15px] font-medium text-accent">
            <span className="grid size-7 place-items-center rounded-full bg-accent/12">
              <Plus className="size-4" strokeWidth={2.2} />
            </span>
            Add a Series
          </summary>
          <div className="mt-5">
            <SeriesForm />
          </div>
        </details>
      </div>
    </div>
  );
}

function SeriesForm({ series, count }: { series?: Series; count?: number }) {
  const days = new Set((series?.cadenceDays ?? "").split(",").filter(Boolean).map(Number));
  const body = (
    <form action={saveSeriesAction} className="space-y-4">
      {series && <input type="hidden" name="id" value={series.id} />}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_80px]">
        <div>
          <label className="label">Name</label>
          <input name="name" defaultValue={series?.name} required className="input" />
        </div>
        <div>
          <label className="label">Code prefix</label>
          <input name="prefix" defaultValue={series?.prefix} required maxLength={5} className="input font-mono uppercase" placeholder="HIS" />
        </div>
        <div>
          <label className="label">Colour</label>
          <input type="color" name="color" defaultValue={series?.color ?? "#0a84ff"} className="h-[38px] w-full cursor-pointer rounded-[10px] bg-panel-2 p-1" />
        </div>
      </div>
      <div>
        <span className="label">Publishes on</span>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map(([n, label]) => (
            <label key={n} className="cursor-pointer">
              <input type="checkbox" name="cadenceDays" value={n} defaultChecked={days.has(n)} className="peer sr-only" />
              <span className="inline-block rounded-full bg-panel-2 px-3.5 py-1.5 text-xs font-medium text-muted transition-colors peer-checked:bg-accent peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Format</label>
          <select name="format" defaultValue={series?.format ?? "video"} className="input">
            {FORMATS.map((f) => (
              <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-faint">Every series has the same stages. The format decides what Make builds: voiceover and animation, or slides.</p>
        </div>
        <div>
          <label className="label">Visual style</label>
          <select name="visualStyle" defaultValue={series?.visualStyle ?? ""} className="input">
            <option value="">Not set</option>
            {VISUAL_STYLES.map((v) => (
              <option key={v.key} value={v.key}>{v.label}: {v.hint}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-faint">The make skill follows this style&apos;s rules.</p>
        </div>
      </div>
      <div className="sm:max-w-[calc(50%-6px)]">
        <label className="label">Target length (seconds)</label>
        <input type="number" name="targetSeconds" defaultValue={series?.targetSeconds ?? 60} min={10} max={180} required className="input" />
        <p className="mt-1 text-[11px] text-faint">Applies to every video in this series. Carousels ignore it.</p>
      </div>
      <div>
        <label className="label">What it is</label>
        <textarea name="description" defaultValue={series?.description} rows={2} className="input" />
      </div>
      <MarkdownField
        name="formatNotes"
        label="Playbook: structure, depth, tone, visuals, links between episodes"
        defaultValue={series?.formatNotes ?? ""}
        rows={14}
        hint="Every skill reads this before working on the series. Series rules live here, so a new series needs only a playbook."
      />
      <div className="flex justify-end">
        <SubmitButton>{series ? "Save Series" : "Create Series"}</SubmitButton>
      </div>
    </form>
  );

  if (!series) return body;
  return (
    <details className="card p-5">
      <summary className="flex cursor-pointer items-center gap-3">
        <ChevronRight className="chevron-rotate size-4 text-faint transition-transform" strokeWidth={2.2} />
        <span
          className="grid size-8 place-items-center rounded-[9px] font-mono text-[10px] font-semibold text-white"
          style={{ background: series.color }}
        >
          {series.prefix}
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-tight">{series.name}</div>
          <div className="truncate text-xs text-muted">{series.description}</div>
        </div>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-xs text-muted sm:inline-flex">
          <CalendarDays className="size-3.5" strokeWidth={2} />
          {cadenceLabel(series.cadenceDays)} · {series.format === "carousel" ? "Carousel" : "Video"} · {styleLabel(series.visualStyle)} · {count} episodes
        </span>
        <Link
          href={`/board?series=${series.id}`}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] text-accent hover:opacity-80"
        >
          Board <ChevronRight className="size-3.5" strokeWidth={2.2} />
        </Link>
      </summary>
      <div className="mt-5 border-t border-line pt-5">{body}</div>
    </details>
  );
}
