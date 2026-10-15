// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["prisma", "@prisma/client"],

  // ============================================================
  // Image optimizer limits
  // Next.js defaults include 2048/3840 device sizes, so a
  // "fill" banner with sizes ~1380px was served at 3840px
  // (~335KB) on retina displays. Cap the largest width at 1920.
  // ============================================================
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

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
    const isProd = process.env.NODE_ENV === "production";

    return [
      // HSTS — only in production (browsers ignore it over plain HTTP,
      // and sending it in dev would lock localhost into HTTPS).
      ...(isProd
        ? [
            {
              source: "/:path*",
              headers: [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ],
            },
          ]
        : []),
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