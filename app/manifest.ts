import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cosmic OS",
    short_name: "Cosmic",
    description: "A local-first celestial dashboard and personal workspace.",
    start_url: "/os",
    scope: "/",
    display: "standalone",
    background_color: "#030511",
    theme_color: "#030511",
    orientation: "any",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
