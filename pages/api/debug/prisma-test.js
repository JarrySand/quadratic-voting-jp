import prisma from "db"
import { getAuthContext } from "lib/auth"
import { getToken } from "next-auth/jwt"

// --> /api/debug/prisma-test
export default async (req, res) => {
  try {
    let debugSteps = {};
    
    // Step 1: 基本環境チェック
    debugSteps.step1_basic_check = {
      status: "running",
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    };
    
    // Step 2: Prisma接続テスト
    debugSteps.step2_prisma_connection = {
      status: "running"
    };
    
    try {
      await prisma.$connect();
      const eventCount = await prisma.events.count();
      debugSteps.step2_prisma_connection = {
        status: "success",
        event_count: eventCount,
        prisma_client_type: typeof prisma
      };
    } catch (error) {
      debugSteps.step2_prisma_connection = {
        status: "error",
        error: error.message,
        error_code: error.code
      };
    }
    
    // Step 3: NextAuth JWT トークンテスト
    debugSteps.step3_nextauth_jwt = {
      status: "running"
    };
    
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      debugSteps.step3_nextauth_jwt = {
        status: "success",
        token_exists: !!token,
        token_provider: token?.provider || null,
        token_sub: token?.sub || null
      };
    } catch (error) {
      debugSteps.step3_nextauth_jwt = {
        status: "error",
        error: error.message
      };
    }
    
    // Step 4: 認証コンテキストテスト
    debugSteps.step4_auth_context = {
      status: "running"
    };
    
    try {
      const authContext = await getAuthContext(req);
      debugSteps.step4_auth_context = {
        status: "success",
        auth_type: authContext.type,
        user_id: authContext.userId,
        email: authContext.email,
        unified_user_id: authContext.getUnifiedUserId()
      };
    } catch (error) {
      debugSteps.step4_auth_context = {
        status: "error",
        error: error.message
      };
    }
    
    // Step 5: 投票API模擬テスト
    debugSteps.step5_vote_api_simulation = {
      status: "running"
    };
    
    try {
      // 模擬投票データでテスト
      const testEventId = "test-event-id";
      const testVotes = [1, 2, 0];
      
      // 基本的な投票データ検証をテスト
      const votesValid = Array.isArray(testVotes) && testVotes.every(v => typeof v === 'number');
      
      debugSteps.step5_vote_api_simulation = {
        status: "success",
        votes_validation: votesValid,
        test_event_id: testEventId,
        test_votes: testVotes
      };
    } catch (error) {
      debugSteps.step5_vote_api_simulation = {
        status: "error",
        error: error.message
      };
    }
    
    // 最終結果の判定
    const allStepsSuccess = Object.values(debugSteps).every(step => step.status === "success");
    
    res.status(200).json({
      success: allStepsSuccess,
      message: allStepsSuccess ? "全ステップ成功" : "一部のステップでエラー",
      debug_steps: debugSteps,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Debug API Error:", error);
    res.status(500).json({
      success: false,
      message: "デバッグAPIでエラーが発生しました",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 