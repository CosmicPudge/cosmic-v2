"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Project,
  ProjectMilestone,
  ProjectsLocalData,
  ProjectTask,
} from "@/core/contracts/Projects";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy, useCosmicScope } from "@/services/storage/scope";
import { useCloudSnapshotSync } from "@/services/sync/useCloudSnapshotSync";

export const PROJECTS_STORAGE_KEY = "cosmic.projects.local-data";
export const PROJECTS_UPDATE_EVENT = "cosmic:projects-updated";
export const emptyProjectsData: ProjectsLocalData = {
  version: 1,
  projects: [],
  tasks: [],
  milestones: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntity<T extends { id: string }>(value: unknown): value is T {
  return isRecord(value) && typeof value.id === "string";
}

export function readProjectsSnapshot(scopeId?: string): ProjectsLocalData {
  try {
    const stored = readScopedOrLegacy("projects", scopeId); const raw = stored.raw;
    if (stored.migrated && raw) migrateLegacyStorage("projects", raw, scopeId);
    const value: unknown = raw ? JSON.parse(raw) : undefined;

    if (!isRecord(value) || value.version !== 1) {
      return emptyProjectsData;
    }

    return {
      version: 1,
      selectedProjectId: typeof value.selectedProjectId === "string"
        ? value.selectedProjectId
        : undefined,
      projects: Array.isArray(value.projects)
        ? value.projects.filter(isEntity<Project>)
        : [],
      tasks: Array.isArray(value.tasks)
        ? value.tasks.filter(isEntity<ProjectTask>)
        : [],
      milestones: Array.isArray(value.milestones)
        ? value.milestones.filter(isEntity<ProjectMilestone>)
        : [],
    };
  } catch {
    return emptyProjectsData;
  }
}

export function replaceProjectsSnapshot(data: ProjectsLocalData, scopeId?: string) {
  if (data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.tasks) || !Array.isArray(data.milestones) || ![...data.projects, ...data.tasks, ...data.milestones].every((item) => isRecord(item) && typeof item.id === "string")) {
    throw new Error("Invalid Projects data.");
  }
  localStorage.setItem(createScopedStorageKey("projects", scopeId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATE_EVENT, { detail: { scopeId, data } }));
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((entry) => entry.id === item.id)
    ? list.map((entry) => entry.id === item.id ? item : entry)
    : [...list, item];
}

function dataMatches(left: ProjectsLocalData, right: ProjectsLocalData) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useProjectsRepository() {
  const scope = useCosmicScope();
  const [data, setData] = useState<ProjectsLocalData>(emptyProjectsData);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string>();

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setData(readProjectsSnapshot(scope.id));
      setLoadedScope(scope.id);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(initial);
  }, [scope.id]);

  const sync = useCloudSnapshotSync({ domain: "projects", scope, ready: ready && loadedScope === scope.id, data, setData, equals: dataMatches });

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (loadedScope !== scope.id) return;
    replaceProjectsSnapshot(data, scope.id);
  }, [data, ready, loadedScope, scope.id]);

  useEffect(() => {
    const sync = (incoming: Event) => {
      const detail = incoming instanceof CustomEvent ? incoming.detail as { scopeId?: string; data?: ProjectsLocalData } : undefined;
      const next = detail?.data ?? readProjectsSnapshot(scope.id);
      if (detail?.scopeId && detail.scopeId !== scope.id) return;

      setData((current) => dataMatches(current, next) ? current : next);
    };

    window.addEventListener("storage", sync);
    window.addEventListener(PROJECTS_UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROJECTS_UPDATE_EVENT, sync);
    };
  }, [scope.id]);

  const update = useCallback(
    (operation: (value: ProjectsLocalData) => ProjectsLocalData) => setData(operation),
    [],
  );
  const selectedProject = useMemo(
    () => data.projects.find((item) => item.id === data.selectedProjectId) ?? data.projects[0],
    [data],
  );

  return {
    data,
    ready,
    sync,
    selectedProject,
    selectProject: (id: string) => update((value) => ({ ...value, selectedProjectId: id })),
    saveProject: (item: Project) => update((value) => ({
      ...value,
      selectedProjectId: value.selectedProjectId ?? item.id,
      projects: upsert(value.projects, item),
    })),
    removeProject: (id: string) => update((value) => ({
      ...value,
      projects: value.projects.filter((item) => item.id !== id),
      tasks: value.tasks.filter((item) => item.projectId !== id),
      milestones: value.milestones.filter((item) => item.projectId !== id),
    })),
    saveTask: (item: ProjectTask) => update((value) => ({
      ...value,
      tasks: upsert(value.tasks, item),
    })),
    removeTask: (id: string) => update((value) => ({
      ...value,
      tasks: value.tasks.filter((item) => item.id !== id),
    })),
    saveMilestone: (item: ProjectMilestone) => update((value) => ({
      ...value,
      milestones: upsert(value.milestones, item),
    })),
    removeMilestone: (id: string) => update((value) => ({
      ...value,
      milestones: value.milestones.filter((item) => item.id !== id),
    })),
  };
}
