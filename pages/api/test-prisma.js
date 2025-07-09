import prisma from "db"

export default async function handler(req, res) {
  try {
    console.log("🔍 [TEST-PRISMA] Prisma段階テスト開始");
    
    const results = {};
    
    // Test 1: 基本的な$queryRaw
    try {
      console.log("🔍 [TEST-PRISMA] Test 1: 基本的な$queryRaw");
      const test1 = await prisma.$queryRaw`SELECT 1 as basic_test`;
      results.test1_basic_query = { status: "success", result: test1 };
      console.log("✅ [TEST-PRISMA] Test 1 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 1 失敗:", error);
      results.test1_basic_query = { status: "error", error: error.message };
    }
    
    // Test 2: テーブル一覧取得
    try {
      console.log("🔍 [TEST-PRISMA] Test 2: テーブル一覧取得");
      const test2 = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        LIMIT 5
      `;
      results.test2_table_list = { status: "success", result: test2 };
      console.log("✅ [TEST-PRISMA] Test 2 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 2 失敗:", error);
      results.test2_table_list = { status: "error", error: error.message };
    }
    
    // Test 3: Eventsテーブル存在確認
    try {
      console.log("🔍 [TEST-PRISMA] Test 3: Eventsテーブル存在確認");
      const test3 = await prisma.$queryRaw`
        SELECT COUNT(*) as event_count FROM "Events" LIMIT 1
      `;
      results.test3_events_count = { status: "success", result: test3 };
      console.log("✅ [TEST-PRISMA] Test 3 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 3 失敗:", error);
      results.test3_events_count = { status: "error", error: error.message };
    }
    
    // Test 4: Prisma client findMany
    try {
      console.log("🔍 [TEST-PRISMA] Test 4: Prisma client findMany");
      const test4 = await prisma.events.findMany({
        take: 1,
        select: {
          id: true,
          event_title: true,
          created_at: true
        }
      });
      results.test4_prisma_findMany = { status: "success", result: test4 };
      console.log("✅ [TEST-PRISMA] Test 4 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 4 失敗:", error);
      results.test4_prisma_findMany = { status: "error", error: error.message };
    }
    
    // Test 5: Prisma client findFirst  
    try {
      console.log("🔍 [TEST-PRISMA] Test 5: Prisma client findFirst");
      const test5 = await prisma.events.findFirst({
        select: {
          id: true,
          event_title: true,
          created_at: true
        }
      });
      results.test5_prisma_findFirst = { status: "success", result: test5 };
      console.log("✅ [TEST-PRISMA] Test 5 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 5 失敗:", error);
      results.test5_prisma_findFirst = { status: "error", error: error.message };
    }
    
    // Test 6: Prisma client findUnique (実際のエラーが発生するクエリ)
    try {
      console.log("🔍 [TEST-PRISMA] Test 6: Prisma client findUnique");
      
      // 最初のイベントIDを取得
      const firstEvent = await prisma.events.findFirst({
        select: { id: true }
      });
      
      if (firstEvent) {
        const test6 = await prisma.events.findUnique({
          where: { id: firstEvent.id },
          select: {
            id: true,
            event_title: true,
            event_data: true,
            created_at: true
          }
        });
        results.test6_prisma_findUnique = { status: "success", result: test6 };
        console.log("✅ [TEST-PRISMA] Test 6 成功");
      } else {
        results.test6_prisma_findUnique = { status: "skip", message: "No events found" };
      }
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 6 失敗:", error);
      results.test6_prisma_findUnique = { status: "error", error: error.message };
    }
    
    // Test 7: UnifiedVotersテーブルテスト
    try {
      console.log("🔍 [TEST-PRISMA] Test 7: UnifiedVotersテーブルテスト");
      const test7 = await prisma.unifiedVoters.findMany({
        take: 1,
        select: {
          id: true,
          event_id: true,
          auth_type: true,
          created_at: true
        }
      });
      results.test7_voters_table = { status: "success", result: test7 };
      console.log("✅ [TEST-PRISMA] Test 7 成功");
    } catch (error) {
      console.error("❌ [TEST-PRISMA] Test 7 失敗:", error);
      results.test7_voters_table = { status: "error", error: error.message };
    }
    
    console.log("✅ [TEST-PRISMA] 全テスト完了");
    
    res.status(200).json({
      status: "completed",
      message: "Prisma段階テスト完了",
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ [TEST-PRISMA] 全体エラー:", {
      error_message: error.message,
      error_code: error.code,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      status: "error",
      message: "Prismaテスト失敗",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 