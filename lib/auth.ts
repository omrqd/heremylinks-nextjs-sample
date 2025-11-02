import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import { v4 as uuidv4 } from 'uuid';
import db from './db';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  name: string | null;
  password: string | null;
  profileImage: string | null;
  image: string | null;
  username: string;
  is_verified: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
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

        const [rows]: any = await db.query(
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
        if (!user.is_verified) {
          throw new Error('Please verify your email before logging in');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profile_image || user.image,
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
          const [rows]: any = await db.query(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [user.email]
          );

          let userId = rows[0]?.id;

          if (!userId) {
            // Create new user
            userId = uuidv4();
            const username = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
            
            await db.query(
              `INSERT INTO users (id, email, username, name, profile_image, provider, theme_color, background_color, card_background_color, is_published, is_verified) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                user.email,
                username,
                user.name || username,
                user.image,
                account.provider,
                '#8B5CF6',
                '#ffffff',
                '#ffffff',
                false,
                true, // OAuth users are auto-verified
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
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
});

