"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("ok");
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-zinc-400">Authorized users only.</p>

          <form className="mt-5 space-y-3" onSubmit={signIn}>
            <div>
              <label className="block text-xs font-medium text-zinc-300">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                placeholder="••••••••"
              />
            </div>

            {message ? (
              <div
                className={[
                  "rounded-lg border px-3 py-2 text-sm",
                  status === "error"
                    ? "border-red-400/20 bg-red-400/10 text-red-100"
                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
                ].join(" ")}
              >
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-xs text-zinc-500">
            <p>
              <Link href="/display" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                Public showcase
              </Link>{" "}
              — open to everyone (logos & event info).
            </p>
            <p>Admin: create users in Supabase Auth (Email/Password). This app trusts Supabase sessions.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="h-6 w-28 rounded bg-white/10" />
          <div className="mt-3 h-4 w-40 rounded bg-white/10" />
          <div className="mt-6 space-y-3">
            <div className="h-9 w-full rounded bg-white/10" />
            <div className="h-9 w-full rounded bg-white/10" />
            <div className="h-9 w-full rounded bg-white/10" />
          </div>
        </div>
      </div>
    </main>
  );
}

