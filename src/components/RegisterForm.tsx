"use client";

import { useState } from "react";

import type { NetworkClass } from "@/lib/network";
import { inferNetworkClass } from "@/lib/network";

export default function RegisterForm({ eventSlug }: { eventSlug: string }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [network, setNetwork] = useState<NetworkClass | "">("");

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  function onContactChange(v: string) {
    setContact(v);
    const inferred = inferNetworkClass(v);
    if (inferred) setNetwork(inferred);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventSlug,
        name: name.trim(),
        contactNumber: contact.trim(),
        network: network || inferNetworkClass(contact) || null,
        businessName: businessName.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      }),
    });

    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) {
      setStatus("error");
      setMessage(json.error || `Failed (${res.status})`);
      return;
    }

    setStatus("ok");
    setMessage("Registered successfully. Thank you!");
    setName("");
    setContact("");
    setNetwork("");
    setBusinessName("");
    setEmail("");
    setAddress("");
    setNotes("");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-sm font-semibold text-zinc-100">Attendee information</div>
      <div className="text-xs text-zinc-400">
        Required: <span className="text-zinc-200">Name</span> and{" "}
        <span className="text-zinc-200">Contact Number</span>. The rest is optional.
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Name (required)">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="Full name"
          />
        </Field>

        <Field label="Contact Number (required)">
          <input
            value={contact}
            onChange={(e) => onContactChange(e.target.value)}
            required
            inputMode="tel"
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="09xxxxxxxxx"
          />
        </Field>

        <Field label="Network (auto)">
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as NetworkClass | "")}
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
          >
            <option value="">Auto-detect</option>
            {(["DITO", "GLOBE", "GOMO", "SMART", "SUN", "TM", "TNT"] as const).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Business Name (optional)">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="Business name"
          />
        </Field>

        <Field label="Email (optional)">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="name@email.com"
          />
        </Field>

        <Field label="Address (optional)">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
            placeholder="Address"
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-24 w-full rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm outline-none focus:border-white/20"
          placeholder="Any extra details…"
        />
      </Field>

      {message ? (
        <div
          className={[
            "rounded-lg border px-3 py-2 text-sm",
            status === "error"
              ? "border-red-400/20 bg-red-400/10 text-red-100"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
          ].join(" ")}
        >
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "submitting" ? "Submitting…" : "Register"}
        </button>
      </div>
    </form>
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

