// --> /api/debug/simple-check
export default async (req, res) => {
  try {
    const basicCheck = {
      // 基本環境情報
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      
      // 環境変数の存在確認（値は隠す）
      env_variables: {
        DATABASE_URL: {
          exists: !!process.env.DATABASE_URL,
          length: process.env.DATABASE_URL?.length || 0,
          starts_with: process.env.DATABASE_URL?.substring(0, 20) + "...",
          contains_pooler: process.env.DATABASE_URL?.includes('pooler') || false,
          contains_supabase: process.env.DATABASE_URL?.includes('supabase') || false,
        },
        NEXTAUTH_SECRET: {
          exists: !!process.env.NEXTAUTH_SECRET,
          length: process.env.NEXTAUTH_SECRET?.length || 0,
        },
        NEXT_PUBLIC_BASE_URL: {
          exists: !!process.env.NEXT_PUBLIC_BASE_URL,
          value: process.env.NEXT_PUBLIC_BASE_URL, // パブリック環境変数なので表示OK
        },
        GOOGLE_CLIENT_ID: {
          exists: !!process.env.GOOGLE_CLIENT_ID,
          length: process.env.GOOGLE_CLIENT_ID?.length || 0,
        },
        GOOGLE_CLIENT_SECRET: {
          exists: !!process.env.GOOGLE_CLIENT_SECRET,
          length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
        }
      }
    };

    console.log("=== 基本環境チェック実行 ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);

    res.status(200).json({
      success: true,
      message: "基本環境チェック成功",
      data: basicCheck
    });

  } catch (error) {
    console.error("基本環境チェックエラー:", error);
    res.status(500).json({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}; 