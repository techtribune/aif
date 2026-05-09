import { notFound } from "next/navigation";

import RegisterForm from "@/components/RegisterForm";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = createSupabaseAdminClient();
  const { data: event, error } = await supabase
    .from("aif_events")
    .select("id,slug,title,location,event_date,created_at,ended_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !event) return notFound();

  const closed = Boolean(event.ended_at);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-medium text-zinc-400">AIF Event Registration</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{event.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
            {event.location ? <div>Location: {event.location}</div> : null}
            {event.event_date ? <div>Date: {event.event_date}</div> : null}
          </div>
          {closed ? (
            <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Online registration for this event is closed.
            </p>
          ) : null}
        </div>

        {!closed ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <RegisterForm eventSlug={event.slug} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

