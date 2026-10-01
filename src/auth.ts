// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateNumber, generateSlug } from "@/utils/generate";

const prismaAdapter = PrismaAdapter(prisma);

const customAdapter = {
  ...prismaAdapter,
  createUser: async (data) => {
    let profileNumber;
    let isUnique = false;
    while (!isUnique) {
      profileNumber = generateNumber();
      const existing = await prisma.user.findUnique({
        where: { profileNumber },
      });
      if (!existing) isUnique = true;
    }

    const slug = generateSlug(data.name || data.email || "user");

    return prisma.user.create({
      data: {
        ...data,
        profileNumber,
        slug,
        registrationComplete: false,
      },
    });
  },
};

const isProd = process.env.NODE_ENV === "production";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: customAdapter,
  session: { strategy: "jwt" },

  // ✅ حیاتی: اجازه دادن به Auth.js برای اعتماد به هدرهای X-Forwarded-*
  // بدون این، پشت Nginx دامنه اشتباه تشخیص داده می‌شه و CSRF fail می‌ده
  trustHost: true,

  // ✅ کوکی‌های امن در پروداکشن
  useSecureCookies: isProd,

  // ✅ تنظیمات صریح کوکی‌ها برای جلوگیری از MissingCSRF
  cookies: isProd
    ? {
        sessionToken: {
          name: "__Secure-authjs.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            // ✅ domain حذف شد — host-only cookie
          },
        },
        callbackUrl: {
          name: "__Secure-authjs.callback-url",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
          },
        },
        csrfToken: {
          name: "__Host-authjs.csrf-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
          },
        },
      }
    : undefined,

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // ✅ اجبار به انتخاب حساب (جلوگیری از prompt=none که باعث گیر کردن می‌شه)
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // ====== ورود با ایمیل و رمز عبور ======
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            emailVerified: true,
            registrationComplete: true,
            isAdmin: true,
            logo: true,
            image: true,
            companyName: true,
          },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        if (!user.emailVerified) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          logo: user.logo,
          image: user.image,
          companyName: user.companyName,
          registrationComplete: user.registrationComplete,
          emailVerified: true,
          isAdmin: user.isAdmin,
        };
      },
    }),

    // ====== auto-login بعد از verify-email ======
    Credentials({
      id: "verify-token",
      name: "Verify Token",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.token) return null;

        const email = credentials.email.toLowerCase().trim();

        const record = await prisma.verificationToken.findFirst({
          where: {
            identifier: email,
            token: credentials.token,
            expires: { gt: new Date() },
          },
        });

        if (!record) return null;

        await prisma.verificationToken.deleteMany({
          where: { identifier: email, token: credentials.token },
        });

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            registrationComplete: true,
            isAdmin: true,
            logo: true,
            image: true,
            companyName: true,
          },
        });

        if (!user || !user.emailVerified) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          logo: user.logo,
          image: user.image,
          companyName: user.companyName,
          registrationComplete: user.registrationComplete,
          emailVerified: true,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // ===== ۱. کاربر تازه لاگین کرده =====
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.logo = user.logo ?? null;
        token.image = user.image ?? null;
        token.companyName = user.companyName ?? null;
        token.registrationComplete = user.registrationComplete ?? false;
        token.emailVerified = user.emailVerified ?? false;
        token.isAdmin = user.isAdmin ?? false;
      }

      // ===== ۲. از سمت کلاینت update() صدا زده شده =====
      if (trigger === "update" && session) {
        if (session.registrationComplete !== undefined)
          token.registrationComplete = session.registrationComplete;
        if (session.logo !== undefined) token.logo = session.logo;
        if (session.image !== undefined) token.image = session.image;
        if (session.companyName !== undefined)
          token.companyName = session.companyName;
      }

      // ===== ۳. تازه‌سازی از DB فقط اگر لازم باشه =====
      // نکته: برای جلوگیری از کندی در هر request، فقط اگر توکن تازه نیست
      // یا اطلاعات اصلی نداره، از DB بخون
      if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            isAdmin: true,
            registrationComplete: true,
            logo: true,
            image: true,
            companyName: true,
            name: true,
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin;
          token.registrationComplete = dbUser.registrationComplete;
          token.logo = dbUser.logo;
          token.image = dbUser.image;
          token.companyName = dbUser.companyName;
          token.name = dbUser.name ?? token.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.logo = token.logo ?? null;
        session.user.image = token.image ?? null;
        session.user.companyName = token.companyName ?? null;
        session.user.registrationComplete = token.registrationComplete ?? false;
        session.user.emailVerified = token.emailVerified ?? false;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },

    // ✅ این callback خالی بود — حالا درست شده
    async redirect({ url, baseUrl }) {
      // اگر URL نسبی بود، به baseUrl اضافه کن
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // اگر URL از همون دامنه بود، اجازه بده
      try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        if (urlObj.origin === baseObj.origin) return url;

        // ساب‌دامین‌ها رو هم قبول کن
        if (urlObj.hostname.endsWith(".foodtradelink.com")) return url;
      } catch {
        // URL نامعتبر
      }

      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.AUTH_SECRET,
});
