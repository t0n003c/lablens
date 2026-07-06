import { AppShell } from "@/components/app-shell";
import { PeoplePanel } from "@/components/people-panel";

export default function PeoplePage() {
  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Profiles</p>
          <h1 className="mt-2 text-3xl font-semibold">People</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Add each person who may upload lab reports in this account, and keep their recommendation profile separate.
          </p>
        </div>
        <PeoplePanel />
      </div>
    </AppShell>
  );
}
