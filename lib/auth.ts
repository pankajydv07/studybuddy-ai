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
    async jwt({ token, account, profile }) {
      // On initial sign-in, store Google tokens in JWT
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at // Unix seconds
        token.error = undefined
      }

      if (profile?.sub) {
        token.sub = profile.sub as string
      }

      // If the access token has NOT expired, return as-is
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Access token has expired — try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          })

          const refreshedTokens = await response.json()

          if (!response.ok) {
            console.error('Token refresh failed:', refreshedTokens)
            token.error = 'RefreshAccessTokenError'
            return token
          }

          token.accessToken = refreshedTokens.access_token
          // Google may or may not return a new refresh_token
          if (refreshedTokens.refresh_token) {
            token.refreshToken = refreshedTokens.refresh_token
          }
          token.expiresAt = Math.floor(Date.now() / 1000) + refreshedTokens.expires_in
          token.error = undefined
        } catch (error) {
          console.error('Error refreshing access token:', error)
          token.error = 'RefreshAccessTokenError'
        }
      }

      return token
    },

    async session({ session, token }) {
      // Expose access token and error state to the app
      session.accessToken = token.accessToken as string
      session.user.id = token.sub!
      session.error = token.error as string | undefined

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
            { onConflict: 'id' }
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
    error?: string
  }
}
