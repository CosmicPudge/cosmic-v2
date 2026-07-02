import GradientLayer from "../effects/GradientLayer";
import ParticlesLayer from "../effects/ParticlesLayer";

export default function DashboardScene() {
  return (
    <>
      <GradientLayer variant="space" />

      <ParticlesLayer
        count={80}
        size={3}
        opacity={0.25}
      />
    </>
  );
}