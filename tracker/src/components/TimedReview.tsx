"use client";

import { MapPin, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addPinnedNoteAction, deletePinnedNoteAction } from "@/app/actions";
import { timecode } from "@/lib/timecode";

type Span = { id: string; from: number; to: number; text: string };
type Note = { id: number; atSec: number; scene: string | null; body: string; author: string };

/**
 * The render with a scene strip and notes pinned to moments in it. Pause (or don't) and tap "Add note": the note keeps
 * that moment and its scene, so the next Make run knows exactly what to change and can leave the rest of the video alone.
 */
export function TimedReview({ episodeId, src, poster, scenes, notes, canNote }: {
  episodeId: number;
  src: string;
  poster?: string;
  scenes: Span[];
  notes: Note[];
  canNote: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(0);
  const [draftAt, setDraftAt] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  const total = scenes.at(-1)?.to ?? 0;
  const current = scenes.find((s) => now < s.to) ?? scenes.at(-1);
  const sceneOf = (at: number) => scenes.find((s) => at < s.to)?.id ?? scenes.at(-1)?.id;

  const seek = (at: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = at;
    setNow(at);
  };

  const begin = () => {
    const v = video.current;
    if (!v) return;
    v.pause();
    setDraftAt(v.currentTime);
    setError(false);
  };

  const save = () => {
    if (draftAt === null || !text.trim()) return;
    start(async () => {
      try {
        await addPinnedNoteAction(episodeId, draftAt, text);
        setDraftAt(null);
        setText("");
      } catch {
        setError(true); // Keep what they typed so nothing is lost.
      }
    });
  };

  return (
    <div className="grid gap-5 md:grid-cols-[340px_1fr]">
      <video
        ref={video}
        key={src}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
        onSeeked={(e) => setNow(e.currentTarget.currentTime)}
        className="aspect-[9/16] w-full max-w-[340px] rounded-2xl bg-black shadow-[var(--shadow-lg)]"
      />

      <div className="min-w-0 space-y-4">
        {scenes.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-baseline gap-2 text-[13px]">
              <span className="font-mono font-semibold tabular-nums">{timecode(now)}</span>
              <span className="font-medium">{current?.id}</span>
            </div>
            <div className="relative pt-2.5">
              {notes.map((n) => (
                <span
                  key={n.id}
                  aria-hidden
                  className="absolute top-0 size-2 -translate-x-1/2 rounded-full bg-warn"
                  style={{ left: `${Math.min(100, (n.atSec / total) * 100)}%` }}
                />
              ))}
              <div className="flex h-7 gap-0.5 overflow-hidden rounded-lg">
                {scenes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => seek(s.from)}
                    title={s.id}
                    aria-label={`Go to scene ${s.id}, ${timecode(s.from)}`}
                    style={{ flexGrow: s.to - s.from, flexBasis: 0 }}
                    className={`min-w-0 truncate px-1 text-[10px] font-medium transition-colors ${
                      s.id === current?.id ? "bg-accent text-white" : "bg-panel-2 text-muted hover:bg-fg/[0.08]"
                    }`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
            {current?.text && <p className="mt-2 text-xs leading-relaxed text-muted">“{current.text}”</p>}
          </div>
        )}

        {canNote &&
          (draftAt === null ? (
            <button type="button" onClick={begin} className="btn btn-primary w-full sm:w-auto">
              <MapPin className="size-4" strokeWidth={2} /> Add note at {timecode(now)}
            </button>
          ) : (
            <div className="space-y-2 rounded-xl bg-panel-2 p-3">
              <div className="text-xs font-medium text-muted">
                Note at <span className="font-mono font-semibold text-fg">{timecode(draftAt)}</span>
                {sceneOf(draftAt) && <> in {sceneOf(draftAt)}</>}
              </div>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                aria-label="What should change here?"
                placeholder="What should change here?"
                className="input text-[13px]"
              />
              {error && <p className="text-xs text-danger">That didn’t save. Check your connection and try again.</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDraftAt(null)} className="btn btn-ghost btn-sm" disabled={pending}>
                  Cancel
                </button>
                <button type="button" onClick={save} className="btn btn-primary btn-sm" disabled={pending || !text.trim()}>
                  {pending ? "Saving…" : "Save note"}
                </button>
              </div>
            </div>
          ))}

        {notes.length > 0 && (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="flex items-start gap-2 rounded-xl bg-panel-2 px-3 py-2 text-[13px]">
                <button
                  type="button"
                  onClick={() => seek(n.atSec)}
                  aria-label={`Go to ${timecode(n.atSec)}`}
                  className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-accent"
                >
                  {timecode(n.atSec)}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words">{n.body}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {n.scene ? `${n.scene} · ` : ""}{n.author}
                  </p>
                </div>
                {canNote && (
                  <button
                    type="button"
                    aria-label={`Remove the note at ${timecode(n.atSec)}`}
                    disabled={pending}
                    onClick={() => start(() => deletePinnedNoteAction(n.id))}
                    className="shrink-0 rounded-md p-1 text-faint hover:bg-fg/[0.06] hover:text-fg"
                  >
                    <X className="size-3.5" strokeWidth={2.2} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
