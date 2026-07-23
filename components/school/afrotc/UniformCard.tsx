"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Shirt,
  XCircle,
} from "lucide-react";

import { AFROTCState } from "./afrotcTypes";

interface UniformCardProps {
  state: AFROTCState;
}

export default function UniformCard({
  state,
}: UniformCardProps) {
  const packedCount = state.uniform.items.filter(
    (item) => item.packed
  ).length;

  const totalItems = state.uniform.items.length;

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-6
      "
    >
      <div className="flex items-center gap-3">
        <Shirt
          size={22}
          className="text-sky-300"
        />

        <div>
          <h2 className="text-xl font-semibold text-white">
            Today's Uniform
          </h2>

          <p className="text-sm text-white/55">
            Ensure everything is prepared before departure.
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-sky-500/20
          bg-sky-500/10
          p-5
        "
      >
        <div className="text-xs uppercase tracking-[0.18em] text-sky-300">
          Uniform
        </div>

        <div className="mt-2 text-3xl font-bold text-white">
          {state.uniform.type}
        </div>

        {state.uniform.notes && (
          <p className="mt-3 text-white/65 leading-relaxed">
            {state.uniform.notes}
          </p>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white/50">
            Required Items
          </h3>

          <span className="text-sm text-white/60">
            {packedCount}/{totalItems} Ready
          </span>
        </div>

        <div className="space-y-3">
          {state.uniform.items.map((item) => (
            <UniformItemRow
              key={item.id}
              name={item.name}
              packed={item.packed}
              required={item.required}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

interface UniformItemRowProps {
  name: string;
  packed: boolean;
  required: boolean;
}

function UniformItemRow({
  name,
  packed,
  required,
}: UniformItemRowProps) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-xl
        border
        border-white/10
        bg-white/[0.03]
        px-4
        py-3
      "
    >
      <div>
        <div className="font-medium text-white">
          {name}
        </div>

        <div className="text-xs text-white/45">
          {required ? "Required" : "Optional"}
        </div>
      </div>

      {packed ? (
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">
            Ready
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-300">
          <XCircle size={18} />
          <span className="text-sm font-medium">
            Missing
          </span>
        </div>
      )}
    </div>
  );
}