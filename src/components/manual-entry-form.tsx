"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, UserRound } from "lucide-react";

type PersonOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

export function ManualEntryForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [personId, setPersonId] = useState("");
  const [personName, setPersonName] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/people")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        const nextPeople: PersonOption[] = body.people ?? [];
        if (cancelled) return;
        setPeople(nextPeople);
        setPersonId(body.defaultPersonId ?? nextPeople[0]?.id ?? "");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const payload = {
      reportDate: String(form.get("reportDate") || new Date().toISOString()),
      labName: String(form.get("labName") ?? ""),
      notes: String(form.get("notes") ?? ""),
      personId: personId && personId !== "new" ? personId : undefined,
      personName: personId === "new" ? personName : undefined,
      results: [
        {
          testName: String(form.get("testName") ?? ""),
          value: Number(form.get("value")),
          unit: String(form.get("unit") ?? ""),
          referenceLow: form.get("referenceLow") ? Number(form.get("referenceLow")) : undefined,
          referenceHigh: form.get("referenceHigh") ? Number(form.get("referenceHigh")) : undefined,
          referenceRangeRaw: String(form.get("referenceRangeRaw") ?? ""),
          notes: String(form.get("resultNotes") ?? ""),
        },
      ],
    };

    const response = await fetch("/api/reports/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    setPending(false);
    setStatus(response.ok ? "Saved." : body.error ?? "Could not save this report.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <label className="grid gap-2 text-sm font-medium">
          Person
          <span className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <select
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
              className="min-h-11 w-full rounded-md border border-border bg-background pl-10 pr-3"
            >
              {personId ? null : <option value="">Loading people</option>}
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                  {person.isDefault ? " (default)" : ""}
                </option>
              ))}
              <option value="new">Add new person</option>
            </select>
          </span>
        </label>
        {personId === "new" ? (
          <label className="grid gap-2 text-sm font-medium">
            New person name
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              required
              placeholder="Mom, Dad, Alex"
              className="min-h-11 rounded-md border border-border bg-background px-3"
            />
          </label>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Report date
          <input name="reportDate" type="date" required className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Lab
          <input name="labName" placeholder="Quest Diagnostics" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Test
          <input name="testName" required placeholder="LDL Cholesterol" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Value
          <input name="value" required inputMode="decimal" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Unit
          <input name="unit" placeholder="mg/dL" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Low
          <input name="referenceLow" inputMode="decimal" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          High
          <input name="referenceHigh" inputMode="decimal" className="min-h-11 rounded-md border border-border bg-background px-3" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Reference range
        <input name="referenceRangeRaw" placeholder="0-99" className="min-h-11 rounded-md border border-border bg-background px-3" />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Notes
        <textarea name="notes" rows={4} className="rounded-md border border-border bg-background px-3 py-2" />
      </label>
      {status ? (
        <div className="text-sm text-muted">
          <p>{status}</p>
          {status.toLowerCase().includes("authentication") ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/login" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]">
                Login
              </Link>
              <Link href="/register" className="rounded-md border border-border bg-panel px-3 py-2 text-sm font-semibold transition hover:border-primary/50 hover:bg-panel-muted">
                Create account
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:opacity-60 dark:text-[#02110f]"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
        Save report
      </button>
    </form>
  );
}
