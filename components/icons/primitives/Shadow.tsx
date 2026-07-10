"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function Shadow({
  children,
}: Props) {

  return (
    <div
      style={{
        filter:
          "drop-shadow(0 6px 8px rgba(0,0,0,.22))",
      }}
    >
      {children}
    </div>
  );
}