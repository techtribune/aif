import { NextResponse, type NextRequest } from "next/server";

import { isAdminEmail } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function makeSlug() {
  // Short slug for URLs (good enough for admin-generated links)
  const s = Math.random().toString(36).slice(2, 8);
  return `aif-${s}`;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data: events, error } = await admin
    .from("aif_events")
    .select("id,slug,title,location,event_date,created_at")
    .is("ended_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const email = user?.email ?? null;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { title?: string; location?: string | null; eventDate?: string | null };
  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // Try a couple times in case of slug collision.
  for (let i = 0; i < 3; i++) {
    const slug = makeSlug();
    const { error } = await admin.from("aif_events").insert({
      slug,
      title,
      location: body.location ?? null,
      event_date: body.eventDate ?? null,
      created_by: user?.id ?? null,
    });
    if (!error) return NextResponse.json({ ok: true, slug });
    if (!String(error.message).toLowerCase().includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Failed to generate unique slug" }, { status: 500 });
}

export async function PATCH(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { eventId?: string };
  const eventId = (body.eventId ?? "").trim();
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from("aif_events")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", eventId)
    .is("ended_at", null)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) return NextResponse.json({ error: "Event not found or already ended" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;
  if (!isAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const eventId = (req.nextUrl.searchParams.get("eventId") ?? "").trim();
  if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("aif_events").delete().eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

