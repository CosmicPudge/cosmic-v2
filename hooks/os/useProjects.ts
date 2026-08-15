"use client";
import { useMemo } from "react";
import { useProjectsRepository } from "@/services/projects/localRepository";
export const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export function useProjects() { const repo = useProjectsRepository(); const summary = useMemo(() => { const project = repo.selectedProject; const tasks = project ? repo.data.tasks.filter((item) => item.projectId === project.id).sort((a, b) => a.order - b.order) : []; return { tasks, milestones: project ? repo.data.milestones.filter((item) => item.projectId === project.id) : [], progress: tasks.length ? Math.round(tasks.filter((item) => item.completed).length / tasks.length * 100) : 0 }; }, [repo.data, repo.selectedProject]); return { ...repo, summary, loading: !repo.ready }; }
