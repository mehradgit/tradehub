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

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: customAdapter,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ✅ NEW: ورود با ایمیل و رمز عبور
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
          registrationComplete: user.registrationComplete,
          emailVerified: true,
          isAdmin: user.isAdmin,
        };
      },
    }),

    // ✅ حفظ provider قبلی برای auto-login بعد از verify-email
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

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.emailVerified) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          registrationComplete: user.registrationComplete,
          emailVerified: true,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.logo = user.logo; // ✅ جدید
        token.image = user.image; // ✅ جدید
        token.companyName = user.companyName; // ✅ جدید
        token.registrationComplete = user.registrationComplete ?? false;
        token.emailVerified = user.emailVerified ?? false;
        token.isAdmin = user.isAdmin ?? false;
      }

      if (trigger === "update" && session) {
        if (session.registrationComplete !== undefined) {
          token.registrationComplete = session.registrationComplete;
        }
        // ✅ اگر بعد از edit-profile خواستی logo هم آپدیت بشه:
        if (session.logo !== undefined) token.logo = session.logo;
        if (session.image !== undefined) token.image = session.image;
        if (session.companyName !== undefined)
          token.companyName = session.companyName;
      }

      // هر بار از DB بخون (fresh) — این‌طوری بعد از آپلود لوگو، در اولین رفرش آپدیت می‌شه
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            isAdmin: true,
            registrationComplete: true,
            logo: true, // ✅ جدید
            image: true, // ✅ جدید
            companyName: true, // ✅ جدید
            name: true, // ✅ جدید
          },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.registrationComplete = dbUser.registrationComplete;
          token.logo = dbUser.logo; // ✅
          token.image = dbUser.image; // ✅
          token.companyName = dbUser.companyName; // ✅
          token.name = dbUser.name ?? token.name; // ✅
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.logo = token.logo; // ✅ جدید
        session.user.image = token.image; // ✅ جدید
        session.user.companyName = token.companyName; // ✅ جدید
        session.user.registrationComplete = token.registrationComplete ?? false;
        session.user.emailVerified = token.emailVerified ?? false;
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },

    async redirect({ url, baseUrl, user }) {
      // ... همون کد قبلی
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
});
