"use client";
import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { useNotes } from "@/hooks/os/useNotes";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
const preview = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 90);
export default function NotesWidget() { const { size, presentation } = useWidgetContext(); const { notes, loading } = useNotes(); const kiosk = useDeveloperKioskData({ poll: presentation === "kiosk" }); const visible = notes.filter((note) => !note.archived); const recent = visible[0]; if (presentation === "kiosk") { const live = kiosk.data?.notes; return <KioskSceneFrame scene="notes" eyebrow="COSMOS • NOTES" title={kiosk.loading ? "Opening notes." : live?.recent?.title || (live?.connected ? "No notes yet." : "Notes unavailable.")} subtitle={live?.recent ? preview(live.recent.body) || "Empty note" : live?.connected ? `${live.total} notes` : "Waiting for synced notes"} />; } return <Widget accent="notes"><WidgetHeader title="Notes" subtitle="Pinned & recent"/><WidgetBody scrollable={size === "large"}>{loading ? <WidgetLoading compact label="Loading notes"/> : !visible.length ? <WidgetEmpty compact title="No notes yet" description="Capture your first note."/> : <div className="space-y-2">{visible.slice(0, size === "small" ? 1 : size === "medium" ? 3 : 5).map((note) => <div key={note.id} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="font-medium">{note.pinned ? "Pinned · " : ""}{note.title || "Untitled Note"}</p>{size !== "small" && <p className="mt-1 text-xs text-white/55">{preview(note.body) || "Empty note"}</p>}</div>)}</div>}</WidgetBody><WidgetFooter><Link href="/notes" className="text-xs text-cyan-100">Open Notes</Link></WidgetFooter></Widget>; }
