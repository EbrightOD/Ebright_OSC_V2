import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { titleCaseName } from "@/lib/text";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Username/Email", type: "text" },
        password: { label: "Password",       type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          include: {
            role: true,
            user_profile: true,
            employment: {
              where: { status: "active" },
              include: { branch: true },
              take: 1,
            },
          },
        });
        if (!user) return null;
        if (user.status !== "active") return null;
        if (!user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        await prisma.users.update({
          where: { user_id: user.user_id },
          data: { last_login: new Date() },
        });

        const activeEmployment = user.employment[0];

        return {
          id:         user.user_id.toString(),
          email:      user.email,
          name:       titleCaseName(user.user_profile?.full_name) || null,
          role:       user.role.role_type,
          position:   activeEmployment?.position ?? null,
          branchName: activeEmployment?.branch?.branch_name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId     = (user as { id?: string }).id;
        token.role       = (user as { role?: string }).role;
        token.position   = (user as { position?: string | null }).position;
        token.branchName = (user as { branchName?: string | null }).branchName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: unknown }).id           = token.userId;
        (session.user as { role?: unknown }).role       = token.role;
        (session.user as { position?: unknown }).position = token.position;
        (session.user as { branchName?: unknown }).branchName = token.branchName;
      }
      return session;
    },
  },
  pages:   { signIn: "/login" },
  session: { strategy: "jwt" },
  secret:  process.env.NEXTAUTH_SECRET,
};
