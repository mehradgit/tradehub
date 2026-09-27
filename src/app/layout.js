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
    { path: "../../public/fonts/Poppins-Regular.ttf",     weight: "400", style: "normal" },
    { path: "../../public/fonts/Poppins-Medium.ttf",      weight: "500", style: "normal" },
    { path: "../../public/fonts/Poppins-SemiBold.ttf",    weight: "600", style: "normal" },
    { path: "../../public/fonts/Poppins-Bold.ttf",        weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "FoodHub · B2B Food Marketplace",
  description: "The largest B2B organic products platform.",
};

export default function RootLayout({ children }) {
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
      </body>
    </html>
  );
}