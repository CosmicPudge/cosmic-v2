import GarageSimulator from "@/components/dev/GarageSimulator";

export default function GarageDevPage() {
  if (process.env.NODE_ENV === "production") return <main className="p-8 text-white">Development Garage tools are unavailable in production.</main>;
  return <main className="min-h-screen bg-slate-950 p-6"><GarageSimulator /></main>;
}
