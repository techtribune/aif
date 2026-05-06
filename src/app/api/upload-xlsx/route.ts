import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function isXlsx(name: string) {
  return name.toLowerCase().endsWith(".xlsx");
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const useSupabaseStorage = (process.env.AIF_USE_SUPABASE_STORAGE || "").toLowerCase() === "true";
  const bucket = process.env.AIF_STORAGE_BUCKET || "database";
  if (!useSupabaseStorage) {
    return NextResponse.json(
      {
        error:
          "Uploads are disabled. Set AIF_USE_SUPABASE_STORAGE=true and create a Supabase Storage bucket to enable uploads.",
      },
      { status: 400 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const originalName = file.name || "upload.xlsx";
  if (!isXlsx(originalName)) {
    return NextResponse.json({ error: "Only .xlsx files are supported" }, { status: 400 });
  }

  // Duplicate check: same filename already exists in bucket.
  const { data: existing, error: listError } = await supabase.storage.from(bucket).list("", {
    limit: 1000,
    search: originalName,
  });
  if (listError) {
    return NextResponse.json({ error: `Failed to list bucket: ${listError.message}` }, { status: 500 });
  }
  const alreadyExists = (existing ?? []).some((o) => o.name === originalName);
  if (alreadyExists) {
    return NextResponse.json(
      { error: `Duplicate file: \`${originalName}\` already exists. Upload cancelled.` },
      { status: 409 },
    );
  }

  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(originalName, bytes, {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: false,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, name: originalName });
}

