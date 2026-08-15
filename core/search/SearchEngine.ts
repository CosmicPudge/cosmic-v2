import type {
  SearchCategory,
  SearchProvider,
  SearchProviderRecord,
  SearchProviderWarning,
  SearchQuery,
  SearchResult,
  SearchSnapshot,
} from "@/core/contracts/Search";

export interface SearchOptions {
  categories?: SearchCategory[];
  contextCategory?: SearchCategory;
  limit?: number;
  perProviderLimit?: number;
  remoteDelayMs?: number;
  signal?: AbortSignal;
  onPartial?: (snapshot: SearchSnapshot) => void;
}

const DEFAULT_LIMIT = 28;
const DEFAULT_PROVIDER_LIMIT = 8;

export function normalizeSearchQuery(
  value: string,
  categories?: SearchCategory[],
  contextCategory?: SearchCategory,
): SearchQuery {
  const original = value.trim().replace(/\s+/g, " ");
  const normalized = original.toLocaleLowerCase();

  return {
    original,
    normalized,
    tokens: normalized ? normalized.split(" ") : [],
    ...(categories?.length ? { categories } : {}),
    ...(contextCategory ? { contextCategory } : {}),
  };
}

function normalized(value?: string) {
  return value?.trim().toLocaleLowerCase().replace(/\s+/g, " ") ?? "";
}

function tokenMatches(value: string, token: string) {
  return value.includes(token);
}

function scoreRecord(record: SearchProviderRecord, query: SearchQuery) {
  const title = normalized(record.title);
  const subtitle = normalized(record.subtitle);
  const description = normalized(record.description);
  const searchable = normalized(record.searchableText);
  const keywords = (record.keywords ?? []).map(normalized);
  const titleWords = title.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const allText = [title, subtitle, description, searchable, ...keywords].join(" ");

  if (!query.tokens.every((token) => tokenMatches(allText, token))) {
    return null;
  }

  let score = 0;

  if (title === query.normalized) score += 1_000;
  else if (title.startsWith(query.normalized)) score += 760;
  else if (title.includes(query.normalized)) score += 440;

  for (const token of query.tokens) {
    if (titleWords.includes(token)) score += 220;
    else if (titleWords.some((word) => word.startsWith(token))) score += 175;
    else if (title.includes(token)) score += 120;

    if (keywords.includes(token)) score += 145;
    else if (keywords.some((keyword) => keyword.startsWith(token))) score += 105;
    else if (keywords.some((keyword) => keyword.includes(token))) score += 75;

    if (subtitle.includes(token)) score += 60;
    if (description.includes(token)) score += 36;
    if (searchable.includes(token)) score += 18;
  }

  if (query.normalized.length <= 3 && record.category === "apps") score += 90;
  if (query.contextCategory === record.category) score += 16;

  if (record.updatedAt) {
    const timestamp = typeof record.updatedAt === "number"
      ? record.updatedAt
      : Date.parse(record.updatedAt);
    if (Number.isFinite(timestamp)) {
      const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
      score += Math.max(0, 34 - ageDays * 1.4);
    }
  }

  score += Math.max(-30, Math.min(60, record.boost ?? 0));
  return Math.round(score * 100) / 100;
}

function compareResults(left: SearchResult, right: SearchResult) {
  return right.score - left.score
    || left.title.localeCompare(right.title)
    || left.source.localeCompare(right.source)
    || left.id.localeCompare(right.id);
}

function toResult(record: SearchProviderRecord, score: number): SearchResult {
  return {
    id: record.id,
    category: record.category,
    title: record.title,
    ...(record.subtitle ? { subtitle: record.subtitle } : {}),
    ...(record.description ? { description: record.description } : {}),
    ...(record.keywords ? { keywords: record.keywords } : {}),
    ...(record.icon ? { icon: record.icon } : {}),
    ...(record.href ? { href: record.href } : {}),
    ...(record.action ? { action: record.action } : {}),
    score,
    source: record.source,
    ...(record.metadata ? { metadata: record.metadata } : {}),
  };
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Search cancelled", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Search cancelled", "AbortError"));
    }, { once: true });
  });
}

export class SearchEngine {
  private providers = new Map<string, SearchProvider>();

  register(provider: SearchProvider) {
    this.providers.set(provider.id, provider);
    return () => this.unregister(provider.id);
  }

  unregister(id: string) {
    this.providers.delete(id);
  }

  getProviders() {
    return [...this.providers.values()];
  }

  getCategories() {
    return [...new Set(this.getProviders().flatMap((provider) => provider.categories))];
  }

  async search(value: string, options: SearchOptions = {}): Promise<SearchSnapshot> {
    const query = normalizeSearchQuery(value, options.categories, options.contextCategory);
    const controller = options.signal ? null : new AbortController();
    const signal = options.signal ?? controller!.signal;
    const limit = options.limit ?? DEFAULT_LIMIT;
    const perProviderLimit = options.perProviderLimit ?? DEFAULT_PROVIDER_LIMIT;
    const records: SearchResult[] = [];
    const warnings: SearchProviderWarning[] = [];

    const snapshot = (complete: boolean): SearchSnapshot => {
      const deduplicated = new Map<string, SearchResult>();
      for (const result of records) {
        const identity = `${result.source}:${result.category}:${result.id}`;
        const current = deduplicated.get(identity);
        if (!current || result.score > current.score) deduplicated.set(identity, result);
      }

      return {
        query,
        results: [...deduplicated.values()].sort(compareResults).slice(0, limit),
        warnings: [...warnings],
        complete,
      };
    };

    if (!query.normalized || signal.aborted) return snapshot(true);

    const selected = this.getProviders().filter((provider) =>
      !options.categories?.length
      || provider.categories.some((category) => options.categories?.includes(category)),
    );
    const local = selected.filter((provider) => provider.mode !== "remote");
    const remote = selected.filter((provider) => provider.mode === "remote");

    const runProvider = async (provider: SearchProvider) => {
      try {
        const found = await provider.search(query, { signal, limit: perProviderLimit });
        if (signal.aborted) return;
        const ranked = found
          .filter((record) => provider.categories.includes(record.category))
          .map((record) => {
            const score = scoreRecord(record, query);
            return score === null ? null : toResult(record, score);
          })
          .filter((result): result is SearchResult => result !== null)
          .sort(compareResults)
          .slice(0, perProviderLimit);
        records.push(...ranked);
      } catch (cause) {
        if (signal.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return;
        warnings.push({ provider: provider.id, message: `${provider.id} is temporarily unavailable.` });
      }

      if (!signal.aborted) options.onPartial?.(snapshot(false));
    };

    await Promise.all(local.map(runProvider));
    if (signal.aborted) return snapshot(false);

    if (remote.length) {
      try {
        await wait(options.remoteDelayMs ?? 220, signal);
        await Promise.all(remote.map(runProvider));
      } catch (cause) {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) throw cause;
      }
    }

    const final = snapshot(!signal.aborted);
    if (!signal.aborted) options.onPartial?.(final);
    return final;
  }
}
