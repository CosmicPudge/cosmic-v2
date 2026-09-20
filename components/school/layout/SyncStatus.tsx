import { CloudCheck, CloudOff, HardDrive, LoaderCircle, TriangleAlert } from "lucide-react";
import { useSchool } from "../context/SchoolDataContext";
import { schoolSyncPresentation } from "@/services/school/trustPresentation";

export function SyncStatus() {
  const { local } = useSchool();
  const status = schoolSyncPresentation(local.scope.kind, local.sync.status, local.sync.lastSyncedAt);
  const Icon = status.mode === "local" ? HardDrive
    : status.mode === "synced" ? CloudCheck
      : status.mode === "pending" ? LoaderCircle
        : status.mode === "conflict" ? TriangleAlert
          : CloudOff;
  const iconClass = status.mode === "synced" ? "text-emerald-200/75" : status.mode === "local" ? "text-white/45" : "text-amber-200/70";
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/45" role="status" title={status.detail} aria-label={`${status.label}. ${status.detail}`}>
      <Icon className={`size-3.5 ${iconClass} ${status.mode === "pending" ? "animate-spin" : ""}`} aria-hidden="true" />
      {status.label}
    </div>
  );
}

export default SyncStatus;
