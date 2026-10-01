// src/app/robots.js
export default function robots() {
  const baseUrl = "https://foodtradelink.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
        //   "/_next/",
          "/admin/",
          "/dashboard/",
          "/login",
          "/register",
          "/checkout",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}