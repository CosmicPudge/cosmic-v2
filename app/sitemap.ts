import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap { const base = "https://cosmicpudge.shop"; return ["/", "/privacy", "/terms", "/support"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : .5 })); }
