"use client";

import type { ReactNode } from "react";

export function SchoolModal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0d111d]/95 p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}><header className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-white">{title}</h2><button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-white/10">Close</button></header><div className="mt-5">{children}</div></section></div>;
}

export function SchoolConfirm({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  return <SchoolModal title={title} onClose={onCancel}><p className="text-sm leading-6 text-white/65">{message}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70">Cancel</button><button type="button" onClick={onConfirm} className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-2 text-sm font-medium text-red-100">Confirm Delete</button></div></SchoolModal>;
}

export const fieldClass = "mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-sky-200/40 focus:ring-2 focus:ring-sky-200/10";
export const primaryClass = "rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-40";
