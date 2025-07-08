import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import LineProvider from 'next-auth/providers/line'

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 本番環境でのJWTコールバックデバッグ
      if (process.env.NODE_ENV === 'production') {
        console.log('NextAuth JWT callback:', {
          has_token: !!token,
          has_account: !!account,
          has_profile: !!profile,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        });
      }
      
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
        if (account.provider === 'google') {
          token.googleId = profile.sub
        } else if (account.provider === 'line') {
          token.lineId = profile.sub
        }
      }
      return token
    },
    async session({ session, token }) {
      // 本番環境でのセッションコールバックデバッグ
      if (process.env.NODE_ENV === 'production') {
        console.log('NextAuth session callback:', {
          has_session: !!session,
          has_token: !!token,
          provider: token?.provider,
          has_provider_id: !!(token?.googleId || token?.lineId),
          timestamp: new Date().toISOString()
        });
      }
      
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken
      session.provider = token.provider
      session.providerId = token.googleId || token.lineId
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // 本番環境ではsecure cookieを有効化（HTTPS必須）
        secure: process.env.NODE_ENV === 'production',
        // 本番環境でのドメイン設定
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  // 本番環境でのデバッグを有効化（トラブルシューティング用）
  debug: true,
}) 