import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import { v4 as uuidv4 } from 'uuid';
import db from './db';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

interface User extends RowDataPacket {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  profileImage: string | null;
  image: string | null;
  username: string;
  is_verified: number;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    nonce: {
      name: 'next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID || '',
      clientSecret: process.env.APPLE_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [rows] = await db.query<User[]>(
          'SELECT * FROM users WHERE email = ? LIMIT 1',
          [credentials.email as string]
        );

        const user = rows[0];

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }
        
        // Check if user is verified
        if (user.is_verified === 0) {
          throw new Error('Please verify your email before logging in');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profileImage || user.image,
          username: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'apple') {
        try {
          // Check if user exists
          const [rows] = await db.query<User[]>(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [user.email]
          );

          let userId = rows[0]?.id;

          if (!userId) {
            // Create new user
            userId = uuidv4();
            const username = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
            
            await db.query(
              `INSERT INTO users (id, email, name, image, username, provider, provider_id, email_verified) 
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
              [userId, user.email, user.name, user.image, username, account.provider, account.providerAccountId]
            );
          }

          // Check if account exists
          const [accountRows] = await db.query<RowDataPacket[]>(
            'SELECT * FROM accounts WHERE provider = ? AND provider_account_id = ? LIMIT 1',
            [account.provider, account.providerAccountId]
          );

          if (Array.isArray(accountRows) && accountRows.length === 0) {
            // Create account record
            await db.query(
              `INSERT INTO accounts (id, user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at, token_type, scope, id_token) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                uuidv4(),
                userId,
                account.type,
                account.provider,
                account.providerAccountId,
                account.access_token,
                account.refresh_token,
                account.expires_at,
                account.token_type,
                account.scope,
                account.id_token
              ]
            );
          }

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
});
