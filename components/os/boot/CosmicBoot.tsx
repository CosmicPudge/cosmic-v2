"use client";

import { useEffect, useState } from "react";

import BootBackground from "./BootBackground";
import BootLogo from "./BootLogo";
import BootMessage from "./BootMessage";
import BootProgress from "./BootProgress";

interface Props {
  children: React.ReactNode;
  subtitle?: string;
  messages?: string[];
}

const defaultMessages = [
  "Initializing Core...",
  "Loading Environment...",
  "Preparing Workspace...",
  "Welcome.",
];

export default function CosmicBoot({
  children,
  subtitle,
  messages,
}: Props) {
  const bootMessages = messages ?? defaultMessages;
const [step, setStep] = useState(0);
const [bootComplete, setBootComplete] = useState(false);


useEffect(() => {
  const timers = [
    setTimeout(() => setStep(1), 1200),
    setTimeout(() => setStep(2), 2600),
    setTimeout(() => setStep(3), 4300),
    setTimeout(() => setBootComplete(true), 5000),
  ];

  return () => timers.forEach(clearTimeout);
}, []);

  return (
    <>
      {/* Desktop is always mounted */}
      {children}

      {/* Boot Screen */}
      <div
        className={`
          fixed inset-0 z-[9999]
          transition-opacity duration-1000 ease-in-out
          ${
            bootComplete
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }
        `}
      >
        <BootBackground>
          <div className="flex flex-col items-center">

            <BootLogo subtitle={subtitle} />

            <BootMessage
  message={bootMessages[step]}
/>

             <BootProgress start />

          </div>
        </BootBackground>
      </div>
    </>
  );
}