"use client";

import { CalendarDays, CircleCheck } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveEpisodeAction } from "@/app/actions";
import type { Episode, Series } from "@/db";
import { canMove, checklistProgress, getStage, isFormat, makeSteps, stageIndex, STAGES, stepStage, type Format } from "@/lib/stages";
import { useDialog } from "./Dialog";
import { Avatar, ChangesBadge, formatDate, PriorityDot, ReadyBadge, stageColor } from "./ui";

export function Board({ episodes, series, changesRequested, sendBacks }: {
  episodes: Episode[];
  series: Series[];
  /** Episodes with open "request changes" notes on their current stage. */
  changesRequested: number[];
  /** Episode id → earlier stage its current stage says needs fixes. */
  sendBacks: Record<number, string>;
}) {
  // Server data is the source of truth; a drop shows instantly until the action + refresh lands.
  const [items, applyMove] = useOptimistic(
    episodes,
    (current, move: { id: number; stage: string; position: number }) =>
      current.map((e) =>
        e.id === move.id
          ? { ...e, stage: move.stage, position: move.position, readyForReview: e.stage === move.stage && e.readyForReview }
          : e,
      ),
  );
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dialog = useDialog();
  const seriesById = new Map(series.map((s) => [s.id, s]));
  const dragging = dragId === null ? null : items.find((e) => e.id === dragId);
  const formatOf = (e: Episode): Format => {
    const f = e.seriesId ? seriesById.get(e.seriesId)?.format : null;
    return isFormat(f) ? f : "video";
  };

  async function drop(stage: string, beforeId: number | null) {
    if (dragId === null) return;
    const card = items.find((e) => e.id === dragId);
    if (!card) return;
    setDragId(null);
    setOverStage(null);
    if (!canMove(card.stage, stage, formatOf(card))) {
      const near = [stepStage(card.stage, formatOf(card), -1), stepStage(card.stage, formatOf(card))].filter(Boolean);
      await dialog.alert({
        title: "Move one stage at a time",
        message: `${card.code} can only go to ${near.map((s) => s!.label).join(" or ")}${formatOf(card) === "carousel" ? " (carousels skip Voiceover and Animation)" : ""}.`,
      });
      return;
    }
    if (stageIndex(stage) > stageIndex(card.stage)) {
      const { done, total } = checklistProgress(card.stage, card.checklist);
      const ok =
        done === total ||
        (await dialog.confirm({
          title: `${total - done} ${getStage(card.stage).label} checklist item${total - done === 1 ? "" : "s"} still open`,
          message: `Move ${card.code} to ${getStage(stage).label} anyway?`,
          confirmLabel: "Move anyway",
        }));
      if (!ok) return;
    }
    const column = items.filter((e) => e.stage === stage && e.id !== card.id).sort((a, b) => a.position - b.position);
    let position: number;
    const idx = beforeId === null ? -1 : column.findIndex((e) => e.id === beforeId);
    if (idx === -1) position = (column.at(-1)?.position ?? 0) + 1;
    else position = idx === 0 ? column[0].position - 1 : (column[idx - 1].position + column[idx].position) / 2;

    const id = card.id;
    startTransition(async () => {
      applyMove({ id, stage, position });
      await moveEpisodeAction(id, stage, position);
    });
  }

  return (
    <div className="scroll-thin -mx-5 flex gap-3 overflow-x-auto px-5 pb-6 md:-mx-10 md:px-10">
      {STAGES.map((stage) => {
        const column = items.filter((e) => e.stage === stage.key).sort((a, b) => a.position - b.position);
        const reachable = !dragging || canMove(dragging.stage, stage.key, formatOf(dragging));
        const isOver = overStage === stage.key && reachable;
        return (
          <section
            key={stage.key}
            id={stage.key}
            onDragOver={(e) => {
              if (!reachable) return; // not a drop target, so the browser shows "no drop"
              e.preventDefault();
              setOverStage(stage.key);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop(stage.key, null);
            }}
            className={`flex w-[272px] shrink-0 flex-col rounded-[18px] p-2 transition-colors ${
              isOver ? "bg-accent/10 ring-2 ring-accent/40" : "bg-fg/[0.035]"
            } ${reachable ? "" : "opacity-40"}`}
          >
            <header className="flex items-center gap-2 px-2 pb-2.5 pt-1.5" title={stage.description}>
              <span className="size-2 rounded-full" style={{ background: stageColor(stage.key) }} />
              <h2 className="text-[13px] font-semibold tracking-tight">{stage.label}</h2>
              <span className="ml-auto rounded-full bg-fg/[0.06] px-2 py-px text-[11px] font-medium text-muted tabular-nums">
                {column.length}
              </span>
            </header>
            <div className="flex min-h-24 flex-1 flex-col gap-2">
              {column.map((ep) => {
                const s = ep.seriesId ? seriesById.get(ep.seriesId) : null;
                const progress = checklistProgress(ep.stage, ep.checklist);
                const complete = progress.done === progress.total;
                return (
                  <article
                    key={ep.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(ep.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverStage(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      drop(stage.key, ep.id);
                    }}
                    className={`card group relative cursor-pointer rounded-[14px] p-3 transition-all hover:shadow-[var(--shadow-lg)] active:cursor-grabbing ${
                      dragId === ep.id ? "scale-[0.98] opacity-40" : ""
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <PriorityDot priority={ep.priority} />
                      <span className="font-mono text-[10px] text-faint">{ep.code}</span>
                      {ep.publishDate && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-muted tabular-nums">
                          <CalendarDays className="size-3" strokeWidth={2} />
                          {formatDate(ep.publishDate)}
                        </span>
                      )}
                    </div>
                    {(ep.readyForReview || changesRequested.includes(ep.id) || sendBacks[ep.id]) && (
                      <div className="mb-1.5 flex flex-wrap gap-1">
                        {sendBacks[ep.id] && <ChangesBadge label={`Fixes for ${sendBacks[ep.id]}`} />}
                        {changesRequested.includes(ep.id) ? <ChangesBadge /> : ep.readyForReview && <ReadyBadge />}
                      </div>
                    )}
                    <Link
                      href={`/episodes/${ep.id}`}
                      draggable={false}
                      // Stretched link: its ::after covers the whole card, so a click anywhere opens the episode.
                      // draggable={false} hands drags to the card, so cards still move between stages.
                      className="block text-[13px] font-medium leading-snug tracking-tight group-hover:text-accent after:absolute after:inset-0 after:rounded-[14px]"
                    >
                      {ep.title}
                    </Link>
                    {ep.stage === "make" && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {makeSteps(formatOf(ep), ep).map((step) => (
                          <span
                            key={step.label}
                            className={`rounded-full px-1.5 py-px text-[10px] font-medium ${step.done ? "bg-ok/15 text-ok" : "bg-fg/[0.06] text-faint"}`}
                          >
                            {step.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {s && (
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                          <span className="size-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
                          <span className="truncate">{s.name}</span>
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium tabular-nums ${complete ? "text-ok" : "text-faint"}`}
                          title="Stage checklist"
                        >
                          <CircleCheck className="size-3" strokeWidth={2.2} />
                          {progress.done}/{progress.total}
                        </span>
                        <Avatar username={ep.owner} size={18} />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
