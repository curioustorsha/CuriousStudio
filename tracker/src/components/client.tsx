"use client";

import { ChevronRight, Circle, CircleCheck, Monitor, Moon, Sun, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useFormStatus } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveApiKeyAction, toggleChecklistAction } from "@/app/actions";
import type { checklistItems } from "@/lib/stages";
import { useDialog } from "./Dialog";

export function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-fg/80 hover:bg-fg/[0.06]"
      }`}
    >
      {icon && <span className={active ? "text-white" : "text-accent"}>{icon}</span>}
      {children}
    </Link>
  );
}

/** A helper skill nested under its stage skill in the sidebar: smaller, no icon. */
export function HelperLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block truncate rounded-[7px] px-2 py-[3px] text-[12px] transition-colors ${
        active ? "bg-accent/15 font-medium text-accent" : "text-muted hover:bg-fg/[0.06] hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}

// ── Collapsible sidebar groups ────────────────────────────────────────

const FOLD_KEY = "pb-sidebar-folds";
const foldListeners = new Set<() => void>();

/** Open/closed state per sidebar group, kept in localStorage so it survives reloads. Raw string for a stable snapshot. */
function useFolds() {
  const raw = useSyncExternalStore(
    (cb) => {
      foldListeners.add(cb);
      return () => foldListeners.delete(cb);
    },
    () => localStorage.getItem(FOLD_KEY) ?? "{}",
    () => "{}",
  );
  const folds = JSON.parse(raw) as Record<string, boolean>;
  const set = (id: string, open: boolean) => {
    localStorage.setItem(FOLD_KEY, JSON.stringify({ ...folds, [id]: open }));
    foldListeners.forEach((l) => l());
  };
  return [folds, set] as const;
}

function Chevron({ open }: { open: boolean }) {
  return <ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} strokeWidth={2} />;
}

/** A sidebar section heading ("Skills") that folds everything under it. */
export function NavSection({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  const [folds, set] = useFolds();
  const open = folds[id] ?? true;
  return (
    <div>
      <button
        type="button"
        onClick={() => set(id, !open)}
        aria-expanded={open}
        className="mb-1.5 mt-6 flex w-full items-center gap-1 px-2.5 text-[11px] font-semibold text-faint hover:text-muted"
      >
        <span className="flex-1 text-left">{label}</span>
        <Chevron open={open} />
      </button>
      {open && children}
    </div>
  );
}

/**
 * A stage skill in the sidebar with its helper skills folded underneath. Helpers start folded, and open by
 * themselves while you're on one of their pages.
 */
export function SkillGroup({
  id,
  link,
  helperHrefs,
  children,
}: {
  id: string;
  link: React.ReactNode;
  helperHrefs: string[];
  children: React.ReactNode;
}) {
  const [folds, set] = useFolds();
  const pathname = usePathname();
  const open = folds[id] ?? helperHrefs.includes(pathname);
  return (
    <div>
      <div className="flex items-center">
        <div className="min-w-0 flex-1">{link}</div>
        <button
          type="button"
          onClick={() => set(id, !open)}
          aria-expanded={open}
          aria-label={open ? "Hide helper skills" : "Show helper skills"}
          title={`${helperHrefs.length} helper skill${helperHrefs.length === 1 ? "" : "s"}`}
          className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-faint hover:bg-fg/[0.06] hover:text-fg"
        >
          <Chevron open={open} />
        </button>
      </div>
      {open && children}
    </div>
  );
}

// ── Claude API key ────────────────────────────────────────────────────

/** Paste, replace or remove the Claude API key. The key is never sent back to the browser. */
export function ApiKeyForm({ isSet }: { isSet: boolean }) {
  const [state, action, pending] = useActionState(saveApiKeyAction, undefined);
  return (
    <form action={action} className="space-y-2">
      <input
        name="key"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={isSet ? "Paste a new key to replace it" : "sk-ant-…"}
        className="input font-mono text-[12px]"
      />
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="text-xs text-ok">Saved. The next run uses it.</p>}
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm flex-1" disabled={pending}>
          {pending ? "Saving…" : isSet ? "Replace Key" : "Save Key"}
        </button>
        {isSet && (
          <button name="remove" value="1" className="btn btn-ghost btn-sm" disabled={pending}>
            Remove
          </button>
        )}
      </div>
    </form>
  );
}

// ── Theme ─────────────────────────────────────────────────────────────

type ThemePref = "system" | "light" | "dark";
const THEME_KEY = "pb-theme";
const themeListeners = new Set<() => void>();

function applyTheme(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function readTheme(): ThemePref {
  return (localStorage.getItem(THEME_KEY) as ThemePref) || "system";
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(
    (cb) => {
      themeListeners.add(cb);
      return () => themeListeners.delete(cb);
    },
    readTheme,
    () => "system" as ThemePref,
  );

  // Follow macOS / Windows appearance changes live while on "system".
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => readTheme() === "system" && applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const set = (next: ThemePref) => {
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    themeListeners.forEach((l) => l());
  };

  const options: { key: ThemePref; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: "Light", icon: <Sun className="size-3.5" /> },
    { key: "dark", label: "Dark", icon: <Moon className="size-3.5" /> },
    { key: "system", label: "Automatic", icon: <Monitor className="size-3.5" /> },
  ];

  return (
    <div className="segmented w-full" role="radiogroup" aria-label="Appearance">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={pref === o.key}
          title={o.label}
          data-active={pref === o.key}
          onClick={() => set(o.key)}
          className="flex-1 !px-2 !py-1.5"
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// ── Sync ──────────────────────────────────────────────────────────────

/** Keeps both partners' views in sync without a realtime backend. */
export function AutoRefresh({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      const editing = document.activeElement?.matches("input, textarea, select");
      if (document.visibilityState === "visible" && !editing) router.refresh();
    };
    const t = setInterval(tick, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

/** Refreshes every few seconds while a skill run is in progress, so its steps stream in. */
export function RunWatcher({ seconds = 3 }: { seconds?: number }) {
  return <AutoRefresh seconds={seconds} />;
}

// ── Forms ─────────────────────────────────────────────────────────────

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText = "Saving…",
  confirmText,
  confirmMessage,
  confirmLabel,
  formAction,
  formNoValidate,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  /** Ask in an in-app dialog before submitting, e.g. when moving on with checklist items still open. */
  confirmText?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  /** For a second button in the same form that does something else with the same fields. */
  formAction?: (formData: FormData) => void | Promise<void>;
  formNoValidate?: boolean;
}) {
  const { pending, action } = useFormStatus();
  const dialog = useDialog();
  // With two buttons in one form, only the one that was pressed shows its pending text.
  const mine = pending && (!formAction || action === formAction);
  return (
    <button
      className={className}
      disabled={pending}
      formAction={formAction}
      formNoValidate={formNoValidate}
      onClick={async (e) => {
        if (!confirmText) return;
        e.preventDefault();
        const button = e.currentTarget;
        const ok = await dialog.confirm({ title: confirmText, message: confirmMessage, confirmLabel });
        // requestSubmit keeps this button as the submitter, so its formAction and formNoValidate still apply.
        if (ok) button.form?.requestSubmit(button);
      }}
    >
      {mine ? pendingText : children}
    </button>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-pb">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

export function MarkdownField({
  name,
  label,
  defaultValue,
  placeholder,
  rows = 12,
  hint,
  showWordCount,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
  showWordCount?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  // Notes are read, not edited: anything with content shows as formatted Markdown, and changes normally go
  // through the stage's Review box. "Edit" opens the text for a small fix by hand; saving makes a new version.
  // An empty field stays a text box so it can still be filled in.
  const hasContent = defaultValue.trim() !== "";
  const [preview, setPreview] = useState(hasContent);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label mb-0">{label}</span>
        <span className="flex items-center gap-3">
          {showWordCount && (
            <span className={`text-xs tabular-nums ${words > 160 ? "text-warn" : "text-faint"}`}>
              {words} words · ~{Math.round(words / 2.5)}s spoken
            </span>
          )}
          {hasContent && preview && (
            <button type="button" onClick={() => setPreview(false)} className="text-xs font-medium text-accent hover:opacity-80">
              Edit
            </button>
          )}
        </span>
      </div>
      {/* Textarea stays mounted while previewing so the form still submits it */}
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`input ${preview ? "hidden" : ""}`}
      />
      {preview && (
        <div className="rounded-[10px] bg-panel-2 px-4 py-2">
          <Markdown>{value}</Markdown>
        </div>
      )}
      {hasContent && !preview && (
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setValue(defaultValue);
              setPreview(true);
            }}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <SubmitButton className="btn btn-primary btn-sm" pendingText="Saving…">
            Save as a new version
          </SubmitButton>
        </div>
      )}
      {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function Checklist({
  episodeId,
  stage,
  items,
}: {
  episodeId: number;
  stage: string;
  items: ReturnType<typeof checklistItems>;
}) {
  const [done, setDone] = useState(() => items.map((it) => it.done));
  const [, startTransition] = useTransition();

  return (
    <ul className="-mx-1.5 space-y-0.5">
      {items.map((it, i) => {
        const key = `${stage}:${i}`;
        const on = done[i];
        const flagged = !on && it.note;
        return (
          <li key={key}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => {
                setDone((d) => d.map((v, j) => (j === i ? !on : v)));
                startTransition(() => toggleChecklistAction(episodeId, key, !on));
              }}
              className="flex w-full items-start gap-2.5 rounded-[9px] px-1.5 py-1.5 text-left text-[13px] transition-colors hover:bg-panel-2"
            >
              {on ? (
                <CircleCheck className="mt-px size-[18px] shrink-0 fill-accent text-panel" strokeWidth={2} />
              ) : (
                <Circle className={`mt-px size-[18px] shrink-0 ${flagged ? "text-warn" : "text-faint"}`} strokeWidth={1.6} />
              )}
              <span className="min-w-0">
                <span className={on ? "text-faint line-through decoration-faint/60" : ""}>{it.text}</span>
                {it.humanOnly && <span className="ml-1.5 text-[10px] font-medium text-faint">You tick this</span>}
                {on && it.by === "claude" && <span className="ml-1.5 text-[10px] font-medium text-accent">Ticked by Claude</span>}
              </span>
            </button>
            {it.note && (
              <p
                className={`mb-1 ml-8 mr-1.5 rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                  flagged ? "bg-warn/10 text-warn" : "text-muted"
                }`}
              >
                {flagged && <TriangleAlert className="-mt-px mr-1 inline size-3" strokeWidth={2.2} />}
                {it.note}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A skill's instructions as formatted text (frontmatter hidden). "Edit" opens the full SKILL.md, frontmatter
 * included, and saving rewrites the file. Remount with `key={content}` so it closes again after a save.
 */
export function SkillInstructions({ content, save }: { content: string; save: (formData: FormData) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const body = content.replace(/^---\n[\s\S]*?\n---\n?/, "");

  if (editing) {
    return (
      <form action={save} className="space-y-3">
        <textarea
          name="content"
          defaultValue={content}
          rows={32}
          spellCheck={false}
          className="input font-mono text-[12px] leading-relaxed"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
            Cancel
          </button>
          <SubmitButton className="btn btn-primary btn-sm">Save Instructions</SubmitButton>
        </div>
      </form>
    );
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute right-0 top-0 text-xs font-medium text-accent hover:opacity-80"
      >
        Edit
      </button>
      <Markdown>{body}</Markdown>
    </div>
  );
}
