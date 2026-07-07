import { LabLensVisual } from "@/components/lablens-visual";
import { Logo } from "@/components/logo";

export function AuthFrame({
  children,
  description,
  footer,
  title,
}: {
  children: React.ReactNode;
  description: string;
  footer?: React.ReactNode;
  title: string;
}) {
  return (
    <main className="grid min-h-screen bg-background px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
      <section className="mx-auto grid w-full max-w-md content-center">
        <div className="rounded-md border border-border bg-panel p-6 shadow-[var(--shadow-card)] sm:p-7">
          <Logo />
          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Private health records</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          </div>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-5 text-sm text-muted">{footer}</div> : null}
        </div>
      </section>
      <aside className="hidden content-center lg:grid">
        <div className="mx-auto grid w-full max-w-xl gap-5 px-8">
          <LabLensVisual variant="trust" className="aspect-square w-full shadow-[var(--shadow-glass)]" />
          <div className="grid gap-3 rounded-md border border-border bg-panel p-5 shadow-[var(--shadow-card)]">
            <p className="font-semibold">Built for careful review</p>
            <p className="text-sm leading-6 text-muted">
              Keep reports private, confirm extracted values, and use biometric login as a second step after your password.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
