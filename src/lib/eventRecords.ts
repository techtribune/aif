import "server-only";

import type { AifRecordSet } from "@/lib/types";
import { normalizePhMobile } from "@/lib/network";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function loadEventRegistrationRecords(): Promise<AifRecordSet> {
  const warnings: string[] = [];
  const records: AifRecordSet["records"] = [];

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasServiceRole) {
    return { records: [], loadWarnings: ["Event registrations not loaded: SUPABASE_SERVICE_ROLE_KEY is not set."] };
  }

  const admin = createSupabaseAdminClient();
  const { data: events, error: evErr } = await admin
    .from("aif_events")
    .select("id,slug,title")
    .order("created_at", { ascending: false });
  if (evErr) return { records: [], loadWarnings: [`Failed to load aif_events: ${evErr.message}`] };

  const byId = new Map((events ?? []).map((e) => [e.id, e] as const));
  if (!byId.size) return { records: [], loadWarnings: [] };

  // Pull all registrations (limit to a safe amount for now).
  const { data: regs, error: regErr } = await admin
    .from("aif_registrations")
    .select("event_id,created_at,name,contact_number,network,business_name")
    .order("created_at", { ascending: true })
    .limit(50000);
  if (regErr) return { records: [], loadWarnings: [`Failed to load aif_registrations: ${regErr.message}`] };

  for (const r of regs ?? []) {
    const ev = byId.get(r.event_id);
    if (!ev) continue;
    records.push({
      AIF: ev.title || ev.slug,
      Name: r.name ?? "",
      Number: normalizePhMobile(r.contact_number ?? ""),
      Network: (r.network ?? "").toString().trim().toUpperCase() || "",
      "Business Name": r.business_name ?? "",
    });
  }

  return { records, loadWarnings: warnings };
}

