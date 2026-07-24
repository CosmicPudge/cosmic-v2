"use client";

interface BackgroundGlowProps {
  progress?: number;
}

export default function BackgroundGlow({
  progress = 1,
}: BackgroundGlowProps) {
  const opacity = Math.max(0, (progress - 0.45) / 0.55);

  return (
    <>
      <style jsx>{`
        @keyframes glowFloatOne {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(3%, -2%, 0) scale(1.08);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes glowFloatTwo {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-2%, 3%, 0) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes glowPulse {
          0%,
          100% {
            opacity: 0.9;
          }

          50% {
            opacity: 1;
          }
        }
      `}</style>

      <div
        className="absolute inset-0 transition-opacity duration-[3000ms]"
        style={{ opacity }}
      >
        {/* Main Galaxy Core */}
        <div
          className="absolute left-1/2 top-[22%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full blur-[220px]"
          style={{
            animation:
              "glowFloatOne 260s ease-in-out infinite, glowPulse 18s ease-in-out infinite",
            background:
              "radial-gradient(circle, rgba(90,130,255,.20), transparent 72%)",
          }}
        />

        {/* Purple Energy */}
        <div
          className="absolute -left-48 top-[12%] h-[850px] w-[850px] rounded-full blur-[220px]"
          style={{
            animation: "glowFloatTwo 320s ease-in-out infinite",
            background:
              "radial-gradient(circle, rgba(175,90,255,.18), transparent 72%)",
          }}
        />

        {/* Cyan Energy */}
        <div
          className="absolute -right-56 bottom-[6%] h-[820px] w-[820px] rounded-full blur-[220px]"
          style={{
            animation: "glowFloatOne 300s ease-in-out infinite",
            background:
              "radial-gradient(circle, rgba(70,230,255,.14), transparent 74%)",
          }}
        />

        {/* Small Accent */}
        <div
          className="absolute left-[35%] bottom-[12%] h-[420px] w-[420px] rounded-full blur-[170px]"
          style={{
            animation: "glowFloatTwo 180s ease-in-out infinite",
            background:
              "radial-gradient(circle, rgba(255,120,190,.12), transparent 75%)",
          }}
        />
      </div>
    </>
  );
}