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

// ===== فونت‌ها =====
const inter = localFont({
  src: "../../public/fonts/Inter-VariableFont_opsz,wght.ttf",
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
// Metadata — SEO سراسری
// ============================================================
export const metadata = {
  metadataBase: new URL("https://foodtradelink.com"),

  // ✅ عنوان و توضیحات پیش‌فرض
  title: {
    default: "FoodTradeHub · Global B2B Food Marketplace",
    template: "%s | FoodTradeHub",
  },
  description:
    "The largest global B2B food marketplace. Connect with verified suppliers, manufacturers, and buyers across 120+ countries. Trade food products without borders.",

  // ✅ اطلاعات عمومی
  applicationName: "FoodTradeHub",
  authors: [{ name: "FoodTradeHub", url: "https://foodtradelink.com" }],
  creator: "FoodTradeHub",
  publisher: "FoodTradeHub",

  // ✅ کلمات کلیدی
  keywords: [
    "B2B food marketplace",
    "wholesale food",
    "food suppliers",
    "food exporters",
    "global food trade",
    "bulk food trading",
    "organic products",
    "international food sourcing",
    "food distribution",
    "verified suppliers",
  ],

  // ✅ OpenGraph (فیسبوک، لینکدین، واتساپ، تلگرام)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://foodtradelink.com",
    siteName: "FoodTradeHub",
    title: "FoodTradeHub · Global B2B Food Marketplace",
    description:
      "Connect with verified suppliers and buyers across 120+ countries. Trade food products without borders.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FoodTradeHub — Global B2B Food Marketplace",
      },
    ],
  },

  // ✅ Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "FoodTradeHub · Global B2B Food Marketplace",
    description:
      "Connect with verified suppliers and buyers across 120+ countries.",
    images: ["/og-image.png"],
    creator: "@foodtradelink",
  },

  // ✅ Canonical
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },

  // ✅ Robots
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

  // ✅ Format detection (جلوگیری از تبدیل خودکار شماره تلفن به لینک در iOS)
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // ✅ Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // ✅ Manifest (PWA)
  manifest: "/manifest.json",

  // ✅ Verification — کد واقعی از Search Console
  // اگه فعلاً نداری، این بخش رو کامنت کن
  // verification: {
  //   google: "your-real-verification-code-from-search-console",
  // },

  // ✅ سایر
  category: "Business",
};

// ============================================================
// RootLayout
// ============================================================
export default function RootLayout({ children }) {
  // ===== JSON-LD: Organization =====
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FoodTradeHub",
    alternateName: "FoodTradeHub B2B Marketplace",
    url: "https://foodtradelink.com",
    logo: {
      "@type": "ImageObject",
      url: "https://foodtradelink.com/og-image.png",
      width: 512,
      height: 512,
    },
    description:
      "Global B2B marketplace connecting verified food suppliers, manufacturers, and buyers across 120+ countries.",
    foundingDate: "2024",
    sameAs: [
      // اگه سوشال مدیا داری، اینجا اضافه کن
      // "https://www.linkedin.com/company/foodtradelink",
      // "https://twitter.com/foodtradelink",
    ],
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

  // ===== JSON-LD: WebSite (برای Search Box در گوگل) =====
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FoodTradeHub",
    url: "https://foodtradelink.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://foodtradelink.com/search?q={search_term_string}",
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
        {/* ✅ Preconnect برای Google Analytics */}
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
          {children}
        </Providers>

        <BootstrapClient />

        {/* ✅ Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        {/* ✅ Structured Data — WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </body>

      {/* ✅ Google Analytics */}
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}