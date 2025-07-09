import prisma from "db"
import { getAuthContext, getVoterData, upsertVoterData, checkDuplicateVoteByEmail } from "lib/auth"
import { 
  getEventWithValidation, 
  parseEventData, 
  validateVotingPeriod, 
  validateVotingMode,
  validateVoteData,
  validateVoteCredits,
  buildVoteData,
  sendErrorResponse,
  sendSuccessResponse
} from "lib/helpers"
import { applyRateLimit, experimentVoteSchema, experimentErrorHandler } from "lib/security"

// --> /api/events/vote (統一投票API)
const voteHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return sendErrorResponse(res, 405, "POSTメソッドのみ許可されています")
  }

  try {
    const voteStartTime = Date.now();
    console.log("🔍 [VOTE-API] 投票処理開始:", {
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // 入力検証（実証実験用）
    const { error } = experimentVoteSchema.validate(req.body)
    if (error) {
      console.log("❌ [VOTE-API] 入力検証エラー:", error.details[0].message);
      return sendErrorResponse(res, 400, `入力データが無効です: ${error.details[0].message}`)
    }

    // 認証コンテキストを取得
    const authContext = await getAuthContext(req)
    req.authContext = authContext // レート制限で使用
    
    console.log("🔍 [VOTE-API] 認証コンテキスト:", {
      type: authContext.type,
      isAuthenticated: authContext.isAuthenticated,
      user: authContext.user,
      userId: authContext.getUnifiedUserId ? authContext.getUnifiedUserId() : 'no-method'
    });
    
    // リクエストデータの取得
    const { event_id, votes, name } = req.body

    // イベント情報の取得と検証
    const event = await getEventWithValidation(event_id)
    const eventData = parseEventData(event)

    // 投票期間の検証
    validateVotingPeriod(event)

    // 投票モードの検証
    validateVotingMode(event, authContext)

    // 投票データの検証
    validateVoteData(votes, eventData)

    // 投票ポイントの検証
    validateVoteCredits(votes, eventData, event)

    // 重複投票チェック（メールアドレスベース）
    console.log("🔍 [VOTE-API] 重複投票チェック開始:", {
      event_id,
      authContext: {
        type: authContext.type,
        user: authContext.user,
        email: authContext.user?.email
      }
    });
    
    const duplicateVoter = await checkDuplicateVoteByEmail(authContext, event_id)
    
    console.log("🔍 [VOTE-API] 重複投票チェック結果:", {
      duplicateVoter,
      has_duplicate: !!duplicateVoter
    });
    
    if (duplicateVoter) {
      console.log("❌ [VOTE-API] 重複投票エラー:", {
        existing_auth_type: duplicateVoter.auth_type,
        existing_email: duplicateVoter.email,
        current_email: authContext.user?.email
      });
      return sendErrorResponse(res, 400, 
        `同じメールアドレスで既に投票済みです（${duplicateVoter.auth_type}認証）`)
    }

    // 投票データの構築
    const voteData = buildVoteData(votes, eventData)

    // UnifiedVotersテーブルに投票データを保存
    await upsertVoterData(authContext, event_id, voteData, name)

    // 成功レスポンス
    const existingVoter = await getVoterData(authContext, event_id)
    const isUpdate = !!existingVoter
    
    const voteEndTime = Date.now();
    const voteDuration = voteEndTime - voteStartTime;
    
    console.log("🔍 [VOTE-API] 投票処理完了:", {
      duration_ms: voteDuration,
      event_id: event_id,
      action: isUpdate ? "updated" : "created",
      voter_id: authContext.getUnifiedUserId(),
      timestamp: new Date().toISOString()
    });

    return sendSuccessResponse(res, 
      { 
        action: isUpdate ? "updated" : "created",
        voter_id: authContext.getUnifiedUserId()
      }, 
      isUpdate ? "投票を更新しました" : "投票を受け付けました"
    )

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Vote API Error:", error)
    }
    
    // 実験用エラーハンドリング
    if (error.code === 'P2002') {
      error.code = 'VOTE_ALREADY_SUBMITTED'
    }
    
    return experimentErrorHandler(error, req, res, null)
  }
}

// レート制限を適用してエクスポート
export default applyRateLimit(voteHandler)
