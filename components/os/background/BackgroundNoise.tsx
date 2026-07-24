"use client";

interface BackgroundNoiseProps {
  progress?: number;
}

export default function BackgroundNoise({
  progress = 1,
}: BackgroundNoiseProps) {
  return (
    <>
      <style jsx>{`
        @keyframes cosmicNoise {
          0% {
            transform: translate3d(0, 0, 0);
          }

          20% {
            transform: translate3d(-1%, 1%, 0);
          }

          40% {
            transform: translate3d(1%, -1%, 0);
          }

          60% {
            transform: translate3d(-0.5%, 0.5%, 0);
          }

          80% {
            transform: translate3d(0.5%, -0.5%, 0);
          }

          100% {
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>

      <div
        className="absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Fine film grain */}
        <div
          className="absolute -inset-[25%]"
          style={{
            opacity: 0.035,
            animation: "cosmicNoise 0.35s steps(2) infinite",
            backgroundImage: `
              radial-gradient(circle, rgba(255,255,255,.18) .5px, transparent .6px)
            `,
            backgroundSize: "4px 4px",
            mixBlendMode: "soft-light",
          }}
        />

        {/* Large soft texture */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.05,
            background: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.03), transparent 35%),
              radial-gradient(circle at 75% 60%, rgba(255,255,255,.025), transparent 40%),
              radial-gradient(circle at 50% 80%, rgba(255,255,255,.02), transparent 45%)
            `,
            mixBlendMode: "screen",
          }}
        />
      </div>
    </>
  );
}