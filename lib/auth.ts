import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
            'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
            'https://www.googleapis.com/auth/drive.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // On initial sign-in, store Google tokens in JWT
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },

    async session({ session, token }) {
      // Expose access token to the app
      session.accessToken = token.accessToken as string
      session.user.id = token.sub!

      // Upsert user in Supabase on every session refresh
      if (session.user.email) {
        await supabaseAdmin
          .from('users')
          .upsert(
            {
              id: token.sub,
              email: session.user.email,
              name: session.user.name ?? '',
              google_access_token: token.accessToken as string,
              google_refresh_token: token.refreshToken as string,
            },
            { onConflict: 'email' }
          )
          .select()
          .single()
      }

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
})

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    accessToken: string
  }
}
