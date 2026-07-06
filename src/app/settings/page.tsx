import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Preferences</p>
          <h1 className="mt-2 text-3xl font-semibold">Settings</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Security, data retention, AI provider, theme, export, and deletion controls live here.
          </p>
        </div>
        <SettingsPanel />
      </div>
    </AppShell>
  );
}
