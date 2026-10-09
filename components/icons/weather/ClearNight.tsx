"use client";



interface Props {
  size?: number;

  starDensity?: "sparse" | "normal" | "dense";
}

export default function ClearNight({
  size = 48,
  starDensity = "normal",
}: Props) {
  void starDensity;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M31.5 7.5c-8.8 1.8-15.4 9.6-15.4 18.9 0 6.2 2.9 11.8 7.5 15.3C13.8 40.9 6 32.7 6 22.7 6 12.1 14.6 3.5 25.2 3.5c2.2 0 4.3.4 6.3 1.1-1.2.8-1.2 2-.0 2.9Z"
        fill="currentColor"
      />
    </svg>
  );
}
