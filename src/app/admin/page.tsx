import { redirect } from "next/navigation";

import AdminClient from "@/components/AdminClient";
import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Avoid prerendering failures when env vars are not set at build time.
  // This page is admin-only and should always be rendered on-demand.
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const email = data.user?.email ?? null;
  if (!isAdminEmail(email)) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-medium text-zinc-400">Admin</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">AIF Events</h1>
          <div className="mt-2 text-sm text-zinc-300">
            Create a new AIF event to generate a registration page for attendees.
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <AdminClient />
        </div>
      </div>
    </main>
  );
}

