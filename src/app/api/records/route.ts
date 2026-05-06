import { NextResponse } from "next/server";

import { loadAllAifRecords } from "@/lib/aif";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const databaseDir = url.searchParams.get("databaseDir") ?? undefined;

  const payload = await loadAllAifRecords(databaseDir || undefined);
  return NextResponse.json(payload, {
    headers: {
      // Helps ensure Vercel doesn't serve stale data if you change database files.
      "Cache-Control": "no-store",
    },
  });
}

