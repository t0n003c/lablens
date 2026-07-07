import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";
import { AuthPanel } from "@/components/auth-panel";

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Create your account"
      description="Use a strong password now. After login, you can add 2FA and require biometric as a second step."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Login
          </Link>
        </p>
      }
    >
      <AuthPanel mode="register" />
    </AuthFrame>
  );
}
