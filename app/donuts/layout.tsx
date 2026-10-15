import type { Metadata } from "next";
import "./donuts.css";

export const metadata: Metadata = {
  title: { default: "Cosmic Donuts", template: "%s • Cosmic Donuts" },
  description: "Small-batch doorstep donuts from Henefer, Utah.",
};

export default function DonutsLayout({ children }: { children: React.ReactNode }) {
  return <div className="donuts-app">{children}</div>;
}
