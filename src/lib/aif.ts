import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

import * as XLSX from "xlsx";

import type { AifRecord, AifRecordSet } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_DATABASE_DIR = path.join(process.cwd(), "database");
const DEFAULT_STORAGE_BUCKET = "database";

function norm(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim().toUpperCase();
}

function findHeaderRow(rows: unknown[][], maxScanRows = 40): number | null {
  const scan = Math.min(maxScanRows, rows.length);
  const required = new Set(["NAME", "NUMBER", "NETWORK"]);

  for (let i = 0; i < scan; i++) {
    const tokens = new Set(rows[i].map((x) => norm(x)).filter(Boolean));
    let ok = true;
    for (const r of required) {
      if (!tokens.has(r)) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }

  return null;
}

function pickCol(
  columns: string[],
  opts: { exact: string[]; contains?: string[] },
): string | null {
  // Avoid `new Map(columns.map(...))` because sparse arrays can produce `undefined` entries.
  const colsNorm = new Map<string, string>();
  for (let i = 0; i < columns.length; i++) {
    const c = columns[i] ?? "";
    colsNorm.set(norm(c), c);
  }

  for (const key of opts.exact) {
    const hit = colsNorm.get(norm(key));
    if (hit) return hit;
  }

  for (const c of columns) {
    const cn = norm(c);
    for (const needle of opts.contains ?? []) {
      if (cn.includes(norm(needle))) return c;
    }
  }

  return null;
}

function toCleanString(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return "";
  return s;
}

function parseAifExcelBuffer(buf: Buffer, fileName: string): { records: AifRecord[]; warnings: string[] } {
  const warnings: string[] = [];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer" });
  } catch (e) {
    return { records: [], warnings: [`Failed to parse \`${fileName}\`: ${String(e)}`] };
  }

  const firstSheet = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  const headerRow = findHeaderRow(rows);
  if (headerRow === null) {
    return {
      records: [],
      warnings: [
        `Could not find table header row in \`${fileName}\` (expected columns like NAME/NUMBER/NETWORK).`,
      ],
    };
  }

  // Use Array.from to avoid sparse arrays (which can break downstream Map construction).
  const columns = Array.from(rows[headerRow] ?? [], (v) => norm(v) || "");
  const nameCol = pickCol(columns, { exact: ["NAME"], contains: ["NAME"] });
  const numberCol = pickCol(columns, { exact: ["NUMBER"], contains: ["NUMBER", "MOBILE", "CONTACT"] });
  const networkCol = pickCol(columns, { exact: ["NETWORK"], contains: ["NETWORK"] });
  const businessCol = pickCol(columns, { exact: ["BUSINESS NAME"], contains: ["BUSINESS"] });

  const missing: string[] = [];
  if (!nameCol) missing.push("NAME");
  if (!numberCol) missing.push("NUMBER");
  if (!networkCol) missing.push("NETWORK");
  if (!businessCol) missing.push("BUSINESS NAME");
  if (missing.length) {
    warnings.push(`\`${name}\` is missing column(s): ${missing.join(", ")}. It will still be loaded with what exists.`);
  }

  const idx = (col: string | null) => (col ? columns.indexOf(col) : -1);
  const ixName = idx(nameCol);
  const ixNumber = idx(numberCol);
  const ixNetwork = idx(networkCol);
  const ixBusiness = idx(businessCol);

  const aif = path.parse(fileName).name;
  const out: AifRecord[] = [];

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];

    const rec: AifRecord = { AIF: aif };
    if (ixName >= 0) rec.Name = toCleanString(row[ixName]);
    if (ixNumber >= 0) rec.Number = toCleanString(row[ixNumber]).replace(/\.0$/, "");
    if (ixNetwork >= 0) rec.Network = toCleanString(row[ixNetwork]);
    if (ixBusiness >= 0) rec["Business Name"] = toCleanString(row[ixBusiness]);

    const hasDetail =
      Boolean(rec.Name) || Boolean(rec.Number) || Boolean(rec.Network) || Boolean(rec["Business Name"]);
    if (hasDetail) out.push(rec);
  }

  return { records: out, warnings };
}

async function readAifExcelFromDisk(filePath: string): Promise<{ records: AifRecord[]; warnings: string[] }> {
  const name = path.basename(filePath);
  let buf: Buffer;
  try {
    buf = await fs.readFile(filePath);
  } catch (e) {
    return { records: [], warnings: [`Failed to read \`${name}\`: ${String(e)}`] };
  }
  return parseAifExcelBuffer(buf, name);
}

async function loadAllAifRecordsFromDisk(databaseDir: string): Promise<AifRecordSet> {
  let stat;
  try {
    stat = await fs.stat(databaseDir);
  } catch {
    return { records: [], loadWarnings: [`Database folder not found: \`${databaseDir}\``] };
  }
  if (!stat.isDirectory()) {
    return { records: [], loadWarnings: [`Database path is not a folder: \`${databaseDir}\``] };
  }

  const entries = await fs.readdir(databaseDir, { withFileTypes: true });
  const xlsx = entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => n.toLowerCase().endsWith(".xlsx") && !n.startsWith("~$"))
    .sort((a, b) => a.localeCompare(b));

  if (!xlsx.length) {
    return { records: [], loadWarnings: [`No .xlsx files found in \`${databaseDir}\``] };
  }

  const records: AifRecord[] = [];
  const warnings: string[] = [];

  for (const file of xlsx) {
    const { records: r, warnings: w } = await readAifExcelFromDisk(path.join(databaseDir, file));
    warnings.push(...w);
    records.push(...r);
  }

  if (!records.length) {
    return { records: [], loadWarnings: warnings.length ? warnings : [`Found files in \`${databaseDir}\`, but none could be parsed.`] };
  }

  return { records, loadWarnings: warnings };
}

async function loadAllAifRecordsFromSupabaseStorage(
  supabase: SupabaseClient,
  bucket = DEFAULT_STORAGE_BUCKET,
): Promise<AifRecordSet> {
  const { data: objects, error } = await supabase.storage.from(bucket).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) return { records: [], loadWarnings: [`Failed to list bucket \`${bucket}\`: ${error.message}`] };
  const xlsx = (objects ?? [])
    .map((o) => o.name)
    .filter((n) => n.toLowerCase().endsWith(".xlsx") && !n.startsWith("~$"));

  if (!xlsx.length) {
    return { records: [], loadWarnings: [`No .xlsx files found in Supabase Storage bucket \`${bucket}\``] };
  }

  const records: AifRecord[] = [];
  const warnings: string[] = [];

  for (const name of xlsx) {
    const { data, error: dlError } = await supabase.storage.from(bucket).download(name);
    if (dlError || !data) {
      warnings.push(`Failed to download \`${name}\`: ${dlError?.message ?? "unknown error"}`);
      continue;
    }
    const ab = await data.arrayBuffer();
    const buf = Buffer.from(ab);
    const parsed = parseAifExcelBuffer(buf, name);
    warnings.push(...parsed.warnings);
    records.push(...parsed.records);
  }

  if (!records.length) {
    return {
      records: [],
      loadWarnings: warnings.length
        ? warnings
        : [`Found files in bucket \`${bucket}\`, but none could be parsed.`],
    };
  }

  return { records, loadWarnings: warnings };
}

export async function loadAllAifRecords(
  databaseDir = DEFAULT_DATABASE_DIR,
  opts?: { supabase?: SupabaseClient; storageBucket?: string },
): Promise<AifRecordSet> {
  if (opts?.supabase) {
    return loadAllAifRecordsFromSupabaseStorage(opts.supabase, opts.storageBucket ?? DEFAULT_STORAGE_BUCKET);
  }
  return loadAllAifRecordsFromDisk(databaseDir);
}

