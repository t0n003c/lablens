import { AuthFrame } from "@/components/auth-frame";
import { RecoveryPanel } from "@/components/recovery-panel";

export default function RecoverPage() {
  return (
    <AuthFrame
      title="Account recovery"
      description="Create a short-lived recovery token, then use it to reset your password. Local development shows the token directly."
    >
      <RecoveryPanel />
    </AuthFrame>
  );
}
