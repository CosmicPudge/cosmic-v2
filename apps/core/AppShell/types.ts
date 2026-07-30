import type { ReactNode } from "react";

import type { AppPresentation } from "../types";

export interface AppShellProps {
  presentation: AppPresentation;

  children: ReactNode;

  className?: string;
}