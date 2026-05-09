import { NextResponse } from "next/server";

import { inferNetworkClass, normalizePhMobile } from "@/lib/network";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = createSupabaseAdminClient();

  const body = (await req.json()) as {
    eventSlug?: string;
    name?: string;
    contactNumber?: string;
    network?: string | null;
    businessName?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };

  const eventSlug = (body.eventSlug ?? "").trim();
  const name = (body.name ?? "").trim();
  const contactNumberRaw = (body.contactNumber ?? "").trim();
  const contactNumber = normalizePhMobile(contactNumberRaw);

  if (!eventSlug) return NextResponse.json({ error: "Missing event" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!contactNumber) return NextResponse.json({ error: "Contact Number is required" }, { status: 400 });

  const { data: event, error: evErr } = await supabase
    .from("aif_events")
    .select("id,ended_at")
    .eq("slug", eventSlug)
    .maybeSingle();
  if (evErr || !event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.ended_at) return NextResponse.json({ error: "Registration is closed for this event" }, { status: 403 });

  const inferred = inferNetworkClass(contactNumberRaw);
  const network =
    (body.network ?? "").toString().trim().toUpperCase() ||
    (inferred ?? null);

  const { error } = await supabase.from("aif_registrations").insert({
    event_id: event.id,
    name,
    contact_number: contactNumber,
    network: network || null,
    business_name: body.businessName ?? null,
    email: body.email ?? null,
    address: body.address ?? null,
    notes: body.notes ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

