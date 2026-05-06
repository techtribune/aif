import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { eventId?: string; count?: number; uniqueByContact?: boolean };
  const eventId = (body.eventId ?? "").trim();
  const count = Math.max(1, Math.min(50, Number(body.count ?? 1)));
  const uniqueByContact = body.uniqueByContact ?? true;

  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: rows, error } = await admin
    .from("aif_registrations")
    .select("id,created_at,name,contact_number,network")
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let pool = rows ?? [];
  if (uniqueByContact) {
    const seen = new Set<string>();
    pool = pool.filter((r) => {
      const key = (r.contact_number ?? "").trim();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const winners = shuffle(pool).slice(0, Math.min(count, pool.length));
  return NextResponse.json({ winners });
}

