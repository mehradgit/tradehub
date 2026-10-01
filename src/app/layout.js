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

export const metadata = {
  metadataBase: new URL("https://foodtradelink.com"),
  title: {
    default: "FoodTradeHub · B2B Food Marketplace",
    template: "%s | FoodTradeHub",
  },
  description: "The largest B2B organic products platform.",
  keywords: ["B2B food", "food marketplace", "wholesale food", "food suppliers"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://foodtradelink.com",
    siteName: "FoodTradeHub",
    title: "FoodTradeHub · B2B Food Marketplace",
    description: "The largest B2B organic products platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "FoodTradeHub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FoodTradeHub",
    description: "The largest B2B organic products platform.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  verification: {
    google: "YOUR_VERIFICATION_CODE", // بعداً از Search Console دریافت می‌کنید
  },
};
export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FoodTradeHub",
    url: "https://foodtradelink.com",
    logo: "https://foodtradelink.com/logo.png",
    description: "The largest B2B organic products platform.",
  };
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${dmSans.variable} ${manrope.variable}`}
    >
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    </html>
  );
}