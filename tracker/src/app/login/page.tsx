"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { login } from "@/app/actions";
import { PasswordInput } from "@/components/client";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-[340px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="large-title mt-6 text-[28px]">Curiously</h1>
          <p className="mt-1.5 text-[15px] text-muted">Sign in to Studio</p>
        </div>
        <form action={action} className="space-y-3">
          <div className="card overflow-hidden p-0">
            <input
              name="username"
              aria-label="Username"
              placeholder="Username"
              autoComplete="username"
              autoFocus
              required
              className="w-full bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-faint focus-visible:outline-none"
            />
            <div className="mx-4 h-px bg-line" />
            <PasswordInput
              name="password"
              aria-label="Password"
              placeholder="Password"
              autoComplete="current-password"
              required
              className="w-full bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-faint focus-visible:outline-none"
            />
          </div>
          {state?.error && <p className="px-1 text-center text-[13px] text-danger">{state.error}</p>}
          <button className="btn btn-primary w-full py-3 text-[15px]" disabled={pending}>
            {pending ? "Signing in…" : (
              <>
                Continue <ArrowRight className="size-4" strokeWidth={2.2} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
