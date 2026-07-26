export interface CommandAction {
  id: string;

  title: string;

  subtitle?: string;

  category:
    | "Apps"
    | "System"
    | "Search"
    | "AI"
    | "Settings";

  keywords: string[];

  icon?: React.ReactNode;

  run(): void;
}