import { normalizeOpordDocument } from "./selectors";
import { parseAfrotcOpord, OPORD_PARSER_VERSION } from "./parser";
import type { OpordDocument } from "./types";
import type { SourceTextLayoutItem } from "@/services/school/sources/extractText";

export function parseAndNormalizeOpord(input: { text: string; sourceId: string; sourceName: string; layout?: SourceTextLayoutItem[] }): OpordDocument {
  const document = normalizeOpordDocument(parseAfrotcOpord(input));
  return { ...document, parserVersion: document.parserVersion ?? OPORD_PARSER_VERSION };
}

export function isCurrentOpordDocument(document: Pick<OpordDocument, "parserVersion">): boolean {
  return document.parserVersion === OPORD_PARSER_VERSION;
}

export function replaceOpordIntelligence(previous: OpordDocument | null | undefined, next: OpordDocument): OpordDocument {
  void previous;
  return next;
}
