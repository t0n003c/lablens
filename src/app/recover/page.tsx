import { Logo } from "@/components/logo";
import { RecoveryPanel } from "@/components/recovery-panel";

export default function RecoverPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-border bg-panel p-6">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold">Account recovery</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Create a short-lived recovery token, then use it to reset your password. Local development shows the token directly.
        </p>
        <div className="mt-6">
          <RecoveryPanel />
        </div>
      </section>
    </main>
  );
}
