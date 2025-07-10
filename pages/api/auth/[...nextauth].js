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
  debug: false, // 本番環境では無効
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Vercel本番環境用の最適化されたCookie設定
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // 本番環境では常にtrue
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.callback-url' 
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Host-next-auth.csrf-token' 
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      }
    }
  },
  // JWTオプションの最適化
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  events: {
    async session({ session, token }) {
      // セッション作成時のログ
      console.log('NextAuth Session Created:', {
        provider: session?.provider,
        expires: session?.expires,
        userId: session?.providerId,
      });
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}) 