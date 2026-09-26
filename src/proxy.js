// src/proxy.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(function proxy(req) {
  const session = req.auth;
  const pathname = req.nextUrl.pathname;

  // مسیرهای عمومی
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/complete-registration",
    "/products",
    "/requests",
    "/profiles",
  ];

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // ====== محافظت از مسیرهای ادمین ======
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (!session.user.isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // بقیه منطق موجود
  if (isPublicPath) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.next();
  }

  if (
    session.user?.registrationComplete === false &&
    pathname !== "/complete-registration"
  ) {
    return NextResponse.redirect(new URL("/complete-registration", req.url));
  }

  return NextResponse.next();
});

// ✅ The config object remains the same
export const config = {
  matcher: [
    "/((?!api|uploads|_next/static|_next/image|favicon.ico|login|register|complete-registration).*)",
  ],
};