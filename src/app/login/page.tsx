import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-border bg-panel p-6">
        <Logo />
        <div className="mt-8">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Your health data stays on your self-hosted instance.</p>
        </div>
        <div className="mt-6">
          <AuthPanel mode="login" />
        </div>
        <p className="mt-5 text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
