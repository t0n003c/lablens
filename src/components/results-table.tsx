"use client";

import { useId, useState, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { getLabTestDescription } from "@/lib/labs/descriptions";
import type { ParsedLabResult } from "@/lib/labs/types";

const flagClass = {
  NORMAL: "bg-success/10 text-success",
  LOW: "bg-warning/10 text-warning",
  HIGH: "bg-warning/10 text-warning",
  BORDERLINE: "bg-accent/10 text-accent",
  CONCERNING: "bg-danger/10 text-danger",
  UNKNOWN: "bg-panel-muted text-muted",
};

const flagLabel = {
  NORMAL: "normal",
  LOW: "low",
  HIGH: "high",
  BORDERLINE: "borderline",
  CONCERNING: "concerning",
  UNKNOWN: "not evaluated",
};

type TooltipState = {
  id: string;
  description: string;
  left: number;
  top: number;
  placement: "above" | "below";
};

function tooltipPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const width = Math.min(360, window.innerWidth - 24);
  const left = Math.min(Math.max(rect.left, 12), window.innerWidth - width - 12);
  const hasRoomBelow = rect.bottom + 150 < window.innerHeight;

  return {
    left,
    top: hasRoomBelow ? rect.bottom + 8 : rect.top - 8,
    placement: hasRoomBelow ? "below" as const : "above" as const,
  };
}

type DisplayLabResult = ParsedLabResult & {
  resultDate?: string | Date;
  resultDateLabel?: string;
};

function formatResultDate(result: DisplayLabResult) {
  if (result.resultDateLabel) return result.resultDateLabel;
  if (!result.resultDate) return "Not dated";

  const date = result.resultDate instanceof Date ? result.resultDate : new Date(result.resultDate);
  if (Number.isNaN(date.getTime())) return String(result.resultDate);

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ResultsTable({ results, showDate = false }: { results: DisplayLabResult[]; showDate?: boolean }) {
  const tooltipBaseId = useId();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  function showTooltip(id: string, description: string, element: HTMLElement) {
    setTooltip({
      id,
      description,
      ...tooltipPosition(element),
    });
  }

  function handleTooltipMouseEnter(event: MouseEvent<HTMLButtonElement>, id: string, description: string) {
    showTooltip(id, description, event.currentTarget);
  }

  function handleTooltipFocus(event: FocusEvent<HTMLButtonElement>, id: string, description: string) {
    showTooltip(id, description, event.currentTarget);
  }

  return (
    <>
      <div className="min-w-0 overflow-x-auto rounded-md border border-border-soft bg-panel/90 shadow-[var(--shadow-card)] backdrop-blur">
        <table className={`w-full border-collapse text-left text-sm ${showDate ? "min-w-[820px]" : "min-w-[720px]"}`}>
          <thead className="border-b border-border-soft bg-panel-muted/85 text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Test</th>
              {showDate ? <th className="px-4 py-3 font-semibold">Date</th> : null}
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Result</th>
              <th className="px-4 py-3 font-semibold">Range</th>
              <th className="px-4 py-3 font-semibold">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {results.map((result, index) => {
              const rowId = `${tooltipBaseId}-${index}`;
              const description = getLabTestDescription(result);
              const active = tooltip?.id === rowId;

              return (
                <tr key={`${result.testName}-${result.value ?? result.stringValue}-${index}`} className="align-middle transition hover:bg-panel-muted/55">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <button
                      type="button"
                      aria-describedby={active ? `${rowId}-tooltip` : undefined}
                      onBlur={() => setTooltip(null)}
                      onFocus={(event) => handleTooltipFocus(event, rowId, description)}
                      onMouseEnter={(event) => handleTooltipMouseEnter(event, rowId, description)}
                      onMouseLeave={() => setTooltip(null)}
                      className="rounded-sm text-left underline decoration-border decoration-dotted underline-offset-4 transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {result.testName}
                    </button>
                  </td>
                  {showDate ? <td className="whitespace-nowrap px-4 py-3 text-muted">{formatResultDate(result)}</td> : null}
                  <td className="px-4 py-3 text-muted">{result.category}</td>
                  <td className="px-4 py-3 text-foreground">
                    {result.value ?? result.stringValue ?? "Not parsed"} {result.unit}
                  </td>
                  <td className="px-4 py-3 text-muted">{result.referenceRangeRaw ?? "Not supplied"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex min-w-24 justify-center rounded-md px-2 py-1 text-xs font-semibold ${flagClass[result.flag]}`}>
                      {flagLabel[result.flag]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              id={`${tooltip.id}-tooltip`}
              role="tooltip"
              style={{
                left: tooltip.left,
                top: tooltip.top,
                transform: tooltip.placement === "above" ? "translateY(-100%)" : undefined,
              }}
              className="pointer-events-none fixed z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-md border border-border-soft bg-panel/95 p-3 text-sm leading-6 text-foreground shadow-[var(--shadow-glass)] backdrop-blur"
            >
              {tooltip.description}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
