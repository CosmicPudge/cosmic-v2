import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cosmos",
    short_name: "Cosmos",
    description: "Your personal workspace for school, life, projects, media, devices, and Cosmic AI.",
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
