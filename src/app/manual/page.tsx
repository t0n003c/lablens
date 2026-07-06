import { AppShell } from "@/components/app-shell";
import { ManualEntryForm } from "@/components/manual-entry-form";

export default function ManualPage() {
  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Manual report</p>
          <h1 className="mt-2 text-3xl font-semibold">Add a lab value</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Manual reports use the same range flagging and summary pipeline as parsed PDFs.
          </p>
        </div>
        <ManualEntryForm />
      </div>
    </AppShell>
  );
}
