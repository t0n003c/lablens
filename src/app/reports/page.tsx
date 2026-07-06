import { AppShell } from "@/components/app-shell";
import { ReportsBrowser } from "@/components/reports-browser";

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">History</p>
            <h1 className="mt-2 text-3xl font-semibold">Reports</h1>
          </div>
        </div>
        <ReportsBrowser />
      </div>
    </AppShell>
  );
}
