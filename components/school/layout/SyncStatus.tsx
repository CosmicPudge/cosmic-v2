import { CloudCheck } from "lucide-react";

export function SyncStatus() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/45" role="status">
      <CloudCheck className="size-3.5 text-emerald-200/75" aria-hidden="true" />
      Synced just now
    </div>
  );
}

export default SyncStatus;
