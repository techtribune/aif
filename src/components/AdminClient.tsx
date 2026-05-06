"use client";

import { useEffect, useMemo, useState } from "react";

type AifEvent = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  event_date: string | null;
  created_at: string;
};

export default function AdminClient() {
  const [tab, setTab] = useState<"events" | "registrations" | "raffle">("events");
  const [events, setEvents] = useState<AifEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [registrations, setRegistrations] = useState<
    Array<{
      id: string;
      created_at: string;
      name: string;
      contact_number: string;
      network: string | null;
      business_name: string | null;
      email: string | null;
      address: string | null;
      notes: string | null;
    }>
  >([]);

  const [raffleCount, setRaffleCount] = useState(3);
  const [raffleUnique, setRaffleUnique] = useState(true);
  const [winners, setWinners] = useState<
    Array<{ id: string; created_at: string; name: string; contact_number: string; network: string | null }>
  >([]);

  const origin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", { cache: "no-store" });
      const json = (await res.json()) as { events?: AifEvent[]; error?: string };
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      setEvents(json.events ?? []);
      if (!selectedEventId && (json.events?.length ?? 0)) {
        setSelectedEventId(json.events![0].id);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(eventId: string) {
    if (!eventId) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/registrations?eventId=${encodeURIComponent(eventId)}`, { cache: "no-store" });
      const json = (await res.json()) as { registrations?: typeof registrations; error?: string };
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      setRegistrations(json.registrations ?? []);
    } catch (e) {
      setError(String(e));
    }
  }

  async function runRaffle() {
    if (!selectedEventId) return;
    setError(null);
    setWinners([]);
    try {
      const res = await fetch("/api/admin/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEventId, count: raffleCount, uniqueByContact: raffleUnique }),
      });
      const json = (await res.json()) as { winners?: typeof winners; error?: string };
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      setWinners(json.winners ?? []);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (tab !== "registrations") return;
    void loadRegistrations(selectedEventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedEventId]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          location: location.trim() || null,
          eventDate: eventDate || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      setTitle("");
      setLocation("");
      setEventDate("");
      await load();
    } catch (e2) {
      setError(String(e2));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("events")}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm",
            tab === "events"
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
          ].join(" ")}
        >
          Events
        </button>
        <button
          type="button"
          onClick={() => setTab("registrations")}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm",
            tab === "registrations"
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
          ].join(" ")}
        >
          Registrations (early birds)
        </button>
        <button
          type="button"
          onClick={() => setTab("raffle")}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm",
            tab === "raffle"
              ? "border-white/20 bg-white/10 text-white"
              : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10",
          ].join(" ")}
        >
          Raffle
        </button>
      </div>

      {tab === "events" ? (
        <form onSubmit={createEvent} className="space-y-3">
        <div className="text-sm font-semibold text-zinc-100">Create new event</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Title (required)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="e.g. AIF - City Hall"
            />
          </Field>
          <Field label="Location (optional)">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="City / venue"
            />
          </Field>
          <Field label="Event date (optional)">
            <input
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              type="date"
              className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </Field>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? "Creating…" : "Create & generate link"}
          </button>
        </div>
        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-100">Existing events</div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-zinc-300">Loading…</div>
        ) : events.length ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950">
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Registration link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {events.map((ev) => (
                  <tr key={ev.id} className="text-zinc-200">
                    <td className="px-3 py-2">{ev.title}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{ev.event_date ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{ev.slug}</td>
                    <td className="px-3 py-2">
                      <a
                        href={`/register/${ev.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-300 hover:underline"
                      >
                        {origin ? `${origin}/register/${ev.slug}` : `/register/${ev.slug}`}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No events yet.</div>
        )}
      </form>
      ) : null}

      {tab !== "events" ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-xs font-medium text-zinc-300">Event</div>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-zinc-500">
            Registration time is saved in <span className="font-mono">created_at</span>.
          </div>
        </div>
      ) : null}

      {tab === "registrations" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-zinc-100">Registrations (oldest first)</div>
            <button
              type="button"
              onClick={() => void loadRegistrations(selectedEventId)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950">
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Network</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {registrations.map((r, i) => (
                  <tr key={r.id} className="text-zinc-200">
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">{i + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 font-mono">{r.contact_number}</td>
                    <td className="px-3 py-2">{r.network ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "raffle" ? (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-zinc-100">Raffle</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Winners to pick">
              <input
                type="number"
                min={1}
                max={50}
                value={raffleCount}
                onChange={(e) => setRaffleCount(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
              />
            </Field>
            <Field label="Unique by contact number">
              <select
                value={raffleUnique ? "yes" : "no"}
                onChange={(e) => setRaffleUnique(e.target.value === "yes")}
                className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
              >
                <option value="yes">Yes (recommended)</option>
                <option value="no">No</option>
              </select>
            </Field>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => void runRaffle()}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
              >
                Pick winners
              </button>
            </div>
          </div>

          {winners.length ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-950">
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2">Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {winners.map((w, i) => (
                    <tr key={w.id} className="text-zinc-200">
                      <td className="px-3 py-2 font-mono text-xs text-zinc-300">{i + 1}</td>
                      <td className="px-3 py-2">{w.name}</td>
                      <td className="px-3 py-2 font-mono">{w.contact_number}</td>
                      <td className="px-3 py-2">{w.network ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-zinc-400">No winners selected yet.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-zinc-300">{label}</div>
      {children}
    </label>
  );
}

