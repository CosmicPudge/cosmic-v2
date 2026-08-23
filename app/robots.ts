import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/", "/ads.txt", "/privacy", "/terms", "/support"], disallow: ["/api/", "/admin", "/dev", "/account", "/finance", "/mail", "/gmail", "/garage/vehicle", "/settings"] }, sitemap: "https://cosmicpudge.shop/sitemap.xml", host: "https://cosmicpudge.shop" }; }
