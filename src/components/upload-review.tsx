"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileUp, Loader2, Plus, Save, UserRound } from "lucide-react";
import { LabLensVisual } from "@/components/lablens-visual";
import { ResultsTable } from "@/components/results-table";
import type { HealthSummary, ParsedLabResult } from "@/lib/labs/types";

type ApiLabResult = ParsedLabResult & {
  id: string;
  value?: number | string | null;
  referenceLow?: number | string | null;
  referenceHigh?: number | string | null;
};

type UploadResponse = {
  report?: {
    id: string;
    person?: PersonOption | null;
    labName?: string | null;
    notes?: string | null;
    reportDate?: string;
    status?: string;
    parserWarnings: string[];
    labResults: ApiLabResult[];
  };
  summary?: HealthSummary;
  error?: string;
};

type PersonOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

type ReviewRow = {
  id?: string;
  keep: boolean;
  testName: string;
  value: string;
  stringValue: string;
  unit: string;
  referenceLow: string;
  referenceHigh: string;
  referenceRangeRaw: string;
  notes: string;
};

export function UploadReview() {
  const [pending, setPending] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [reviewStatus, setReviewStatus] = useState("");
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [personId, setPersonId] = useState("");
  const [personName, setPersonName] = useState("");
  const [draftMeta, setDraftMeta] = useState({ labName: "", reportDate: "", notes: "", personId: "" });
  const [rows, setRows] = useState<ReviewRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/people")
      .then(async (peopleResponse) => {
        if (!peopleResponse.ok || cancelled) return;
        const body = await peopleResponse.json();
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
    setResponse(null);
    setReviewStatus("");
    const form = new FormData(event.currentTarget);
    if (personId === "new") {
      form.delete("personId");
      form.set("personName", personName);
    } else if (personId) {
      form.set("personId", personId);
      form.delete("personName");
    }
    const upload = await fetch("/api/reports/upload", { method: "POST", body: form });
    const rawBody = await upload.text();
    const body = (rawBody
      ? safeJson(rawBody, { error: `Upload failed with status ${upload.status}.` })
      : { error: `Upload failed with status ${upload.status}.` }) as UploadResponse;
    setPending(false);
    setResponse(body);
    if (body.report) {
      setDraftMeta({
        labName: body.report.labName ?? "",
        reportDate: body.report.reportDate ? new Date(body.report.reportDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: body.report.notes ?? "",
        personId: body.report.person?.id ?? personId,
      });
      if (body.report.person) {
        const reportPerson = body.report.person;
        setPeople((currentPeople) => (currentPeople.some((person) => person.id === reportPerson.id) ? currentPeople : [...currentPeople, reportPerson]));
      }
      setRows(body.report.labResults.map(rowFromResult));
    }
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((currentRows) => currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((currentRows) => [...currentRows, emptyRow()]);
  }

  async function saveReview(status: "REVIEWED" | "FINALIZED") {
    if (!response?.report) return;

    setReviewPending(true);
    setReviewStatus(status === "FINALIZED" ? "Finalizing report..." : "Saving review...");
    const result = await fetch(`/api/reports/${response.report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draftMeta,
        personId: draftMeta.personId || undefined,
        status,
        results: rows.map((row) => ({
          ...row,
          value: row.value || undefined,
          stringValue: row.stringValue || undefined,
          referenceLow: row.referenceLow || undefined,
          referenceHigh: row.referenceHigh || undefined,
        })),
      }),
    });
    const body = (await result.json().catch(() => ({ error: "Could not save this review." }))) as UploadResponse;
    setReviewPending(false);

    if (!result.ok) {
      setReviewStatus(body.error ?? "Could not save this review.");
      return;
    }

    setResponse((current) => ({
      ...current,
      report: body.report ?? current?.report,
      summary: body.summary ?? current?.summary,
    }));
    if (body.report) setRows(body.report.labResults.map(rowFromResult));
    setReviewStatus(status === "FINALIZED" ? "Report finalized." : "Review saved.");
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Extract", "Upload the PDF"],
            ["2", "Review", "Confirm values"],
            ["3", "Finalize", "Save to trends"],
          ].map(([step, title, description]) => (
            <div key={step} className="rounded-md border border-border bg-panel-muted/80 p-3">
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-white dark:text-[#02110f]">{step}</span>
              <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs leading-5 text-muted">{description}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-stretch">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-3 text-sm font-semibold text-foreground">
                Person
                <span className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <select
                    value={personId}
                    onChange={(event) => setPersonId(event.target.value)}
                    className="min-h-12 w-full rounded-md border border-border bg-background pl-10 pr-3"
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
                <label className="grid gap-3 text-sm font-semibold text-foreground">
                  New person name
                  <input
                    value={personName}
                    onChange={(event) => setPersonName(event.target.value)}
                    required
                    placeholder="Mom, Dad, Alex"
                    className="min-h-12 rounded-md border border-border bg-background px-3"
                  />
                </label>
              ) : null}
            </div>
            <label className="grid gap-3 text-sm font-semibold text-foreground">
              MyQuest PDF
              <span className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                <input
                  name="file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  className="block min-h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white dark:file:text-[#02110f]"
                />
                <span className="mt-2 block text-xs leading-5 text-muted">PDF only. Max 20MB. You can review extracted rows before relying on them.</span>
              </span>
            </label>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-primary px-4 font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:opacity-60 dark:text-[#02110f]"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
              Extract results
            </button>
          </div>
          <LabLensVisual variant="upload" className="min-h-72" description="Extracted values stay private and editable before you finalize." />
        </div>
      </form>

      {pending ? (
        <section className="rounded-md border border-primary/30 bg-primary/10 p-5 text-primary shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 size-5 animate-spin" aria-hidden="true" />
            <div>
              <h2 className="font-semibold">Processing PDF</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Reading the report, matching lab rows, and checking supplied reference ranges.</p>
            </div>
          </div>
        </section>
      ) : null}

      {response?.error ? (
        <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-danger">
          <p>{response.error}</p>
          {response.error.toLowerCase().includes("authentication") ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/login" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white dark:text-[#02110f]">
                Login
              </Link>
              <Link href="/register" className="rounded-md border border-danger/30 px-3 py-2 text-sm font-semibold">
                Create account
              </Link>
            </div>
          ) : null}
          {response.error.toLowerCase().includes("manual") ? (
            <Link href="/manual" className="mt-3 inline-flex rounded-md border border-danger/30 px-3 py-2 text-sm font-semibold">
              Open manual entry
            </Link>
          ) : null}
        </div>
      ) : null}

      {response?.report ? (
        <section className="grid gap-5">
          {response.report.parserWarnings?.length ? (
            <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              {response.report.parserWarnings.join(" ")}
            </div>
          ) : null}
          <div className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-3 text-success">
              <ClipboardCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Review before saving</h2>
                <p className="mt-1 text-sm leading-6 text-muted">Edit any row that looks off, uncheck rows you do not want, then finalize the report.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium">
                Person
                <select
                  value={draftMeta.personId}
                  onChange={(event) => setDraftMeta((current) => ({ ...current, personId: event.target.value }))}
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                >
                  {draftMeta.personId ? null : <option value="">Choose a person</option>}
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {person.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Report date
                <input
                  type="date"
                  value={draftMeta.reportDate}
                  onChange={(event) => setDraftMeta((current) => ({ ...current, reportDate: event.target.value }))}
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium md:col-span-2">
                Lab
                <input
                  value={draftMeta.labName}
                  onChange={(event) => setDraftMeta((current) => ({ ...current, labName: event.target.value }))}
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Notes
              <textarea
                value={draftMeta.notes}
                onChange={(event) => setDraftMeta((current) => ({ ...current, notes: event.target.value }))}
                rows={2}
                className="rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <div className="mt-5 min-w-0 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="border-b border-border bg-panel-muted text-xs uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="w-20 px-3 py-3 font-semibold">Keep</th>
                    <th className="px-3 py-3 font-semibold">Test</th>
                    <th className="px-3 py-3 font-semibold">Value</th>
                    <th className="px-3 py-3 font-semibold">Text</th>
                    <th className="px-3 py-3 font-semibold">Unit</th>
                    <th className="px-3 py-3 font-semibold">Low</th>
                    <th className="px-3 py-3 font-semibold">High</th>
                    <th className="px-3 py-3 font-semibold">Range</th>
                    <th className="px-3 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, index) => (
                    <tr key={row.id ?? `new-${index}`} className={row.keep ? "align-top" : "bg-panel-muted/60 align-top opacity-70"}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={row.keep}
                          onChange={(event) => updateRow(index, { keep: event.target.checked })}
                          className="size-5 rounded border-border accent-[var(--color-primary)]"
                          aria-label={`Keep ${row.testName || "row"}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.testName} onChange={(event) => updateRow(index, { testName: event.target.value })} className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.value} onChange={(event) => updateRow(index, { value: event.target.value })} inputMode="decimal" className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.stringValue} onChange={(event) => updateRow(index, { stringValue: event.target.value })} className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.unit} onChange={(event) => updateRow(index, { unit: event.target.value })} className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.referenceLow} onChange={(event) => updateRow(index, { referenceLow: event.target.value })} inputMode="decimal" className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.referenceHigh} onChange={(event) => updateRow(index, { referenceHigh: event.target.value })} inputMode="decimal" className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.referenceRangeRaw} onChange={(event) => updateRow(index, { referenceRangeRaw: event.target.value })} className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                      <td className="px-3 py-3">
                        <input value={row.notes} onChange={(event) => updateRow(index, { notes: event.target.value })} className="min-h-10 w-full rounded-md border border-border bg-background px-2" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={addRow} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium transition hover:border-primary/50 hover:bg-panel-muted">
                <Plus className="size-4" aria-hidden="true" />
                Add row
              </button>
              <button
                type="button"
                onClick={() => void saveReview("REVIEWED")}
                disabled={reviewPending}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 font-medium transition hover:border-primary/50 hover:bg-panel-muted disabled:opacity-60"
              >
                {reviewPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                Save review
              </button>
              <button
                type="button"
                onClick={() => void saveReview("FINALIZED")}
                disabled={reviewPending}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-white shadow-sm transition hover:bg-primary-strong disabled:opacity-60 dark:text-[#02110f]"
              >
                {reviewPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
                Finalize report
              </button>
              <Link href="/reports" className="inline-flex min-h-10 items-center rounded-md border border-border bg-panel px-3 font-medium transition hover:border-primary/50 hover:bg-panel-muted">
                Open reports
              </Link>
            </div>
            {reviewStatus ? <p className="mt-3 text-sm text-muted">{reviewStatus}</p> : null}
          </div>

          {response.report.labResults.length ? <ResultsTable results={response.report.labResults.map(normalizeResult)} /> : null}
          {response.summary ? (
            <div className="rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold">Draft summary</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                {response.summary.overall.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function emptyRow(): ReviewRow {
  return {
    keep: true,
    testName: "",
    value: "",
    stringValue: "",
    unit: "",
    referenceLow: "",
    referenceHigh: "",
    referenceRangeRaw: "",
    notes: "",
  };
}

function rowFromResult(result: ApiLabResult): ReviewRow {
  return {
    id: result.id,
    keep: true,
    testName: result.testName,
    value: result.value == null ? "" : String(result.value),
    stringValue: result.stringValue ?? "",
    unit: result.unit ?? "",
    referenceLow: result.referenceLow == null ? "" : String(result.referenceLow),
    referenceHigh: result.referenceHigh == null ? "" : String(result.referenceHigh),
    referenceRangeRaw: result.referenceRangeRaw ?? "",
    notes: result.notes ?? "",
  };
}

function normalizeResult(result: ApiLabResult): ParsedLabResult {
  return {
    ...result,
    value: result.value == null ? undefined : Number(result.value),
    referenceLow: result.referenceLow == null ? undefined : Number(result.referenceLow),
    referenceHigh: result.referenceHigh == null ? undefined : Number(result.referenceHigh),
  };
}

function safeJson(text: string, fallback: UploadResponse) {
  try {
    return JSON.parse(text) as UploadResponse;
  } catch {
    return fallback;
  }
}
