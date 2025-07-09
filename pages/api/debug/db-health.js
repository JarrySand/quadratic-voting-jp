import prisma from "db";
import { convertBigIntToString } from "lib/helpers";

export default async function handler(req, res) {
  // 管理者のみアクセス可能
  if (req.query.token !== 'debug-db-2025') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log("🔍 [DB-HEALTH] ヘルスチェック開始:", {
      timestamp: new Date().toISOString()
    });

    const startTime = Date.now();

    // 基本接続テスト
    const basicTest = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    const basicTestTime = Date.now() - startTime;

    // 接続プール状態チェック
    const connectionTest = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    const connectionTestTime = Date.now() - startTime;

    // データベース負荷チェック
    const loadTest = await prisma.$queryRaw`
      SELECT 
        count(*) as total_queries,
        avg(query_start) as avg_query_time
      FROM pg_stat_activity 
      WHERE datname = current_database() AND state = 'active'
    `;
    const loadTestTime = Date.now() - startTime;

    // テーブル接続テスト
    const tableTestStart = Date.now();
    const eventsCount = await prisma.events.count();
    const votersCount = await prisma.unifiedVoters.count();
    const tableTestTime = Date.now() - tableTestStart;

    // 複合クエリテスト
    const complexTestStart = Date.now();
    const recentVotes = await prisma.unifiedVoters.findMany({
      take: 5,
      orderBy: { voted_at: 'desc' },
      select: {
        id: true,
        event_id: true,
        auth_type: true,
        voted_at: true
      }
    });
    const complexTestTime = Date.now() - complexTestStart;

    const totalTime = Date.now() - startTime;

    const response = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      performance: {
        total_time_ms: totalTime,
        basic_test_ms: basicTestTime,
        connection_test_ms: connectionTestTime,
        load_test_ms: loadTestTime,
        table_test_ms: tableTestTime,
        complex_test_ms: complexTestTime
      },
      basic_test: {
        result: basicTest,
        success: true
      },
      connection_pool: {
        result: connectionTest[0],
        success: true
      },
      database_load: {
        result: loadTest[0],
        success: true
      },
      table_counts: {
        events: eventsCount,
        voters: votersCount,
        success: true
      },
      recent_activity: {
        recent_votes: recentVotes,
        success: true
      },
      health_indicators: {
        response_time_ok: totalTime < 5000,
        connection_pool_ok: connectionTest[0].total_connections < 20,
        basic_connectivity: true,
        table_access: true,
        complex_queries: true
      }
    };

    console.log("🔍 [DB-HEALTH] ヘルスチェック完了:", {
      total_time_ms: totalTime,
      connections: connectionTest[0],
      tables: { events: eventsCount, voters: votersCount },
      status: "healthy"
    });

    res.status(200).json(convertBigIntToString(response));

  } catch (error) {
    console.error("❌ [DB-HEALTH] エラー:", {
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    });

    const response = {
      timestamp: new Date().toISOString(),
      status: "unhealthy",
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta
      },
      health_indicators: {
        response_time_ok: false,
        connection_pool_ok: false,
        basic_connectivity: false,
        table_access: false,
        complex_queries: false
      }
    };

    res.status(500).json(convertBigIntToString(response));
  }
} 