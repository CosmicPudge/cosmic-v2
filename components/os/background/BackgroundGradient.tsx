"use client";

interface BackgroundGradientProps {
  progress?: number;
}

export default function BackgroundGradient({
  progress = 1,
}: BackgroundGradientProps) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-1000"
      style={{
        opacity: Math.min(progress * 2, 1),
        background: `
          radial-gradient(
            circle at 50% 15%,
            rgba(38, 52, 105, 0.55) 0%,
            rgba(16, 22, 48, 0.45) 25%,
            rgba(8, 10, 22, 0.85) 55%,
            rgba(2, 2, 6, 1) 100%
          )
        `,
      }}
    >
      {/* Deep Space */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(5, 7, 18, 0.15) 0%,
              rgba(2, 2, 6, 0.55) 100%
            )
          `,
        }}
      />

      {/* Top Glow */}
      <div
        className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full blur-[180px]"
        style={{
          background:
            "radial-gradient(circle, rgba(90,120,255,.16), transparent 70%)",
        }}
      />

      {/* Left Purple Glow */}
      <div
        className="absolute -left-60 top-1/3 h-[700px] w-[700px] rounded-full blur-[170px]"
        style={{
          background:
            "radial-gradient(circle, rgba(170,90,255,.12), transparent 70%)",
        }}
      />

      {/* Right Cyan Glow */}
      <div
        className="absolute -right-56 bottom-0 h-[750px] w-[750px] rounded-full blur-[180px]"
        style={{
          background:
            "radial-gradient(circle, rgba(80,200,255,.10), transparent 70%)",
        }}
      />
    </div>
  );
}