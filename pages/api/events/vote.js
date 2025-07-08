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
    // 入力検証（実証実験用）
    const { error } = experimentVoteSchema.validate(req.body)
    if (error) {
      return sendErrorResponse(res, 400, `入力データが無効です: ${error.details[0].message}`)
    }

    // 認証コンテキストを取得
    const authContext = await getAuthContext(req)
    req.authContext = authContext // レート制限で使用
    
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
    const duplicateVoter = await checkDuplicateVoteByEmail(authContext, event_id)
    if (duplicateVoter) {
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
