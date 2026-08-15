export type ProjectStatus = "planning" | "active" | "paused" | "completed" | "archived";
export type ProjectPriority = "low" | "normal" | "high";
export interface Project { id: string; title: string; description?: string; status: ProjectStatus; priority: ProjectPriority; dueDate?: string; tags: string[]; createdAt: string; updatedAt: string; archivedAt?: string; }
export interface ProjectTask { id: string; projectId: string; title: string; description?: string; completed: boolean; priority: ProjectPriority; dueDate?: string; order: number; createdAt: string; updatedAt: string; }
export interface ProjectMilestone { id: string; projectId: string; title: string; description?: string; dueDate?: string; completed: boolean; createdAt: string; updatedAt: string; }
export interface ProjectsLocalData { version: 1; selectedProjectId?: string; projects: Project[]; tasks: ProjectTask[]; milestones: ProjectMilestone[]; }
