"use client";
import { useMemo } from "react";
import { useNotesRepository } from "@/services/notes/localRepository";
export function useNotes() { const repo = useNotesRepository(); const notes = useMemo(() => [...repo.data.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)), [repo.data.notes]); return { ...repo, notes, loading: !repo.ready }; }
