import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "site.api.espn.com" },
    ],
  },
  serverExternalPackages: ["pdfjs-dist"],
  allowedDevOrigins: [
    "192.168.1.71",
    "127.0.0.1",
  ],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/dev/phone-glasses",
          destination: "/dev/phone-glasses/index.html",
        },
        {
          source: "/dev/phone-glasses/",
          destination: "/dev/phone-glasses/index.html",
        },
      ],
    };
  },
  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    if (process.env.NODE_ENV === "production") headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
    return [
      { source: "/sw.js", headers: [{ key: "Content-Type", value: "application/javascript; charset=utf-8" }, { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" }] },
      { source: "/(.*)", headers },
      {
        source: "/dev/phone-glasses/:path*",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
        ],
      },
      {
        source: "/dev/phone-glasses",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/dev/phone-glasses/",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/dev/phone-glasses/index.html",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/dev/phone-glasses/assets/:path*",
        headers: [
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
