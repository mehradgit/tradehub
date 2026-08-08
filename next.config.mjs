// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["prisma", "@prisma/client"],
  // ✅ افزایش محدودیت حجم برای API Routes
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
  // ✅ برای Server Actions (در صورت استفاده)
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;