import { NextResponse } from "next/server";

import { loadAllAifRecords } from "@/lib/aif";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const databaseDir = url.searchParams.get("databaseDir") ?? undefined;

  const data = await loadAllAifRecords(databaseDir || undefined);
  return NextResponse.json(data, {
    headers: {
      // Helps ensure Vercel doesn't serve stale data if you change database files.
      "Cache-Control": "no-store",
    },
  });
}

