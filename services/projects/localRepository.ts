"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Project,
  ProjectMilestone,
  ProjectsLocalData,
  ProjectTask,
} from "@/core/contracts/Projects";

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

export function readProjectsSnapshot(): ProjectsLocalData {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
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

export function replaceProjectsSnapshot(data: ProjectsLocalData) {
  if (data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.tasks) || !Array.isArray(data.milestones) || ![...data.projects, ...data.tasks, ...data.milestones].every((item) => isRecord(item) && typeof item.id === "string")) {
    throw new Error("Invalid Projects data.");
  }
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATE_EVENT, { detail: data }));
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
  const [data, setData] = useState<ProjectsLocalData>(emptyProjectsData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      setData(readProjectsSnapshot());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(initial);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(PROJECTS_UPDATE_EVENT, { detail: data }));
  }, [data, ready]);

  useEffect(() => {
    const sync = (incoming: Event) => {
      const next = incoming instanceof CustomEvent && incoming.detail
        ? incoming.detail as ProjectsLocalData
        : readProjectsSnapshot();

      setData((current) => dataMatches(current, next) ? current : next);
    };

    window.addEventListener("storage", sync);
    window.addEventListener(PROJECTS_UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PROJECTS_UPDATE_EVENT, sync);
    };
  }, []);

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
