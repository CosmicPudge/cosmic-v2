"use client";
import { use } from "react";
import NoteEditor from "@/components/school/NoteEditor";
export default function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) { return <NoteEditor noteId={use(params).noteId} />; }
