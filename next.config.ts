import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");
const pagesBuild = process.env.DEPLOY_TARGET === "cloudflare-pages";

if (!pagesBuild && !backendUrl) {
  throw new Error("Thiếu BACKEND_URL trong cấu hình môi trường.");
}

const nextConfig: NextConfig = {
  output: pagesBuild ? "export" : "standalone",
  ...(!pagesBuild && {
    cacheComponents: true,
    partialPrefetching: true,

    async headers() {
      return [{ source: "/:path*", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      ] }];
    },

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
  }),

  turbopack: {
    rules: {
      "*.css": {
        // CSS Modules need Next's module compiler to retain their scoped class exports.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
