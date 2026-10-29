import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

if (!backendUrl) {
  throw new Error("Thiếu BACKEND_URL trong cấu hình môi trường.");
}

const nextConfig: NextConfig = {
  output: "standalone",
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

  async redirects() {
    return [
      {
        source: "/dang-nhap",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/dang-ky",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/quen-mat-khau",
        destination: "/forgot-password",
        permanent: true,
      },
      {
        source: "/hoc/tu-vung",
        destination: "/learn/vocabulary",
        permanent: true,
      },
      {
        source: "/hoc/ngu-phap",
        destination: "/learn/grammar",
        permanent: true,
      },
      {
        source: "/hoc/on-tap",
        destination: "/learn/review",
        permanent: true,
      },
      {
        source: "/hoc/ket-qua",
        destination: "/learn/results",
        permanent: true,
      },
      {
        source: "/hoc",
        destination: "/learn",
        permanent: true,
      },
      {
        source: "/hoc/:path*",
        destination: "/learn/:path*",
        permanent: true,
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
