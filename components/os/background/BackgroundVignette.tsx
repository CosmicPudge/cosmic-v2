"use client";
interface BackgroundVignetteProps {
  progress?: number;
}

export default function BackgroundVignette({
  progress = 1,
}: BackgroundVignetteProps) {
  return (
    <>
      {/* Edge Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              rgba(0,0,0,0) 45%,
              rgba(0,0,0,0.12) 70%,
              rgba(0,0,0,0.38) 88%,
              rgba(0,0,0,0.72) 100%
            )
          `,
        }}
      />

      {/* Top Fade */}
      <div
        className="absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.28), transparent)",
        }}
      />

      {/* Bottom Fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-72"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,.45), transparent)",
        }}
      />
    </>
  );
}