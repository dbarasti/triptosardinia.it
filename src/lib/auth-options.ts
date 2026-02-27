import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { isLoginRateLimited, recordFailedLogin, clearLoginAttempts } from '@/lib/login-rate-limit';

function getClientIp(headers: Record<string, string> | Headers): string {
  const get = (key: string) =>
    typeof (headers as Headers).get === 'function'
      ? (headers as Headers).get(key)
      : (headers as Record<string, string>)[key];
  const xff = get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = get('x-real-ip');
  if (xri) return xri.trim();
  return 'unknown';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password) return null;

        const headers = req?.headers ?? {};
        const ip = getClientIp(headers);
        if (isLoginRateLimited(ip)) return null;

        const user = await db.getAdminUserByUsername(username);
        if (!user) {
          recordFailedLogin(ip);
          return null;
        }
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
          recordFailedLogin(ip);
          return null;
        }
        clearLoginAttempts(ip);
        return { id: user.id, name: user.username };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.name = (token.name as string) ?? '';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
