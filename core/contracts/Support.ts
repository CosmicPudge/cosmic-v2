export const supportModules = ["Dashboard", "Sports", "Garage", "Finance", "Calendar", "Mail", "Music", "Context", "Search", "Notes", "Projects", "Account", "Settings", "Billing", "Other"] as const;
export type SupportModule = typeof supportModules[number];
export type SupportReportType = "bug" | "feature" | "feedback";
export type SupportSeverity = "cosmetic" | "annoying" | "broken" | "unusable";
export type SupportReportStatus = "submitted" | "reviewing" | "needs_info" | "fixing" | "fixed" | "closed";
export interface SupportReportDiagnostics { route: string; version: string; environment: string; browser: string; viewport?: string; signedIn: boolean; accountId?: string; effectivePlan?: "free" | "cosmic_plus"; timestamp: string; module?: SupportModule; errorSummary?: string; }
