import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/", "/ads.txt", "/privacy", "/terms", "/support"], disallow: ["/api/", "/os", "/admin", "/dev", "/account", "/finance", "/sports", "/calendar", "/school", "/projects", "/notes", "/music", "/gmail", "/outlook", "/garage", "/clock", "/settings", "/search", "/weather", "/system", "/cosmic-plus"] }, sitemap: "https://cosmicpudge.shop/sitemap.xml", host: "https://cosmicpudge.shop" }; }
