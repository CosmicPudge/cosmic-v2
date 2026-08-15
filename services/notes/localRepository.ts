"use client";

import { useCallback, useEffect, useState } from "react";

import type { Note, NotesLocalData } from "@/core/contracts/Notes";

export const NOTES_STORAGE_KEY = "cosmic.notes.local-data";
export const NOTES_UPDATE_EVENT = "cosmic:notes-updated";
export const emptyNotesData: NotesLocalData = { version: 1, notes: [] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readNotesSnapshot(): NotesLocalData {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
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

export function replaceNotesSnapshot(data: NotesLocalData) {
  if (data.version !== 1 || !Array.isArray(data.notes) || !data.notes.every((note) => isRecord(note) && typeof note.id === "string" && typeof note.body === "string")) {
    throw new Error("Invalid Notes data.");
  }
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(NOTES_UPDATE_EVENT, { detail: data }));
}

function dataMatches(left: NotesLocalData, right: NotesLocalData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useNotesRepository() {
  const [data, setData] = useState<NotesLocalData>(emptyNotesData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setData(readNotesSnapshot());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(initial);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(NOTES_UPDATE_EVENT, { detail: data }));
  }, [data, ready]);

  useEffect(() => {
    const sync = (incoming: Event) => {
      const next = incoming instanceof CustomEvent && incoming.detail
        ? incoming.detail as NotesLocalData
        : readNotesSnapshot();

      setData((current) => dataMatches(current, next) ? current : next);
    };

    window.addEventListener("storage", sync);
    window.addEventListener(NOTES_UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(NOTES_UPDATE_EVENT, sync);
    };
  }, []);

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

  return { data, ready, save, remove };
}
