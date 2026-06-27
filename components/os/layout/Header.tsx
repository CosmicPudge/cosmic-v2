"use client";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-white/5 px-6 backdrop-blur-xl">
      <h1 className="text-2xl font-bold">Cosmic OS</h1>

      <div className="text-sm opacity-70">
        Saturday • 10:00 AM
      </div>
    </header>
  );
}