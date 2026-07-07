"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Apple, CheckCircle2, Dumbbell, FileUp, Info, Moon, Plus, RotateCw, Trash2 } from "lucide-react";
import { HealthScoreHero } from "@/components/health-score-hero";
import { ResultsTable } from "@/components/results-table";
import { TrendInstrument } from "@/components/trend-instrument";
import { buildNextStepDetails, type NextStepDetails } from "@/lib/action-plan/details";
import { buildShortNextStep } from "@/lib/action-plan/shorten";
import { demoResults, demoSummary, trendData } from "@/lib/demo/data";
import { getHealthScoreStatusLabel } from "@/lib/health-score";
import { buildTrendInsights, buildTrendPoint, getVisibleTrendMetrics, hasTrendValue, trendMetrics, type TrendMetricKey } from "@/lib/labs/trends";
import type { HealthSummary, ParsedLabResult } from "@/lib/labs/types";

type ApiLabResult = ParsedLabResult & {
  id: string;
  value?: number | string | null;
  referenceLow?: number | string | null;
  referenceHigh?: number | string | null;
};

type ApiReport = {
  id: string;
  labName?: string | null;
  reportDate: string;
  source: string;
  status: string;
  person?: PersonOption | null;
  summaryJson?: HealthSummary | null;
  recommendationsJson?: HealthSummary["recommendations"] | null;
  labResults: ApiLabResult[];
};

type PersonOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

type ActionPlanItem = {
  id: string;
  category: string;
  text: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

type NextStepItem = {
  id: string;
  category: string;
  text: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  completedAt?: string | null;
  sourceText: string;
  isVirtual: boolean;
};

type DashboardMode = "loading" | "guest-demo" | "user-empty" | "user-data";

function normalizeResult(result: ApiLabResult): ParsedLabResult {
  return {
    ...result,
    value: result.value == null ? undefined : Number(result.value),
    referenceLow: result.referenceLow == null ? undefined : Number(result.referenceLow),
    referenceHigh: result.referenceHigh == null ? undefined : Number(result.referenceHigh),
  };
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function actionKey(category: string, text: string) {
  return `${category}::${text.trim().toLowerCase()}`;
}

function upsertActionItem(items: ActionPlanItem[], nextItem: ActionPlanItem) {
  const exists = items.some((item) => item.id === nextItem.id);
  if (exists) return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  return [nextItem, ...items];
}

function reviewPrompts(result: ParsedLabResult) {
  const name = result.testName.toLowerCase();

  if (/a1c|hemoglobin a1c/.test(name)) {
    return ["Compare with prior A1c and recent sleep, stress, illness, and meal changes.", "Ask whether fasting glucose or repeat A1c would clarify the next step."];
  }

  if (/total cholesterol|cholesterol total/.test(name) || (name === "cholesterol" && !/hdl|ldl/.test(name))) {
    return ["Review LDL, HDL, and triglycerides with this number.", "Ask how this fits with your overall heart-risk picture."];
  }

  if (name.includes("ldl")) {
    return ["Compare with HDL, triglycerides, blood pressure, and family history.", "Ask what LDL goal makes sense for your risk profile."];
  }

  if (name.includes("hdl")) {
    return ["Read this separately from total cholesterol and LDL.", "Ask whether exercise, smoking status, or medications affect the target."];
  }

  if (name.includes("triglycerides")) {
    return ["Check whether the test was fasting and note alcohol or unusual meals beforehand.", "Ask whether this should be repeated fasting."];
  }

  if (/glucose|blood sugar/.test(name)) {
    return ["Check fasting status, recent meals, illness, and stress near the draw.", "Ask whether A1c or repeat fasting glucose would help."];
  }

  if (name.includes("vitamin d")) {
    return ["Bring current supplement, calcium, and multivitamin labels to the visit.", "Ask whether food changes, supplement review, or repeat testing makes sense."];
  }

  if (/creatinine|egfr|bun|kidney/.test(name) || result.category.toLowerCase().includes("kidney")) {
    return ["Note hydration, hard workouts, creatine, high-protein meals, and pain relievers.", "Ask whether repeat timing matters."];
  }

  if (/alt|ast|bilirubin|liver/.test(name) || result.category.toLowerCase().includes("liver")) {
    return ["Note alcohol, acetaminophen, supplements, illness, and intense exercise.", "Ask whether medication or supplement timing could matter."];
  }

  return ["Compare with prior reports and recent routine changes.", "Ask whether repeat testing or follow-up is appropriate."];
}

const hiddenStepLabels = new Set([
  "this week",
  "easy",
  "meal swap",
  "start with 1 regular choice",
  "2 times this week",
  "after your biggest carb meal",
  "daily",
  "nightly for 7 days",
  "5-10 min",
  "10-20 min",
]);

function shouldShowStepLabel(label: string) {
  const normalizedLabel = label.toLowerCase();
  return !hiddenStepLabels.has(normalizedLabel) && !normalizedLabel.includes("this week");
}

function nextStepText(item: NextStepItem) {
  return `${item.text} ${item.sourceText}`.toLowerCase();
}

function normalizeNextStepItem(item: NextStepItem): NextStepItem {
  const text = nextStepText(item);
  if (/add one vitamin-d food/.test(text)) {
    return {
      ...item,
      text: "Add salmon, eggs, or fortified milk.",
    };
  }
  if (/keep alcohol, pain relievers, supplements|liver markers are flagged/.test(text)) {
    return {
      ...item,
      text: "Avoid extra alcohol, supplements, pain relievers, or hard workouts.",
    };
  }
  if (/place movement after lunch or dinner/.test(text)) {
    return {
      ...item,
      text: "Take a short walk or stretch after lunch or dinner.",
    };
  }
  if (!/fasting instructions|pre-lab morning routine/.test(text)) return item;

  return {
    ...item,
    text: buildShortNextStep(item.sourceText || item.text),
  };
}

function isHiddenNextStep(item: NextStepItem, details: NextStepDetails) {
  const text = nextStepText(item);
  return (
    details.frequency === "Before your next lab" ||
    (item.category === "Routine" && /default grocery swap|grocery swap|keep oats|beans, nuts, olive oil|butter, cream, or processed meat/.test(text)) ||
    /no (food|movement|exercise|sleep|routine)-specific marker stood out/.test(text) ||
    /note hormone or reproductive context|profile lists gender|hormones|menopause|pregnancy|testosterone|gender-affirming/.test(text) ||
    /keep your current movement habit steady|keep the movement habit that already fits|pick one or two habits/.test(text)
  );
}

function redundancyKey(item: NextStepItem) {
  const text = nextStepText(item);
  if (/sweet drink|dessert|refined carb|white bread|white rice|juice|sweet coffee/.test(text)) return "reduce-sugar-refined-carbs";
  if (/carb-heavy meal|starch|rice|noodles|bread|pasta|potatoes|tortillas/.test(text)) return "smaller-starch-portion";
  if (/10-20 minute.*walk|20-30 minute.*walk|brisk.*walk|walk.*after|after lunch|after dinner|movement after/.test(text)) return "walk-or-move-after-meals";
  if (/5-10 minute walk or stretch|stretch break/.test(text)) return "walk-or-move-after-meals";
  if (/strength/.test(text)) return "strength";
  if (/soluble-fiber|fiber food|beans|oats|chia|high-fiber food/.test(text)) return "fiber-food";
  if (/saturated-fat|butter|cream|processed meat|fatty processed meat/.test(text)) return "saturated-fat-swap";
  if (/vitamin-d food|vitamin d food|salmon|sardines|trout|eggs|fortified/.test(text)) return "vitamin-d-food";
  if (/sleep and wake|sleep timing|wake time|bedtime/.test(text)) return "sleep-schedule";
  if (/night before|busy morning|water|walking shoes|wind-down cue|pre-work meal|travel basics|protein\/fiber snack/.test(text)) return "routine-setup";
  return `${item.category}:${item.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
}

function dedupeDetailedSteps(steps: Array<{ item: NextStepItem; details: NextStepDetails }>) {
  const bestByKey = new Map<string, { item: NextStepItem; details: NextStepDetails }>();

  for (const step of steps) {
    const key = redundancyKey(step.item);
    const existing = bestByKey.get(key);
    if (!existing || step.details.priority > existing.details.priority) {
      bestByKey.set(key, step);
    }
  }

  return steps.filter((step) => bestByKey.get(redundancyKey(step.item)) === step);
}

export function DashboardClient() {
  const [mode, setMode] = useState<DashboardMode>("loading");
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [actionPlanItems, setActionPlanItems] = useState<ActionPlanItem[]>([]);
  const [busyStepId, setBusyStepId] = useState<string | null>(null);
  const [planBusyAction, setPlanBusyAction] = useState<"reset" | null>(null);
  const [planMessage, setPlanMessage] = useState("");
  const [rawPdfStorage, setRawPdfStorage] = useState(false);
  const [selectedTrendMetric, setSelectedTrendMetric] = useState<TrendMetricKey>();
  const [openWhyStepId, setOpenWhyStepId] = useState<string | null>(null);
  const [recentlyDeletedStepIds, setRecentlyDeletedStepIds] = useState<Set<string>>(() => new Set());
  const nextStepsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(personId?: string) {
      const reportUrl = personId ? `/api/reports?personId=${encodeURIComponent(personId)}` : "/api/reports";
      const response = await fetch(reportUrl);
        if (cancelled) return;

        if (response.status === 401) {
          setReports([]);
          setActionPlanItems([]);
          setMode("guest-demo");
          return;
        }

        if (!response.ok) {
          setReports([]);
          setActionPlanItems([]);
          setMode("user-empty");
          return;
        }

        const body = await response.json();
        const nextReports = body.reports ?? [];
        if (cancelled) return;
        setReports(nextReports);
        setMode(nextReports.length ? "user-data" : "user-empty");

        const planUrl = personId ? `/api/action-plan?includeArchived=true&personId=${encodeURIComponent(personId)}` : "/api/action-plan?includeArchived=true";
        fetch(planUrl)
          .then(async (planResponse) => {
            if (!planResponse.ok || cancelled) return;
            const planBody = await planResponse.json();
            if (!cancelled) setActionPlanItems(planBody.items ?? []);
          })
          .catch(() => {});
    }

    fetch("/api/people")
      .then(async (peopleResponse) => {
        if (cancelled) return;

        if (peopleResponse.status === 401) {
          await loadDashboard();
          return;
        }

        if (!peopleResponse.ok) {
          await loadDashboard();
          return;
        }

        const peopleBody = await peopleResponse.json();
        const nextPeople: PersonOption[] = peopleBody.people ?? [];
        if (cancelled) return;

        setPeople(nextPeople);
        const storedPersonId = typeof window !== "undefined" ? window.localStorage.getItem("lablens-person-id") : "";
        const nextPersonId =
          nextPeople.find((person) => person.id === storedPersonId)?.id ??
          peopleBody.defaultPersonId ??
          nextPeople[0]?.id ??
          "";
        setSelectedPersonId(nextPersonId);
        await loadDashboard(nextPersonId);
      })
      .catch(() => {
        void loadDashboard();
      });

    fetch("/api/settings")
      .then(async (settingsResponse) => {
        if (!settingsResponse.ok || cancelled) return;
        const settingsBody = await settingsResponse.json();
        if (!cancelled) setRawPdfStorage(Boolean(settingsBody.settings?.storeRawPdfs));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const latestReport = reports[0];
  const latestResults = useMemo(
    () => (latestReport?.labResults ?? []).map(normalizeResult),
    [latestReport],
  );
  const latestSummary = latestReport?.summaryJson;
  const latestRecommendations = latestSummary?.recommendations ?? latestReport?.recommendationsJson;
  const selectedPersonName = people.find((person) => person.id === selectedPersonId)?.name;
  const liveTrendData = Array.from(
    reports
      .slice()
      .reverse()
      .reduce((points, report) => {
        const point = buildTrendPoint(report.reportDate, report.labResults.map(normalizeResult));
        if (!hasTrendValue(point)) return points;

        const key = new Date(report.reportDate).toISOString().slice(0, 10);
        const existing = points.get(key);
        points.set(key, { ...existing, ...point });
        return points;
      }, new Map<string, ReturnType<typeof buildTrendPoint>>())
      .values(),
  ).slice(-6);

  const isGuestDemo = mode === "guest-demo";
  const isLoading = mode === "loading";
  const hasData = mode === "user-data";
  const displayResults = isGuestDemo ? demoResults : latestResults;
  const displaySummary = isGuestDemo ? demoSummary : latestSummary;
  const displayTrendData = isGuestDemo ? trendData : liveTrendData;
  const visibleTrendMetrics = getVisibleTrendMetrics(displayTrendData);
  const activeTrendMetric = visibleTrendMetrics.some((metric) => metric.key === selectedTrendMetric)
    ? selectedTrendMetric
    : visibleTrendMetrics[0]?.key;
  const supportedTrendLabels = formatList(trendMetrics.map((metric) => metric.label));
  const visibleTrendLabels = formatList(visibleTrendMetrics.map((metric) => metric.label));
  const trendInfoText = `The graph shows percent change from each test's first saved result, so tests with different units can share one chart. Lines appear only when the app can safely match the same marker across reports. It currently looks for ${supportedTrendLabels}${visibleTrendLabels ? `; your saved reports include ${visibleTrendLabels}.` : "."}`;
  const reviewResults = displayResults.filter((result) => !["NORMAL", "UNKNOWN"].includes(result.flag));
  const unknownResultCount = displayResults.filter((result) => result.flag === "UNKNOWN").length;
  const snapshotScore = Math.max(
    35,
    Math.min(98, Math.round(92 - reviewResults.length * 8 - unknownResultCount * 2 + Math.min(visibleTrendMetrics.length * 2, 6))),
  );
  const scoreReason = `Why: ${reviewResults.length ? `${reviewResults.length} flagged` : "no flagged values"}${
    unknownResultCount ? `, ${unknownResultCount} not checked` : ""
  }${visibleTrendMetrics.length ? `, ${visibleTrendMetrics.length} matched trend${visibleTrendMetrics.length === 1 ? "" : "s"}` : ""}.`;
  const trendInsights = buildTrendInsights(displayTrendData, activeTrendMetric);
  const flagExplanations = new Map((displaySummary?.flags ?? []).map((flag) => [flag.testName, flag.explanation]));
  const recommendationGroups = [
    {
      icon: Apple,
      title: "Food",
      items: (isGuestDemo ? demoSummary.recommendations.food : latestRecommendations?.food) ?? [],
    },
    {
      icon: Dumbbell,
      title: "Movement",
      items: (isGuestDemo ? demoSummary.recommendations.exercise : latestRecommendations?.exercise) ?? [],
    },
    {
      icon: RotateCw,
      title: "Routine",
      items: (isGuestDemo ? demoSummary.recommendations.lifestyle : latestRecommendations?.lifestyle) ?? [],
    },
    {
      icon: Moon,
      title: "Sleep",
      items: (isGuestDemo ? demoSummary.recommendations.sleep : latestRecommendations?.sleep) ?? [],
    },
  ];
  const activeActionItems = actionPlanItems.filter((item) => item.status !== "ARCHIVED");
  const recommendationActions = recommendationGroups.flatMap((group) => group.items.map((item) => ({ category: group.title, text: item })));
  const recommendationKeys = new Set(recommendationActions.map((item) => actionKey(item.category, item.text)));
  const storedByRecommendationKey = new Map<string, ActionPlanItem>();

  for (const item of actionPlanItems) {
    const sourceText = item.notes ?? item.text;
    const key = actionKey(item.category, sourceText);
    if (!recommendationKeys.has(key)) continue;

    const existing = storedByRecommendationKey.get(key);
    const shouldReplace =
      !existing ||
      (existing.status === "ARCHIVED" && item.status !== "ARCHIVED") ||
      (existing.status === item.status && Date.parse(item.createdAt) > Date.parse(existing.createdAt));

    if (shouldReplace) storedByRecommendationKey.set(key, item);
  }

  const recommendationStepItems = recommendationActions.flatMap<NextStepItem>((recommendation, index): NextStepItem[] => {
    const key = actionKey(recommendation.category, recommendation.text);
    const storedItem = storedByRecommendationKey.get(key);
    if (storedItem?.status === "ARCHIVED") return [];

    if (storedItem) {
      return [
        {
          ...storedItem,
          sourceText: recommendation.text,
          isVirtual: false,
        },
      ];
    }

    return [
      {
        id: `suggested-${index}-${key}`,
        category: recommendation.category,
        text: buildShortNextStep(recommendation.text),
        status: "ACTIVE",
        notes: recommendation.text,
        createdAt: "",
        sourceText: recommendation.text,
        isVirtual: true,
      },
    ];
  });
  const legacyStepItems: NextStepItem[] = activeActionItems
    .filter((item) => !recommendationKeys.has(actionKey(item.category, item.notes ?? item.text)))
    .map((item) => ({
      ...item,
      sourceText: item.notes ?? item.text,
      isVirtual: false,
    }));
  const nextStepItems = [...recommendationStepItems, ...legacyStepItems];
  const resettableDeletedItems = actionPlanItems.filter((item) => {
    if (item.status !== "ARCHIVED") return false;
    const isCurrentRecommendation = recommendationKeys.has(actionKey(item.category, item.notes ?? item.text));
    return isCurrentRecommendation || recentlyDeletedStepIds.has(item.id);
  });
  const detailedNextStepItems = dedupeDetailedSteps(
    nextStepItems
      .map((rawItem) => {
        const item = normalizeNextStepItem(rawItem);
        return {
          item,
          details: buildNextStepDetails(item.category, item.text, item.sourceText),
        };
      })
      .filter(({ item, details }) => !isHiddenNextStep(item, details)),
  );
  const topStepItems = detailedNextStepItems
    .filter(({ item }) => item.status !== "DONE")
    .sort((first, second) => second.details.priority - first.details.priority)
    .slice(0, 3);
  const topStepIds = new Set(topStepItems.map(({ item }) => item.id));
  const nextStepGroups = [
    { icon: Moon, title: "Sleep" },
    { icon: RotateCw, title: "Routine" },
    { icon: Apple, title: "Food" },
    { icon: Dumbbell, title: "Movement" },
  ].map((group) => ({
    ...group,
    items: detailedNextStepItems.filter(({ item }) => item.category === group.title && !topStepIds.has(item.id)),
    topItems: topStepItems.filter(({ item }) => item.category === group.title),
  }));

  async function loadPersonDashboard(personId: string) {
    setSelectedPersonId(personId);
    setMode("loading");
    setReports([]);
    setActionPlanItems([]);
    setPlanMessage("");
    if (typeof window !== "undefined") window.localStorage.setItem("lablens-person-id", personId);

    const response = await fetch(`/api/reports?personId=${encodeURIComponent(personId)}`);

    if (!response.ok) {
      setMode(response.status === 401 ? "guest-demo" : "user-empty");
      return;
    }

    const body = await response.json();
    const nextReports = body.reports ?? [];
    setReports(nextReports);
    setMode(nextReports.length ? "user-data" : "user-empty");

    const planResponse = await fetch(`/api/action-plan?includeArchived=true&personId=${encodeURIComponent(personId)}`);
    if (planResponse.ok) {
      const planBody = await planResponse.json();
      setActionPlanItems(planBody.items ?? []);
    }
  }

  async function createActionPlanItem(category: string, text: string, notes?: string): Promise<{ item?: ActionPlanItem; error?: string }> {
    const response = await fetch("/api/action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, text, notes, reportId: latestReport?.id }),
    });
    const body = await response.json().catch(() => ({ error: "Could not add that habit." }));

    if (!response.ok) return { error: body.error ?? "Could not add that habit." };
    return { item: body.item };
  }

  async function ensurePersistedStep(step: NextStepItem) {
    if (!step.isVirtual) return step as ActionPlanItem;

    const { item, error } = await createActionPlanItem(step.category, step.sourceText);
    if (error || !item) {
      setPlanMessage(error ?? "Could not save that step.");
      return undefined;
    }

    setActionPlanItems((currentItems) => upsertActionItem(currentItems, item));
    return item;
  }

  async function patchActionStatus(item: ActionPlanItem, status: "ACTIVE" | "DONE") {
    const response = await fetch(`/api/action-plan/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await response.json().catch(() => ({ error: "Could not update that habit." }));

    if (!response.ok) return { error: body.error ?? "Could not update that step." };
    return { item: body.item as ActionPlanItem };
  }

  async function setStepStatus(step: NextStepItem, status: "ACTIVE" | "DONE") {
    if (!hasData) return;

    setBusyStepId(step.id);
    setPlanMessage(step.isVirtual ? "Saving step..." : "Updating step...");
    const persistedStep = await ensurePersistedStep(step);
    if (!persistedStep) {
      setBusyStepId(null);
      return;
    }

    const { item, error } = await patchActionStatus(persistedStep, status);
    setBusyStepId(null);

    if (error || !item) {
      setPlanMessage(error ?? "Could not update that step.");
      return;
    }

    setActionPlanItems((currentItems) => upsertActionItem(currentItems, item));
    setPlanMessage(status === "DONE" ? "Marked done." : "Moved back to active.");
  }

  async function archiveStep(step: NextStepItem) {
    if (!hasData) return;

    setBusyStepId(step.id);
    setPlanMessage(step.isVirtual ? "Saving deleted step..." : "Deleting step...");
    const persistedStep = await ensurePersistedStep(step);
    if (!persistedStep) {
      setBusyStepId(null);
      return;
    }

    const response = await fetch(`/api/action-plan/${persistedStep.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({ error: "Could not remove that habit." }));
    setBusyStepId(null);

    if (!response.ok) {
      setPlanMessage(body.error ?? "Could not delete that step.");
      return;
    }

    const archivedItem = (body.item as ActionPlanItem | undefined) ?? { ...persistedStep, status: "ARCHIVED" };
    setActionPlanItems((currentItems) => upsertActionItem(currentItems, archivedItem));
    setRecentlyDeletedStepIds((currentIds) => new Set(currentIds).add(archivedItem.id));
    setPlanMessage("Step deleted. Use Reset to bring it back.");
  }

  async function replaceStep(step: NextStepItem, details: NextStepDetails) {
    if (!hasData) return;

    setBusyStepId(step.id);
    setPlanMessage(details.isReplacement ? "Restoring original step..." : "Swapping step...");

    if (step.isVirtual) {
      const { item, error } = await createActionPlanItem(step.category, details.alternativeText, step.sourceText);
      setBusyStepId(null);

      if (error || !item) {
        setPlanMessage(error ?? "Could not replace that step.");
        return;
      }

      setActionPlanItems((currentItems) => upsertActionItem(currentItems, item));
      setPlanMessage("Step replaced with an easier option.");
      return;
    }

    const response = await fetch(`/api/action-plan/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: details.alternativeText, notes: step.sourceText }),
    });
    const body = await response.json().catch(() => ({ error: "Could not replace that step." }));
    setBusyStepId(null);

    if (!response.ok) {
      setPlanMessage(body.error ?? "Could not replace that step.");
      return;
    }

    setActionPlanItems((currentItems) => upsertActionItem(currentItems, body.item as ActionPlanItem));
    setPlanMessage(details.isReplacement ? "Original step restored." : "Step replaced with an easier option.");
  }

  async function restoreDeletedNextSteps() {
    if (!hasData) return;

    if (!resettableDeletedItems.length) {
      setPlanMessage("All current next steps are already showing.");
      return;
    }

    setPlanBusyAction("reset");
    setPlanMessage("Restoring deleted steps...");
    const results = await Promise.all(
      resettableDeletedItems.map(async (item) => {
        const response = await fetch(`/api/action-plan/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        const body = await response.json().catch(() => ({ error: "Could not restore that step." }));
        return { ok: response.ok, item: body.item as ActionPlanItem | undefined, error: body.error as string | undefined };
      }),
    );
    setPlanBusyAction(null);

    const failed = results.find((result) => !result.ok);
    if (failed) {
      setPlanMessage(failed.error ?? "Could not restore every deleted step.");
      return;
    }

    const restoredItems = results.map((result) => result.item).filter((item): item is ActionPlanItem => Boolean(item));
    setActionPlanItems((currentItems) => restoredItems.reduce((items, item) => upsertActionItem(items, item), currentItems));
    setRecentlyDeletedStepIds((currentIds) => {
      const nextIds = new Set(currentIds);
      restoredItems.forEach((item) => nextIds.delete(item.id));
      return nextIds;
    });
    setPlanMessage(`Restored ${restoredItems.length} step${restoredItems.length === 1 ? "" : "s"}.`);
  }

  function renderStepMeta(item: NextStepItem, details: NextStepDetails, scope: string) {
    const whyId = `${scope}-${item.id}`;
    const visibleLabels = [details.frequency, details.effort].filter(shouldShowStepLabel);

    return (
      <>
        {visibleLabels.map((label) => (
          <span key={label} className="rounded-md border border-border bg-panel px-2 py-1 font-semibold text-muted">
            {label}
          </span>
        ))}
        {details.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">
            {tag}
          </span>
        ))}
        {details.reason ? (
          <span className="relative inline-flex">
            <button
              type="button"
              aria-label="Why this step"
              aria-expanded={openWhyStepId === whyId}
              onClick={() => setOpenWhyStepId((current) => (current === whyId ? null : whyId))}
              onMouseEnter={() => setOpenWhyStepId(whyId)}
              onMouseLeave={() => setOpenWhyStepId(null)}
              onFocus={() => setOpenWhyStepId(whyId)}
              onBlur={() => setOpenWhyStepId(null)}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-panel text-primary transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Info className="size-3.5" aria-hidden="true" />
            </button>
            {openWhyStepId === whyId ? (
              <span className="absolute left-0 top-9 z-20 w-[min(18rem,calc(100vw-3rem))] rounded-md border border-border bg-panel p-3 text-left text-sm font-normal leading-6 text-muted shadow-lg">
                {details.reason}
              </span>
            ) : null}
          </span>
        ) : null}
      </>
    );
  }

  function renderStepControls(item: NextStepItem, details: NextStepDetails) {
    if (!hasData) return null;

    const done = item.status === "DONE";

    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => void setStepStatus(item, done ? "ACTIVE" : "DONE")}
          disabled={busyStepId === item.id || Boolean(planBusyAction)}
          className={`inline-flex size-9 items-center justify-center rounded-md border bg-panel transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 disabled:opacity-60 ${
            done ? "border-success/40 text-success" : "border-border text-muted"
          }`}
          aria-label={done ? "Mark step active" : "Mark step done"}
          title={done ? "Mark active" : "Mark done"}
        >
          <CheckCircle2 className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void replaceStep(item, details)}
          disabled={busyStepId === item.id || Boolean(planBusyAction)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-panel text-muted transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-primary disabled:opacity-60"
          aria-label={details.isReplacement ? "Use original step" : "Replace step"}
          title={details.isReplacement ? "Use original" : "Replace step"}
        >
          <RotateCw className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void archiveStep(item)}
          disabled={busyStepId === item.id || Boolean(planBusyAction)}
          className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-panel text-muted transition hover:-translate-y-0.5 hover:border-danger/50 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
          aria-label="Delete step"
          title="Delete"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </span>
    );
  }

  function renderStepFooter(item: NextStepItem, details: NextStepDetails, scope: string) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {renderStepMeta(item, details, scope)}
        {renderStepControls(item, details)}
      </div>
    );
  }

  function renderStepSideActions(item: NextStepItem, details: NextStepDetails, scope: string) {
    return (
      <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2 text-xs sm:max-w-[18rem]">
        {renderStepMeta(item, details, scope)}
        {renderStepControls(item, details)}
      </div>
    );
  }

  const startHereCard = topStepItems.length ? (
    <article className="h-full rounded-md border border-primary/25 bg-primary/10 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Start here</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Smallest useful steps from this report.</p>
        </div>
        <Link href="#my-next-steps" className="rounded-md border border-primary/30 bg-panel/60 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10">
          All steps
        </Link>
      </div>
      <div className="mt-3 grid gap-2">
        {topStepItems.map(({ item, details }, index) => {
          const done = item.status === "DONE";
          return (
            <div key={`hero-${item.id}`} className="rounded-md border border-border-soft bg-panel/75 p-3 dark:bg-white/[0.05]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-white dark:text-[#02110f]">{index + 1}</span>
                <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
                  <p className={`text-sm leading-6 ${done ? "text-muted line-through" : "text-foreground"}`}>{item.text}</p>
                  {renderStepSideActions(item, details, "hero")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  ) : null;

  const nextStepsSection = (
    <section id="my-next-steps" ref={nextStepsRef} className="scroll-mt-8 grid gap-5 rounded-md border border-border-soft bg-surface-glass p-5 shadow-[var(--shadow-glass)] backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">My next steps</h2>
          <p className="text-sm text-muted">Short steps based on markers in this report.</p>
        </div>
        {hasData ? (
          <button
            type="button"
            onClick={() => void restoreDeletedNextSteps()}
            disabled={!resettableDeletedItems.length || Boolean(planBusyAction)}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-muted transition hover:border-primary/50 hover:bg-panel-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            {planBusyAction === "reset" ? "Resetting..." : "Reset"}
          </button>
        ) : null}
      </div>
      {planMessage ? <p className="rounded-md border border-border-soft bg-panel/75 p-3 text-sm text-muted">{planMessage}</p> : null}
      {detailedNextStepItems.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {nextStepGroups.map((group) => (
            <section key={group.title} className="rounded-md border border-border-soft bg-surface-raised/80 p-4 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                <group.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{group.title}</h3>
              </div>
              {group.items.length ? (
                <div className="mt-3 grid gap-3">
                  {group.items.map(({ item, details }) => {
                    const done = item.status === "DONE";
                    return (
                      <article key={item.id} className="border-t border-border pt-3">
                        <div className="grid gap-0">
                          <p className={`text-sm leading-6 ${done ? "text-muted line-through" : "text-foreground"}`}>{item.text}</p>
                          {renderStepFooter(item, details, "group")}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted">
                  {group.topItems.length ? "Shown in Start here." : `No saved ${group.title.toLowerCase()} steps.`}
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-panel-muted p-4 text-sm text-muted">
          {resettableDeletedItems.length ? "All current steps are hidden. Use Reset to bring them back." : "No next steps yet."}
        </p>
      )}
    </section>
  );

  const headerPersonSelector =
    !isGuestDemo && people.length ? (
      <label className="grid w-full gap-2 text-sm font-medium sm:w-80">
        Person
        <select
          value={selectedPersonId}
          onChange={(event) => void loadPersonDashboard(event.target.value)}
          className="min-h-11 rounded-md border border-border-soft bg-panel/85 px-3"
        >
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.isDefault ? " (default)" : ""}
            </option>
          ))}
        </select>
      </label>
    ) : (
      <label className="grid w-full gap-2 text-sm font-medium sm:w-80">
        Person
        <select value={isLoading ? "loading" : "demo"} disabled className="min-h-11 rounded-md border border-border-soft bg-panel/85 px-3 text-muted">
          <option value={isLoading ? "loading" : "demo"}>{isLoading ? "Loading..." : "Demo profile"}</option>
        </select>
      </label>
    );

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-5 px-3 py-4 sm:gap-8 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-md border border-border-soft bg-surface-glass p-4 shadow-[var(--shadow-glass)] backdrop-blur sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">Health snapshot</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-4xl">Lab report review</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:mt-3 sm:text-base sm:leading-7">
            See what changed, what needs review, and what small steps fit this report.
          </p>
        </div>
        {headerPersonSelector}
      </div>

      {isGuestDemo ? (
        <p className="rounded-md border border-border-soft bg-surface-glass p-4 text-sm text-muted shadow-[var(--shadow-glass)] backdrop-blur">Login to see saved reports. Demo values are shown below.</p>
      ) : null}

      {isLoading ? (
        <p className="rounded-md border border-border-soft bg-surface-glass p-4 text-sm text-muted shadow-[var(--shadow-glass)] backdrop-blur">Loading saved reports...</p>
      ) : null}

      {mode === "user-empty" ? (
        <section className="rounded-md border border-border-soft bg-surface-glass p-6 shadow-[var(--shadow-glass)] backdrop-blur">
          <h2 className="text-xl font-semibold">No saved lab values{selectedPersonName ? ` for ${selectedPersonName}` : ""}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Your saved reports and lab values have been deleted or have not been added yet. Upload a PDF or add a result manually to rebuild your dashboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/upload" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-white dark:text-[#02110f]">
              <FileUp className="size-4" aria-hidden="true" />
              Upload PDF
            </Link>
            <Link href="/manual" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-soft bg-panel/70 px-4 font-semibold">
              <Plus className="size-4" aria-hidden="true" />
              Add result
            </Link>
          </div>
        </section>
      ) : null}

      {!isLoading && mode !== "user-empty" ? (
        <>
          <HealthScoreHero
            rawPdfStorageHref="/settings#data"
            rawPdfStorageValue={rawPdfStorage ? "On" : "Off"}
            reviewCount={reviewResults.length}
            reviewHref="#review-flags"
            reviewValue={`${reviewResults.length} flag${reviewResults.length === 1 ? "" : "s"}`}
            savedReportsHref={hasData ? "/reports" : "/login"}
            savedReportsValue={hasData ? `${reports.length}` : "Demo"}
            score={snapshotScore}
            scoreReason={scoreReason}
            statusLabel={getHealthScoreStatusLabel(snapshotScore)}
            startHereCard={startHereCard}
          />

          {nextStepsSection}

          <section id="review-flags" className="scroll-mt-8 grid gap-4 rounded-md border border-border-soft bg-surface-glass p-5 shadow-[var(--shadow-glass)] backdrop-blur">
            <div>
              <h2 className="text-xl font-semibold">Needs review</h2>
              <p className="text-sm text-muted">
                {hasData ? `Generated from ${latestReport?.labName ?? "your latest report"}.` : "Generated from parsed demo data until you login."}
              </p>
            </div>
            {reviewResults.length ? (
              <>
                <p className="text-sm text-muted">{`${reviewResults.length} value${reviewResults.length === 1 ? "" : "s"} outside or near the supplied reference range.`}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {reviewResults.map((result) => (
                    <article key={`${result.testName}-${result.value ?? result.stringValue}`} className="rounded-md border border-border-soft bg-surface-raised/80 p-4 dark:bg-white/[0.04]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{result.testName}</h3>
                        <span className="rounded-md bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">{result.flag.toLowerCase()}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {flagExplanations.get(result.testName) ??
                          `${result.testName} is flagged against the reference range supplied on the report.`}
                      </p>
                      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                        {reviewPrompts(result).map((prompt) => (
                          <li key={prompt}>{prompt}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-md bg-panel-muted p-4 text-sm text-muted">
                No latest values are flagged by the supplied reference ranges. You can still review the full table below, especially values marked not evaluated.
              </p>
            )}
          </section>

          <TrendInstrument
            data={displayTrendData}
            selectedMetric={activeTrendMetric}
            onSelectMetric={setSelectedTrendMetric}
            trendInfoText={trendInfoText}
            trendInsights={trendInsights}
          />

          <section id="latest-lab-values" className="scroll-mt-8 grid gap-4 rounded-md border border-border-soft bg-surface-glass p-5 shadow-[var(--shadow-glass)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Full table</p>
              <h2 className="mt-1 text-xl font-semibold">Latest lab values</h2>
            </div>
            {displayResults.length ? <ResultsTable results={displayResults} /> : <p className="rounded-md border border-border bg-panel p-4 text-sm text-muted">No structured lab rows were saved for the latest report.</p>}
          </section>
        </>
      ) : null}
    </div>
  );
}
