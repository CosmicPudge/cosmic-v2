"use client";

interface BaseDiamondProps {
  first?: boolean;
second?: boolean;
third?: boolean;
}

export default function BaseDiamond({
  first,
  second,
  third,
}: BaseDiamondProps) {
  const filled = "text-green-400";
  const empty = "text-white/20";

  return (
    <div className="flex justify-center gap-4 text-2xl">
      <span className={third ? filled : empty}>●</span>
      <span className={second ? filled : empty}>●</span>
      <span className={first ? filled : empty}>●</span>
    </div>
  );
}