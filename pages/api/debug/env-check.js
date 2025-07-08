// 本番環境での環境変数設定状況を確認するための診断用API
export default async (req, res) => {
  // 本番環境でのみ動作
  if (process.env.NODE_ENV !== 'production') {
    return res.status(404).json({ error: 'このAPIは本番環境でのみ利用可能です' });
  }

  // セキュリティ：簡単なトークンチェック（オプション）
  const debugToken = req.query.token;
  if (debugToken !== 'debug-2025') {
    return res.status(401).json({ error: '認証が必要です' });
  }

  try {
    const envCheck = {
      // 基本環境変数
      NODE_ENV: process.env.NODE_ENV,
      
      // NextAuth.js関連
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length,
      
      // Google OAuth関連
      hasGOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_ID_prefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20),
      hasGOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CLIENT_SECRET_length: process.env.GOOGLE_CLIENT_SECRET?.length,
      
      // LINE OAuth関連（オプション）
      hasLINE_CLIENT_ID: !!process.env.LINE_CLIENT_ID,
      hasLINE_CLIENT_SECRET: !!process.env.LINE_CLIENT_SECRET,
      
      // データベース関連
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 30),
      
      // その他
      timestamp: new Date().toISOString(),
      vercel_env: process.env.VERCEL_ENV,
      vercel_url: process.env.VERCEL_URL
    };

    res.json({
      status: 'success',
      environment_check: envCheck
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 