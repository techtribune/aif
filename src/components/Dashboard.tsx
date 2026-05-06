"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AifRecord, AifRecordSet, DuplicateMode } from "@/lib/types";

function uniqSorted(values: string[]) {
  return Array.from(new Set(values.filter((v) => v.trim()))).sort((a, b) => a.localeCompare(b));
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function includesCi(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function recordsToCsv(records: AifRecord[]) {
  const cols: (keyof AifRecord)[] = ["AIF", "Name", "Number", "Network", "Business Name"];
  const header = cols.join(",");
  const lines = records.map((r) => cols.map((c) => csvEscape(toStr(r[c] ?? ""))).join(","));
  return [header, ...lines].join("\n");
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type Tab = "Overview" | "Analytics" | "Table";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [databaseDir, setDatabaseDir] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AifRecordSet>({ records: [], loadWarnings: [] });

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedAif, setSelectedAif] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("All");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (databaseDir.trim()) q.set("databaseDir", databaseDir.trim());
      const res = await fetch(`/api/records?${q.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as AifRecordSet;
      setData(json);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await reload();
        if (cancelled) return;
      } catch (e) {
        if (cancelled) return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [databaseDir]);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-xlsx", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; error?: string; name?: string };
      if (!res.ok) {
        throw new Error(json.error || `Upload failed (${res.status})`);
      }
      setUploadMessage(`Uploaded: ${json.name ?? file.name}`);
      await reload();
    } catch (e) {
      setUploadMessage(String(e));
    } finally {
      setUploading(false);
    }
  }

  const aifOptions = useMemo(() => uniqSorted(data.records.map((r) => toStr(r.AIF))), [data.records]);
  const networkOptions = useMemo(
    () => uniqSorted(data.records.map((r) => toStr(r.Network ?? ""))),
    [data.records],
  );

  // Default-select all when options change.
  // Also: if user previously had "all selected", keep that behavior when new options appear.
  const prevAifOptions = useRef<string[]>([]);
  const prevNetworkOptions = useRef<string[]>([]);
  useEffect(() => {
    const prev = prevAifOptions.current;
    const hadAllSelected = selectedAif.length && prev.length && selectedAif.length === prev.length;
    if (!selectedAif.length && aifOptions.length) setSelectedAif(aifOptions);
    else if (hadAllSelected && aifOptions.length) setSelectedAif(aifOptions);
    prevAifOptions.current = aifOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aifOptions]);
  useEffect(() => {
    const prev = prevNetworkOptions.current;
    const hadAllSelected = selectedNetwork.length && prev.length && selectedNetwork.length === prev.length;
    if (!selectedNetwork.length && networkOptions.length) setSelectedNetwork(networkOptions);
    else if (hadAllSelected && networkOptions.length) setSelectedNetwork(networkOptions);
    prevNetworkOptions.current = networkOptions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkOptions]);

  const filtered = useMemo(() => {
    let rows = data.records.slice();

    if (selectedAif.length) {
      const set = new Set(selectedAif);
      rows = rows.filter((r) => set.has(toStr(r.AIF)));
    }
    if (selectedNetwork.length) {
      const set = new Set(selectedNetwork);
      rows = rows.filter((r) => set.has(toStr(r.Network ?? "")));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => {
        const fields = [
          toStr(r.Name ?? ""),
          toStr(r.Number ?? ""),
          toStr(r.Network ?? ""),
          toStr(r["Business Name"] ?? ""),
          toStr(r.AIF ?? ""),
        ];
        return fields.some((f) => f.toLowerCase().includes(q));
      });
    }

    if (duplicateMode !== "All") {
      const numbers = rows.map((r) => toStr(r.Number ?? "")).map((s) => s.trim());
      const counts = new Map<string, number>();
      for (const n of numbers) {
        if (!n) continue;
        counts.set(n, (counts.get(n) ?? 0) + 1);
      }

      if (duplicateMode === "Only duplicates") {
        rows = rows.filter((r) => {
          const n = toStr(r.Number ?? "").trim();
          if (!n) return false;
          return (counts.get(n) ?? 0) >= 2;
        });
      } else if (duplicateMode === "Only unique") {
        rows = rows.filter((r) => {
          const n = toStr(r.Number ?? "").trim();
          if (!n) return true;
          return (counts.get(n) ?? 0) < 2;
        });
      }
    }

    return rows;
  }, [data.records, selectedAif, selectedNetwork, search, duplicateMode]);

  const kpis = useMemo(() => {
    const records = filtered.length;
    const aifEvents = new Set(filtered.map((r) => toStr(r.AIF))).size;
    const networks = new Set(filtered.map((r) => toStr(r.Network ?? "")).filter(Boolean)).size;

    const netCounts = new Map<string, number>();
    for (const r of filtered) {
      const n = toStr(r.Network ?? "");
      if (!n) continue;
      netCounts.set(n, (netCounts.get(n) ?? 0) + 1);
    }
    let topNetwork = "—";
    let topNetworkCount = 0;
    for (const [k, v] of netCounts.entries()) {
      if (v > topNetworkCount) {
        topNetwork = k;
        topNetworkCount = v;
      }
    }

    return { records, aifEvents, networks, topNetwork, topNetworkCount };
  }, [filtered]);

  const chartNetworks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtered) {
      const n = toStr(r.Network ?? "");
      if (!n) continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const chartAif = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtered) {
      const a = toStr(r.AIF);
      if (!a) continue;
      counts.set(a, (counts.get(a) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const analytics = useMemo(() => {
    const numbers = filtered
      .map((r) => toStr(r.Number ?? "").trim())
      .filter((n) => n && n.toLowerCase() !== "nan");
    const uniqueNumbers = new Set(numbers).size;

    const counts = new Map<string, number>();
    for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1);
    const dupEntries = Array.from(counts.values()).reduce((acc, v) => acc + (v > 1 ? v - 1 : 0), 0);

    const keyCols: Array<keyof AifRecord> = ["Name", "Number", "Network", "Business Name"];
    let completeness = 0;
    let total = filtered.length;
    if (keyCols.length && total) {
      let nonEmpty = 0;
      for (const r of filtered) {
        for (const c of keyCols) {
          const s = toStr(r[c] ?? "");
          if (s && s.toLowerCase() !== "nan") nonEmpty++;
        }
      }
      completeness = Math.round((100 * nonEmpty) / (total * keyCols.length));
    }

    const missing = keyCols.map((c) => {
      let miss = 0;
      for (const r of filtered) {
        const s = toStr(r[c] ?? "").trim();
        if (!s || s.toLowerCase() === "nan") miss++;
      }
      return { field: String(c), missing: miss };
    });

    return { uniqueNumbers, dupEntries, completeness, total, missing };
  }, [filtered]);

  const viewForTable = useMemo(() => {
    // Keep consistent column ordering.
    return filtered.map((r) => ({
      AIF: toStr(r.AIF),
      Name: toStr(r.Name ?? ""),
      Number: toStr(r.Number ?? ""),
      Network: toStr(r.Network ?? ""),
      BusinessName: toStr(r["Business Name"] ?? ""),
    }));
  }, [filtered]);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="w-[320px] shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4">
          <div className="text-sm font-semibold text-zinc-200">AIF Data</div>
          <div className="mt-1 text-xs text-zinc-400">Loads all *.xlsx in the server folder.</div>
        </div>

        <a
          href="/admin"
          className="mb-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
        >
          Admin (create event registration link)
        </a>
        <div className="mb-4 text-xs text-zinc-500">
          Note: new AIF events/registrations won’t appear in this Excel dashboard. They’re managed in <span className="font-mono">/admin</span>.
        </div>

        <label className="block text-xs font-medium text-zinc-300">Add new XLSX</label>
        <input
          type="file"
          accept=".xlsx"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.currentTarget.value = "";
          }}
          className="mt-1 block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-white/15 disabled:opacity-70"
        />
        <div className="mt-1 text-xs text-zinc-500">
          If the same filename already exists, upload will be blocked.
        </div>
        {uploadMessage ? (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200">
            {uploadMessage}
          </div>
        ) : null}

        <label className="block text-xs font-medium text-zinc-300">Database folder (advanced)</label>
        <input
          value={databaseDir}
          onChange={(e) => setDatabaseDir(e.target.value)}
          placeholder="Leave blank to use ./database"
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-white/20"
        />
        <div className="mt-2 text-xs text-zinc-500">
          On Vercel, keep this blank and commit your Excel files inside <span className="font-mono">/database</span>.
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="text-sm font-semibold text-zinc-200">Filters</div>

        <label className="mt-3 block text-xs font-medium text-zinc-300">Search</label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, number, business…"
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
        />

        <label className="mt-3 block text-xs font-medium text-zinc-300">AIF event</label>
        <select
          multiple
          value={selectedAif}
          onChange={(e) => setSelectedAif(Array.from(e.target.selectedOptions).map((o) => o.value))}
          className="mt-1 h-36 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-2 text-sm outline-none focus:border-white/20"
        >
          {aifOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <div className="mt-1 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedAif(aifOptions)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200 hover:bg-white/10"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedAif([])}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200 hover:bg-white/10"
          >
            Clear
          </button>
        </div>

        <label className="mt-3 block text-xs font-medium text-zinc-300">Network</label>
        <select
          multiple
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(Array.from(e.target.selectedOptions).map((o) => o.value))}
          className="mt-1 h-28 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-2 text-sm outline-none focus:border-white/20"
        >
          {networkOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <div className="mt-1 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedNetwork(networkOptions)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200 hover:bg-white/10"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedNetwork([])}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-zinc-200 hover:bg-white/10"
          >
            Clear
          </button>
        </div>

        <label className="mt-3 block text-xs font-medium text-zinc-300">Number duplicates</label>
        <select
          value={duplicateMode}
          onChange={(e) => setDuplicateMode(e.target.value as DuplicateMode)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-2 py-2 text-sm outline-none focus:border-white/20"
        >
          {(["All", "Only duplicates", "Only unique"] as const).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <div className="my-4 h-px bg-white/10" />

        <div className="text-xs text-zinc-400">Tip: paste a phone number to find matches instantly.</div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AIF Dashboard</h1>
            <div className="mt-1 text-sm text-zinc-400">
              Search Name, Number, Network, Business Name — and see which AIF (source file) each record came from.
            </div>
          </div>
          <div className="text-xs text-zinc-400">Use the download buttons below.</div>
        </div>

        {data.loadWarnings.length ? (
          <details className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
            <summary className="cursor-pointer text-sm font-medium text-amber-200">Load notes</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
              {data.loadWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </details>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            Loading…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-100">
            {error}
          </div>
        ) : !data.records.length ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
            No data loaded yet. Confirm the <span className="font-mono">database</span> folder contains AIF *.xlsx files.
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
              <Kpi title="Records" value={kpis.records.toLocaleString()} subtitle="After filters" />
              <Kpi title="AIF events" value={kpis.aifEvents.toLocaleString()} subtitle="Unique sources" />
              <Kpi title="Networks" value={kpis.networks ? kpis.networks.toLocaleString() : "—"} subtitle="Unique" />
              <Kpi
                title="Top network"
                value={kpis.topNetwork}
                subtitle={`${kpis.topNetworkCount.toLocaleString()} records`}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(["Overview", "Analytics", "Table"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={[
                    "rounded-lg border px-3 py-1.5 text-sm",
                    tab === t
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "Overview" ? (
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title="Top networks">
                  {chartNetworks.length ? (
                    <Chart data={chartNetworks} />
                  ) : (
                    <div className="text-sm text-zinc-400">No network values found after filters.</div>
                  )}
                </Card>
                <Card title="AIF events (by record count)">
                  {chartAif.length ? <Chart data={chartAif} /> : <div className="text-sm text-zinc-400">—</div>}
                </Card>

                <div className="lg:col-span-2">
                  <Card title="Quick actions" subtitle="Download the currently filtered dataset as CSV.">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => downloadText("aif_filtered.csv", recordsToCsv(filtered), "text/csv")}
                        className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                      >
                        Download filtered CSV
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            ) : null}

            {tab === "Analytics" ? (
              <div className="mt-4 space-y-4">
                <Card
                  title="Analytics"
                  subtitle="Quality checks and high-signal summaries based on the current filters."
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <Kpi title="Unique numbers" value={analytics.uniqueNumbers.toLocaleString()} subtitle="Distinct phone numbers" />
                    <Kpi title="Duplicate entries" value={analytics.dupEntries.toLocaleString()} subtitle="Repeated phone numbers" />
                    <Kpi title="Completeness" value={`${analytics.completeness}%`} subtitle="Across key fields" />
                    <Kpi title="Filtered records" value={analytics.total.toLocaleString()} subtitle="Current selection" />
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card title="Top AIF events">
                    <SimpleTable
                      rows={chartAif
                        .slice()
                        .sort((a, b) => b.value - a.value)
                        .map((r) => ({ key: r.name, value: r.value }))}
                      keyLabel="AIF"
                      valueLabel="Records"
                    />
                  </Card>
                  <Card title="Missing fields (count)">
                    <SimpleTable
                      rows={analytics.missing
                        .slice()
                        .sort((a, b) => b.missing - a.missing)
                        .map((r) => ({ key: r.field, value: r.missing }))}
                      keyLabel="Field"
                      valueLabel="Missing"
                    />
                  </Card>
                </div>
              </div>
            ) : null}

            {tab === "Table" ? (
              <div className="mt-4 space-y-4">
                <Card title="Records" subtitle="Sorted, searchable via filters in the sidebar.">
                  <div className="flex justify-end pb-3">
                    <button
                      type="button"
                      onClick={() => downloadText("aif_filtered.csv", recordsToCsv(filtered), "text/csv")}
                      className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                    >
                      Download CSV
                    </button>
                  </div>

                  <div className="max-h-[560px] overflow-auto rounded-xl border border-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-zinc-950">
                        <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                          <Th>AIF (event/source)</Th>
                          <Th>Name</Th>
                          <Th>Number</Th>
                          <Th>Network</Th>
                          <Th>Business Name</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {viewForTable.slice(0, 2000).map((r, i) => (
                          <tr key={i} className="text-zinc-200">
                            <Td className="font-mono text-xs text-zinc-300">{r.AIF}</Td>
                            <Td>{r.Name}</Td>
                            <Td className="font-mono">{r.Number}</Td>
                            <Td>{r.Network}</Td>
                            <Td>{r.BusinessName}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {viewForTable.length > 2000 ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      Showing first 2,000 rows for performance (CSV download includes all filtered rows).
                    </div>
                  ) : null}
                </Card>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-zinc-400">{subtitle}</div> : null}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Kpi({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-medium text-zinc-400">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{subtitle ?? ""}</div>
    </div>
  );
}

function Chart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, left: 0, right: 10, bottom: 10 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(228,228,231,0.75)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.10)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.10)" }}
          />
          <YAxis
            tick={{ fill: "rgba(228,228,231,0.75)", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.10)" }}
            tickLine={{ stroke: "rgba(255,255,255,0.10)" }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              color: "white",
            }}
          />
          <Bar dataKey="value" fill="rgba(99,102,241,0.85)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleTable({
  rows,
  keyLabel,
  valueLabel,
}: {
  rows: Array<{ key: string; value: number }>;
  keyLabel: string;
  valueLabel: string;
}) {
  return (
    <div className="max-h-[360px] overflow-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 bg-zinc-950">
          <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
            <Th>{keyLabel}</Th>
            <Th>{valueLabel}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((r) => (
            <tr key={r.key} className="text-zinc-200">
              <Td className={includesCi(keyLabel, "aif") ? "font-mono text-xs text-zinc-300" : ""}>{r.key}</Td>
              <Td className="font-mono">{r.value.toLocaleString()}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-3 py-2 ${className}`}>{children}</td>;
}

