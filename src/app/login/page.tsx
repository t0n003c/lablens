import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { AuthPanel } from "@/components/auth-panel";

export default function LoginPage() {
  return (
    <AuthFrame
      title="Welcome back"
      description="Your health data stays on your self-hosted instance. Login with your password, then biometric if you turned it on."
      footer={
        <p>
          New here?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      }
    >
      <AuthPanel mode="login" />
    </AuthFrame>
  );
}
