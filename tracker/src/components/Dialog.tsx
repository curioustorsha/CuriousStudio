"use client";

import { TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Options = {
  title: string;
  message?: string;
  /** Label of the main button. */
  confirmLabel?: string;
  /** Alerts have only one button. */
  kind?: "confirm" | "alert";
};

type Ask = (options: Options) => Promise<boolean>;

const DialogContext = createContext<{ confirm: Ask; alert: (o: Omit<Options, "kind">) => Promise<void> } | null>(null);

/** In-app replacement for window.confirm / window.alert. Wrap the app once; use `useDialog()` anywhere. */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<(Options & { resolve: (ok: boolean) => void }) | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  const ask = useCallback<Ask>((options) => new Promise((resolve) => setCurrent({ ...options, resolve })), []);
  const value = useMemo(
    () => ({ confirm: ask, alert: (o: Omit<Options, "kind">) => ask({ ...o, kind: "alert" }).then(() => undefined) }),
    [ask],
  );

  useEffect(() => {
    if (current && !ref.current?.open) {
      ref.current?.showModal();
      okRef.current?.focus();
    }
  }, [current]);

  function close(ok: boolean) {
    current?.resolve(ok);
    ref.current?.close();
    setCurrent(null);
  }

  const isAlert = current?.kind === "alert";

  return (
    <DialogContext.Provider value={value}>
      {children}
      <dialog
        ref={ref}
        onCancel={(e) => {
          e.preventDefault(); // Esc
          close(false);
        }}
        onClick={(e) => {
          if (e.target === ref.current) close(false); // click on the backdrop
        }}
        className="card m-auto w-[min(420px,calc(100vw-2rem))] p-0 text-fg backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        {current && (
          <div className="p-6">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-warn/15 text-warn">
                <TriangleAlert className="size-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold leading-snug tracking-tight">{current.title}</h2>
                {current.message && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{current.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {!isAlert && (
                <button type="button" className="btn" onClick={() => close(false)}>
                  Cancel
                </button>
              )}
              <button ref={okRef} type="button" className="btn btn-primary" onClick={() => close(true)}>
                {current.confirmLabel ?? (isAlert ? "OK" : "Continue")}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog needs <DialogProvider>");
  return ctx;
}
