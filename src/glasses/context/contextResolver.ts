export type ContextSource =
  | "navigation"
  | "call"
  | "calendar"
  | "sports"
  | "blank";

export type ContextCandidates = {
  navigation: string;
  call: string;
  calendar: string;
  sports: string;
};

export type ResolvedContext = {
  source: ContextSource;
  content: string;
};

export function resolveContext(
  candidates: ContextCandidates,
): ResolvedContext {
  if (candidates.navigation) {
    return {
      source: "navigation",
      content: candidates.navigation,
    };
  }

  if (candidates.call) {
    return {
      source: "call",
      content: candidates.call,
    };
  }

  if (candidates.calendar) {
    return {
      source: "calendar",
      content: candidates.calendar,
    };
  }

  if (candidates.sports) {
    return {
      source: "sports",
      content: candidates.sports,
    };
  }

  return {
    source: "blank",
    content: "",
  };
}
