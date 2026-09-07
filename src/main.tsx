const phoneGlassesPath = "/dev/phone-glasses";
const isPhoneGlassesRoute =
  window.location.pathname === phoneGlassesPath ||
  window.location.pathname.startsWith(`${phoneGlassesPath}/`);

if (isPhoneGlassesRoute) {
  const [{ createRoot }, { PhoneGlasses }] = await Promise.all([
    import("react-dom/client"),
    import("./phone/PhoneGlasses"),
  ]);

  createRoot(document.getElementById("root")!).render(
    <PhoneGlasses />,
  );
} else {
  const { CosmicHudService } = await import(
    "./glasses/hud/hudService"
  );

  const hud =
    await CosmicHudService.create();

  console.log(
    "COSMIC Glasses ready",
    hud,
  );
}
