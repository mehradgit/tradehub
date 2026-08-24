// src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateNumber, generateSlug } from "@/utils/generate";

// ====== آداپتر سفارشی با createUser جدید ======
const prismaAdapter = PrismaAdapter(prisma);

const customAdapter = {
  ...prismaAdapter,
  createUser: async (data) => {
    // تولید شماره یکتا (با حلقه برای تضمین یکتایی)
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
        registrationComplete: false, // کاربر گوگل باید بعداً ثبت‌نام را کامل کند
      },
    });
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: customAdapter, // ✅ استفاده از آداپتر سفارشی
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }
        if (!user.emailVerified && user.registrationComplete === false) {
          throw new Error("Please verify your email first");
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          registrationComplete: user.registrationComplete,
          emailVerified: !!user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.registrationComplete = user.registrationComplete ?? false;
        token.emailVerified = user.emailVerified ?? false;
      }

      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { registrationComplete: true, emailVerified: true },
        });
        if (dbUser) {
          token.registrationComplete = dbUser.registrationComplete;
          token.emailVerified = !!dbUser.emailVerified;
        }
      }

      if (trigger === "update" && session?.registrationComplete === true) {
        token.registrationComplete = true;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.registrationComplete = token.registrationComplete ?? false;
        session.user.emailVerified = token.emailVerified ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl, user }) {
      // اگر کاربر registrationComplete = false، به complete-registration برود
      if (user && user.registrationComplete === false) {
        return `${baseUrl}/complete-registration`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
});