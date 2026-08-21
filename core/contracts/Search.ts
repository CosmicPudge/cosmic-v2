export type SearchCategory =
  | "apps"
  | "calendar"
  | "mail"
  | "school"
  | "sports"
  | "garage"
  | "projects"
  | "notes"
  | "clock"
  | "music"
  | "finance"
  | "files"
  | "settings"
  | "system";

export interface SearchQuery {
  original: string;
  normalized: string;
  tokens: string[];
  categories?: SearchCategory[];
  contextCategory?: SearchCategory;
}

export type SearchMetadataValue = string | number | boolean | null;

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  icon?: string;
  href?: string;
  action?: string;
  score: number;
  source: string;
  metadata?: Record<string, SearchMetadataValue>;
}

/** Ephemeral provider output. Searchable text is stripped before UI delivery. */
export interface SearchProviderRecord extends Omit<SearchResult, "score"> {
  searchableText?: string;
  boost?: number;
  updatedAt?: string | number;
}

export interface SearchProviderContext {
  signal: AbortSignal;
  limit: number;
}

export interface SearchProvider {
  id: string;
  categories: SearchCategory[];
  mode?: "local" | "remote";
  search(
    query: SearchQuery,
    context: SearchProviderContext,
  ): SearchProviderRecord[] | Promise<SearchProviderRecord[]>;
}

export interface SearchProviderWarning {
  provider: string;
  message: string;
}

export interface SearchSnapshot {
  query: SearchQuery;
  results: SearchResult[];
  warnings: SearchProviderWarning[];
  complete: boolean;
}
