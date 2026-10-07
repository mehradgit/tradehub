// src/components/layout/Layout.js
import Header from "./Header";
import Footer from "./Footer";
import { Suspense } from "react";

export default function Layout({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main>{children}</main>
      <Footer />
    </>
  );
}