import { ActivitySquare } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-md bg-primary text-white shadow-sm dark:text-[#02110f]">
        <ActivitySquare className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-5 text-foreground">{APP_NAME}</p>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Private labs</p>
      </div>
    </div>
  );
}
