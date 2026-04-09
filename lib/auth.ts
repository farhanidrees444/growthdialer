import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { signInSchema } from "@/lib/validations";
import { findRegisteredUser } from "@/lib/user-store";

// Demo users for development (replace with real DB in production)
const DEMO_USERS = [
  {
    id: "1",
    name: "Alex Rivera",
    email: "demo@growthdialer.com",
    password: "demo1234",
    image: null as string | null,
    role: "admin",
    plan: "growth",
  },
];

const googleConfigured =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
  Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());

/**
 * Auth.js requires a secret to sign sessions. In development, a fixed fallback avoids
 * MissingSecret / ClientFetchError when `.env.local` is not set. On Vercel, set `AUTH_SECRET`.
 */
const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  (process.env.NODE_ENV === "development"
    ? "development-only-auth-secret-min-32-chars-do-not-use-in-prod"
    : undefined);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const demo = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (demo) {
          return {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            image: demo.image,
          };
        }

        const registered = findRegisteredUser(email);
        if (registered && registered.password === password) {
          return {
            id: registered.id,
            name: registered.name,
            email: registered.email,
            image: registered.image,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: authSecret,
  trustHost: true,
});
