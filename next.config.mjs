// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["prisma", "@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // ============================================================
  // از bundling پوشه‌ی uploads جلوگیری کن
  // این پوشه محتوای runtime است، نه بخشی از build
  // ============================================================
  outputFileTracingExcludes: {
    "*": [
      "public/uploads/**",
      "public/uploads",
      ".next/cache/**",
    ],
  },

  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default nextConfig;