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

        // یک‌بارمصرف: توکن رو پاک کن
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
        token.registrationComplete = user.registrationComplete ?? false;
        token.emailVerified = user.emailVerified ?? false;
        token.isAdmin = user.isAdmin ?? false;
      }

      // ✅ مهم‌ترین بخش
      if (trigger === "update" && session) {
        if (session.registrationComplete !== undefined) {
          token.registrationComplete = session.registrationComplete;
        }
      }

      if (!token.isAdmin && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { isAdmin: true, registrationComplete: true },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.registrationComplete = dbUser.registrationComplete;
        }
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
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl, user }) {
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
