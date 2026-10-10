// src/app/layout.js
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { Providers } from "./providers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import localFont from "next/font/local";
import BootstrapClient from "@/components/ui/BootstrapClient";
import { GoogleAnalytics } from "@next/third-parties/google";
import StyledJsxRegistry from "./styled-jsx-registry";

// ===== Fonts =====
const inter = localFont({
  src: "../../public/fonts/Inter-VariableFont_opsz,wght.woff2",
  variable: "--font-inter",
  display: "swap",
});

const dmSans = localFont({
  src: "../../public/fonts/DMSans-VariableFont_opsz,wght.ttf",
  variable: "--font-dm-sans",
  display: "swap",
});

const manrope = localFont({
  src: "../../public/fonts/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  display: "swap",
});

const poppins = localFont({
  src: [
    { path: "../../public/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

// ============================================================
// Metadata
// ============================================================
export const metadata = {
  metadataBase: new URL("https://foodtradelink.com"),

  title: {
    default: "FoodTradeLink · Global B2B Food Marketplace",
    template: "%s | FoodTradeLink",
  },
  description:
    "FoodTradeLink is the largest global B2B food marketplace. Connect with verified suppliers, manufacturers, and buyers across 120+ countries. Trade food products without borders.",

  applicationName: "FoodTradeLink",
  authors: [{ name: "FoodTradeLink", url: "https://foodtradelink.com" }],
  creator: "FoodTradeLink",
  publisher: "FoodTradeLink",

  keywords: [
    "B2B food marketplace",
    "FoodTradeLink",
    "wholesale food",
    "food suppliers",
    "food exporters",
    "global food trade",
    "bulk food trading",
    "organic products",
    "international food sourcing",
    "verified suppliers",
    "food distribution",
  ],

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://foodtradelink.com",
    siteName: "FoodTradeLink",
    title: "FoodTradeLink · Global B2B Food Marketplace",
    description:
      "Connect with verified suppliers and buyers across 120+ countries. Trade food products without borders.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FoodTradeLink — Global B2B Food Marketplace",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "FoodTradeLink · Global B2B Food Marketplace",
    description:
      "Connect with verified suppliers and buyers across 120+ countries.",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // ⚠️ Remove this section, because Next.js uses the
  // favicon.ico, icon.png and apple-icon.png files automatically
  // icons: { ... },

  manifest: "/manifest.json",

  // verification: {
  //   google: "your-real-code",
  // },

  category: "Business",
};

// ============================================================
// RootLayout
// ============================================================
export default function RootLayout({ children }) {
  // JSON-LD Organization
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FoodTradeLink",
    alternateName: "FoodTradeLink B2B Marketplace",
    url: "https://foodtradelink.com",
    logo: {
      "@type": "ImageObject",
      url: "https://foodtradelink.com/web-app-manifest-512x512.png",
      width: 512,
      height: 512,
    },
    description:
      "Global B2B marketplace connecting verified food suppliers, manufacturers, and buyers across 120+ countries.",
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@foodtradelink.com",
      url: "https://foodtradelink.com/contact",
      availableLanguage: ["English"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "OM",
      addressLocality: "Muscat",
    },
  };

  // JSON-LD WebSite
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FoodTradeLink",
    url: "https://foodtradelink.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        // The /search page was removed; the header mega search goes to the
        // filtered products page, so the sitelinks searchbox target is the same.
        urlTemplate: "https://foodtradelink.com/products?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${dmSans.variable} ${manrope.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>

      <body>
        <Providers>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          <StyledJsxRegistry>{children}</StyledJsxRegistry>
        </Providers>

        <BootstrapClient />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </body>

      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}