"use client";

import type { ReactNode } from "react";

interface AppHeaderTab {
  id: string;
  label: string;
  active?: boolean;
  onSelect?: () => void;
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightContent?: ReactNode;
  tabs?: AppHeaderTab[];
}

export default function AppHeader({
  title,
  subtitle,
  eyebrow,
  rightContent,
  tabs,
}: AppHeaderProps) {
  return (
    <header className="cosmos-page-header">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="cosmos-eyebrow">{eyebrow}</p>}
          <h1 className="cosmos-page-title">{title}</h1>
          {subtitle && <p className="cosmos-page-subtitle">{subtitle}</p>}
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="cosmos-page-tabs" role="tablist" aria-label={`${title} sections`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.active === true}
              onClick={tab.onSelect}
              className={`cosmos-page-tab ${tab.active ? "cosmos-page-tab-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
