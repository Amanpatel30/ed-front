import type { NextConfig } from "next";

/**
 * The EduCore API has no CORS middleware, so the browser cannot call it
 * cross-origin with credentials. Requests are proxied through the Next.js
 * origin instead, which also lets the backend's httpOnly refresh cookie
 * (path=/api/auth) work unchanged.
 */
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
