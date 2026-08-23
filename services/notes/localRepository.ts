"use client";

import { useCallback, useEffect, useState } from "react";

import type { Note, NotesLocalData } from "@/core/contracts/Notes";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy, useCosmicScope } from "@/services/storage/scope";
import { useCloudSnapshotSync } from "@/services/sync/useCloudSnapshotSync";

export const NOTES_STORAGE_KEY = "cosmic.notes.local-data";
export const NOTES_UPDATE_EVENT = "cosmic:notes-updated";
export const emptyNotesData: NotesLocalData = { version: 1, notes: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readNotesSnapshot(scopeId?: string): NotesLocalData {
  try {
    const stored = readScopedOrLegacy("notes", scopeId); const raw = stored.raw;
    if (stored.migrated && raw) migrateLegacyStorage("notes", raw, scopeId);
    const value: unknown = raw ? JSON.parse(raw) : undefined;

    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.notes)) {
      return emptyNotesData;
    }

    return {
      version: 1,
      notes: value.notes.filter(
        (note): note is Note =>
          isRecord(note) &&
          typeof note.id === "string" &&
          typeof note.body === "string",
      ),
    };
  } catch {
    return emptyNotesData;
  }
}

export function replaceNotesSnapshot(data: NotesLocalData, scopeId?: string) {
  if (data.version !== 1 || !Array.isArray(data.notes) || !data.notes.every((note) => isRecord(note) && typeof note.id === "string" && typeof note.body === "string")) {
    throw new Error("Invalid Notes data.");
  }
  localStorage.setItem(createScopedStorageKey("notes", scopeId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(NOTES_UPDATE_EVENT, { detail: { scopeId, data } }));
}

function dataMatches(left: NotesLocalData, right: NotesLocalData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useNotesRepository() {
  const scope = useCosmicScope();
  const [data, setData] = useState<NotesLocalData>(emptyNotesData);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string>();

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setData(readNotesSnapshot(scope.id));
      setLoadedScope(scope.id);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(initial);
  }, [scope.id]);

  const sync = useCloudSnapshotSync({ domain: "notes", scope, ready: ready && loadedScope === scope.id, data, setData, equals: dataMatches });

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (loadedScope !== scope.id) return;
    replaceNotesSnapshot(data, scope.id);
  }, [data, ready, loadedScope, scope.id]);

  useEffect(() => {
    const sync = (incoming: Event) => {
      const detail = incoming instanceof CustomEvent ? incoming.detail as { scopeId?: string; data?: NotesLocalData } : undefined;
      const next = detail?.data ?? readNotesSnapshot(scope.id);
      if (detail?.scopeId && detail.scopeId !== scope.id) return;

      setData((current) => dataMatches(current, next) ? current : next);
    };

    window.addEventListener("storage", sync);
    window.addEventListener(NOTES_UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(NOTES_UPDATE_EVENT, sync);
    };
  }, [scope.id]);

  const save = useCallback((note: Note) => {
    setData((value) => ({
      version: 1,
      notes: value.notes.some((item) => item.id === note.id)
        ? value.notes.map((item) => item.id === note.id ? note : item)
        : [...value.notes, note],
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setData((value) => ({
      version: 1,
      notes: value.notes.filter((item) => item.id !== id),
    }));
  }, []);

  return { data, ready, sync, save, remove };
}
