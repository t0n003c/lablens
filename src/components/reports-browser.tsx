"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, UserRound } from "lucide-react";
import { ResultsTable } from "@/components/results-table";
import { demoResults } from "@/lib/demo/data";
import type { ParsedLabResult } from "@/lib/labs/types";

type ApiLabResult = ParsedLabResult & {
  id: string;
  value?: number | string | null;
  referenceLow?: number | string | null;
  referenceHigh?: number | string | null;
};

type ApiReport = {
  id: string;
  person?: PersonOption | null;
  labName?: string | null;
  reportDate: string;
  source: string;
  status: string;
  labResults: ApiLabResult[];
};

type PersonOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

function normalizeResult(result: ApiLabResult): ParsedLabResult {
  return {
    ...result,
    value: result.value == null ? undefined : Number(result.value),
    referenceLow: result.referenceLow == null ? undefined : Number(result.referenceLow),
    referenceHigh: result.referenceHigh == null ? undefined : Number(result.referenceHigh),
  };
}

export function ReportsBrowser() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("all");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [status, setStatus] = useState("Loading reports...");
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  async function loadReports(nextQuery = query, nextPersonId = selectedPersonId) {
    setStatus("Loading reports...");
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextPersonId !== "all") params.set("personId", nextPersonId);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/reports${queryString}`);

    if (response.status === 401) {
      setReports([]);
      setShowDemo(true);
      setStatus("Login to search saved reports. Demo data is shown below.");
      return;
    }

    if (!response.ok) {
      setReports([]);
      setShowDemo(false);
      setStatus("Could not load reports.");
      return;
    }

    const body = await response.json();
    setReports(body.reports ?? []);
    setShowDemo(false);
    setStatus((body.reports ?? []).length ? "" : "No matching reports found.");
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/people")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        if (!cancelled) setPeople(body.people ?? []);
      })
      .catch(() => {});

    fetch("/api/reports")
      .then(async (response) => {
        if (cancelled) return;

        if (response.status === 401) {
          setReports([]);
          setShowDemo(true);
          setStatus("Login to search saved reports. Demo data is shown below.");
          return;
        }

        if (!response.ok) {
          setReports([]);
          setShowDemo(false);
          setStatus("Could not load reports.");
          return;
        }

        const body = await response.json();
        if (cancelled) return;
        setReports(body.reports ?? []);
        setShowDemo(false);
        setStatus((body.reports ?? []).length ? "" : "No matching reports found.");
      })
      .catch(() => {
        if (!cancelled) {
          setReports([]);
          setShowDemo(false);
          setStatus("Could not load reports.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadReports(query, selectedPersonId);
  }

  function changePerson(nextPersonId: string) {
    setSelectedPersonId(nextPersonId);
    void loadReports(query, nextPersonId);
  }

  async function deleteReport(report: ApiReport) {
    const confirmed = window.confirm(`Delete ${report.labName ?? "this report"} from ${new Date(report.reportDate).toLocaleDateString()}?`);
    if (!confirmed) return;

    setDeletingReportId(report.id);
    const response = await fetch(`/api/reports/${report.id}`, { method: "DELETE" });
    setDeletingReportId(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not delete report." }));
      setStatus(body.error ?? "Could not delete report.");
      return;
    }

    setReports((currentReports) => {
      const nextReports = currentReports.filter((item) => item.id !== report.id);
      if (!nextReports.length) setStatus("No matching reports found.");
      return nextReports;
    });
    setStatus("Report deleted.");
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="rounded-md border border-border bg-panel p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-[16rem_1fr]">
          <label className="relative block">
            <span className="sr-only">Filter by person</span>
            <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <select
              value={selectedPersonId}
              onChange={(event) => changePerson(event.target.value)}
              className="min-h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 shadow-sm"
            >
              <option value="all">All people</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                  {person.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="relative block sm:w-96">
            <span className="sr-only">Search reports</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports"
              className="min-h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 shadow-sm"
            />
          </label>
        </div>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-semibold text-white shadow-sm transition hover:bg-primary-strong dark:text-[#02110f]">
          Search
        </button>
        </div>
      </form>

      {status ? <p className="rounded-md border border-border bg-panel p-4 text-sm text-muted">{status}</p> : null}

      {reports.length ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <section key={report.id} className="min-w-0 rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{report.labName ?? "Lab report"}</h2>
                  <p className="text-sm text-muted">
                    {report.person?.name ? `${report.person.name} · ` : ""}
                    {new Date(report.reportDate).toLocaleDateString()} · {report.source.toLowerCase()} · {report.status.toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex w-fit rounded-md bg-panel-muted px-3 py-1 text-sm font-semibold text-muted">
                    {report.labResults.length} value{report.labResults.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteReport(report)}
                    disabled={deletingReportId === report.id}
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-danger/40 bg-panel px-3 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {deletingReportId === report.id ? "Deleting" : "Delete"}
                  </button>
                </div>
              </div>
              <div className="mt-5 min-w-0">
                {report.labResults.length ? (
                  <ResultsTable results={report.labResults.map(normalizeResult)} />
                ) : (
                  <p className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">No structured rows were saved for this report.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : showDemo ? (
        <section className="min-w-0 rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">June 2026 Quest Diagnostics</h2>
              <p className="text-sm text-muted">Demo data shown until saved reports are available.</p>
            </div>
            <span className="inline-flex w-fit rounded-md bg-warning/10 px-3 py-1 text-sm font-semibold text-warning">3 flags</span>
          </div>
          <div className="mt-5 min-w-0">
            <ResultsTable results={demoResults} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
