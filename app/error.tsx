"use client";

import { useEffect } from "react";

import CosmicErrorFallback from "@/components/os/app/CosmicErrorFallback";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <CosmicErrorFallback onRetry={unstable_retry} />;
}
