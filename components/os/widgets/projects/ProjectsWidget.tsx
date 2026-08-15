"use client";
import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { useProjects } from "@/hooks/os/useProjects";
export default function ProjectsWidget() { const { size } = useWidgetContext(); const p = useProjects(); const active = p.data.projects.filter((x) => x.status === "active").sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high") || b.updatedAt.localeCompare(a.updatedAt)); return <Widget accent="projects"><WidgetHeader title="Projects" subtitle="Current work"/><WidgetBody scrollable={size === "large"}>{p.loading ? <WidgetLoading compact label="Loading projects"/> : !active.length ? <WidgetEmpty compact title="No active projects" description="Create a project to begin."/> : <div className="space-y-2">{active.slice(0, size === "small" ? 1 : size === "medium" ? 2 : 4).map((project) => { const tasks = p.data.tasks.filter((task) => task.projectId === project.id); const complete = tasks.filter((task) => task.completed).length; return <div key={project.id} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="font-medium">{project.title}</p><p className="text-xs text-white/55">{tasks.length ? `${complete}/${tasks.length} tasks` : "No tasks"}{project.dueDate ? ` · due ${project.dueDate}` : ""}</p></div>; })}</div>}</WidgetBody><WidgetFooter><Link href="/projects" className="text-xs text-cyan-100">Open Projects</Link></WidgetFooter></Widget>; }
