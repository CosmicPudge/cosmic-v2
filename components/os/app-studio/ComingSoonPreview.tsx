"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { ComingSoonAppDefinition } from "@/apps/core";

export default function ComingSoonPreview({ app }: { app: ComingSoonAppDefinition }) {
  return <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="grid min-h-[340px] place-items-center rounded-[28px] border border-white/15 bg-[radial-gradient(circle_at_top,rgba(125,211,252,.16),transparent_42%),rgba(8,13,28,.64)] p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.45)]">
    <div className="max-w-sm"><div className="mx-auto grid size-20 place-items-center rounded-[26px] border border-white/15 bg-white/[0.08] text-4xl shadow-[0_0_50px_rgba(125,211,252,.18)]">{app.icon ?? "✦"}</div><span className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100"><Sparkles size={13} />Coming soon</span><h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{app.title}</h2><p className="mt-2 text-sm leading-6 text-white/60">{app.description}</p>{app.plannedFeatures && <div className="mt-6 flex flex-wrap justify-center gap-2">{app.plannedFeatures.map((feature) => <span key={feature} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/65">{feature}</span>)}</div>}</div>
  </motion.div>;
}
