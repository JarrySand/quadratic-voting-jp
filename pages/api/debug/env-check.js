import prisma from "db";

// --> /api/debug/env-check
export default async (req, res) => {
  try {
    // セキュリティ: 本番環境でのみ制限された情報を返す
    const envCheck = {
      // 基本環境情報
      NODE_ENV: process.env.NODE_ENV,
      
      // 環境変数の存在確認（値は隠す）
      env_variables: {
        DATABASE_URL: {
          exists: !!process.env.DATABASE_URL,
          length: process.env.DATABASE_URL?.length || 0,
          starts_with: process.env.DATABASE_URL?.substring(0, 15) + "...",
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
        },
        LINE_CLIENT_ID: {
          exists: !!process.env.LINE_CLIENT_ID,
          length: process.env.LINE_CLIENT_ID?.length || 0,
        },
        LINE_CLIENT_SECRET: {
          exists: !!process.env.LINE_CLIENT_SECRET,
          length: process.env.LINE_CLIENT_SECRET?.length || 0,
        }
      },
      
      // Prismaクライアントテスト
      prisma_status: {
        client_exists: !!prisma,
        client_type: typeof prisma,
      },
      
      timestamp: new Date().toISOString()
    };

    // データベース接続テスト
    try {
      console.log("=== データベース接続テスト実行中 ===");
      const testQuery = await prisma.events.count();
      envCheck.database_connection = {
        success: true,
        event_count: testQuery,
        message: "データベース接続成功"
      };
      console.log("データベース接続成功、イベント数:", testQuery);
    } catch (dbError) {
      console.error("データベース接続エラー:", dbError);
      envCheck.database_connection = {
        success: false,
        error_name: dbError.name,
        error_message: dbError.message,
        error_code: dbError.code,
        message: "データベース接続失敗"
      };
    }

    // 簡単なイベント作成テスト
    try {
      console.log("=== テストイベント作成試行 ===");
      const testEvent = await prisma.events.create({
        data: {
          event_title: "環境テスト",
          event_description: "環境変数テスト用",
          num_voters: 1,
          credits_per_voter: 1,
          start_event_date: new Date(),
          end_event_date: new Date(Date.now() + 86400000), // 24時間後
          event_data: JSON.stringify({
            options: [{ id: 1, title: "テスト選択肢" }],
            credits_per_voter: 1
          }),
          voting_mode: "individual"
        },
        select: {
          id: true,
          event_title: true,
          created_at: true
        }
      });
      
      envCheck.event_creation_test = {
        success: true,
        created_event: testEvent,
        message: "テストイベント作成成功"
      };
      console.log("テストイベント作成成功:", testEvent);
      
      // テストイベントを削除
      await prisma.events.delete({
        where: { id: testEvent.id }
      });
      console.log("テストイベント削除完了");
      
    } catch (createError) {
      console.error("イベント作成テストエラー:", createError);
      envCheck.event_creation_test = {
        success: false,
        error_name: createError.name,
        error_message: createError.message,
        error_code: createError.code,
        message: "テストイベント作成失敗"
      };
    }

    res.status(200).json({
      success: true,
      data: envCheck
    });

  } catch (error) {
    console.error("環境チェックエラー:", error);
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