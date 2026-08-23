import TransitionDiagnostics from "@/components/os/transition/TransitionDiagnostics";

export default function TransitionsPage() {
  if (process.env.NODE_ENV === "production") return null;
  return <TransitionDiagnostics />;
}
