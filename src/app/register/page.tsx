import Link from "next/link";
import { AuthPanel } from "@/components/auth-panel";
import { Logo } from "@/components/logo";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-border bg-panel p-6">
        <Logo />
        <div className="mt-8">
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Use a strong password; 2FA and passkeys can be added after login.</p>
        </div>
        <div className="mt-6">
          <AuthPanel mode="register" />
        </div>
        <p className="mt-5 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
