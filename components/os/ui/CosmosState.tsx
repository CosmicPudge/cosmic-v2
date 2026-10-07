"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import clsx from "clsx";

type CosmosStateKind = "loading" | "empty" | "error";

interface CosmosStateProps {
  kind: CosmosStateKind;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

const defaults: Record<CosmosStateKind, { title: string; message: string }> = {
  loading: { title: "Loading", message: "Getting the latest information ready." },
  empty: { title: "Nothing here yet", message: "There is no information to show right now." },
  error: { title: "Something went wrong", message: "This section could not be loaded." },
};

export default function CosmosState({
  kind,
  title,
  message,
  actionLabel = "Try again",
  onAction,
  icon,
  className,
}: CosmosStateProps) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "empty" ? Inbox : AlertTriangle;
  return (
    <div className={clsx("cosmos-state", "cosmos-state-" + kind, className)} role={kind === "error" ? "alert" : "status"}>
      <div className="cosmos-state-icon" aria-hidden="true">
        {icon ?? <Icon size={21} className={kind === "loading" ? "animate-spin motion-reduce:animate-none" : undefined} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title ?? defaults[kind].title}</p>
        <p className="mt-1 text-sm leading-5 text-white/50">{message ?? defaults[kind].message}</p>
      </div>
      {kind === "error" && onAction && (
        <button type="button" onClick={onAction} className="cosmos-state-action">
          <RotateCcw size={15} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
