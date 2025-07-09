import { getSession } from "next-auth/react";
import { getToken } from "next-auth/jwt";
import { convertBigIntToString } from "lib/helpers";

export default async function handler(req, res) {
  // 管理者のみアクセス可能
  if (req.query.token !== 'debug-auth-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log("🔍 [DEBUG-AUTH] 認証状態確認開始:", {
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    // NextAuth.js セッション確認
    const session = await getSession({ req });
    
    // JWT トークン確認
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Cookie情報の詳細確認
    const cookies = req.headers.cookie ? 
      req.headers.cookie.split(';').map(c => c.trim()) : [];
    
    const nextAuthCookies = cookies.filter(c => 
      c.includes('next-auth') || 
      c.includes('__Secure-') || 
      c.includes('__Host-')
    );

    const response = {
      timestamp: new Date().toISOString(),
      session_exists: !!session,
      session_data: session ? {
        user: session.user,
        provider: session.provider,
        expires: session.expires
      } : null,
      token_exists: !!token,
      token_data: token ? {
        provider: token.provider,
        googleId: token.googleId,
        lineId: token.lineId,
        sub: token.sub,
        id: token.id,
        email: token.email,
        name: token.name,
        exp: token.exp,
        iat: token.iat
      } : null,
      cookies: {
        total_cookies: cookies.length,
        nextauth_cookies: nextAuthCookies,
        cookie_names: cookies.map(c => c.split('=')[0])
      },
      environment: {
        nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
        nextauth_url: process.env.NEXTAUTH_URL,
        node_env: process.env.NODE_ENV
      }
    };

    console.log("🔍 [DEBUG-AUTH] 認証状態確認完了:", response);

    res.status(200).json(convertBigIntToString(response));

  } catch (error) {
    console.error("❌ [DEBUG-AUTH] エラー:", error);
    
    res.status(500).json(convertBigIntToString({
      error: "認証状態確認失敗",
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
} 