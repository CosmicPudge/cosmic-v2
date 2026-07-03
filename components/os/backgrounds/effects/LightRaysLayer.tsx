"use client";

interface LightRaysLayerProps {
  opacity?: number;
}

export default function LightRaysLayer({
  opacity = 0.18,
}: LightRaysLayerProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Left Ray */}
      <div
        className="absolute -top-40 left-[8%] h-[140vh] w-40 rotate-[18deg] rounded-full blur-3xl"
        style={{
          opacity,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,.75), rgba(255,255,255,0))",
        }}
      />

      {/* Center Ray */}
      <div
        className="absolute -top-56 left-[42%] h-[150vh] w-52 rotate-[8deg] rounded-full blur-3xl"
        style={{
          opacity: opacity * 0.75,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,.65), rgba(255,255,255,0))",
        }}
      />

      {/* Right Ray */}
      <div
        className="absolute -top-48 right-[10%] h-[145vh] w-44 -rotate-[14deg] rounded-full blur-3xl"
        style={{
          opacity: opacity * 0.9,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,.7), rgba(255,255,255,0))",
        }}
      />

    </div>
  );
}