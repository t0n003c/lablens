import { AppShell } from "@/components/app-shell";
import { UploadReview } from "@/components/upload-review";

export default function UploadPage() {
  return (
    <AppShell>
      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">PDF intake</p>
          <h1 className="mt-2 text-3xl font-semibold">Upload a MyQuest report</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Extracted values are saved as a draft with parser warnings visible before you rely on the summary.
          </p>
        </div>
        <UploadReview />
      </div>
    </AppShell>
  );
}
