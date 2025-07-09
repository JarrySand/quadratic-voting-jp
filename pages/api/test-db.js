import prisma from "db"

export default async function handler(req, res) {
  try {
    console.log("🔍 [TEST-DB] データベース接続テスト開始");
    
    // 簡単なクエリでデータベース接続をテスト
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log("✅ [TEST-DB] データベース接続成功:", result);
    
    res.status(200).json({
      status: "success",
      message: "データベース接続正常",
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ [TEST-DB] データベース接続エラー:", {
      error_message: error.message,
      error_code: error.code,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      status: "error",
      message: "データベース接続失敗",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 