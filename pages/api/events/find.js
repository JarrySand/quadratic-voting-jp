import prisma from "db"
import { getAuthContext, getVoterData } from "lib/auth"
import { 
  getEventWithValidation, 
  parseEventData, 
  buildFindResponse,
  sendErrorResponse 
} from "lib/helpers"

// --> /api/events/find (統一検索API)
export default async (req, res) => {
  try {
    // 本番環境でのデバッグログ（SNS認証投票のトラブルシューティング用）
    if (process.env.NODE_ENV === 'production') {
      console.log('Find API 開始:', {
        method: req.method,
        query: req.query,
        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        userAgent: req.headers['user-agent'],
        cookies: Object.keys(req.cookies || {}),
        timestamp: new Date().toISOString()
      });
    }
    
    // 認証コンテキストを取得
    const authContext = await getAuthContext(req)
    
    // 認証コンテキストのデバッグログ
    if (process.env.NODE_ENV === 'production') {
      console.log('認証コンテキスト取得成功:', {
        auth_type: authContext.type,
        has_user_id: !!authContext.userId,
        has_email: !!authContext.email,
        user_id_prefix: authContext.userId?.substring(0, 10),
        timestamp: new Date().toISOString()
      });
    }
    
    // イベントIDの取得
    let eventId = req.query.event_id
    
    // 個別投票の場合は、UnifiedVotersテーブルから情報を取得
    if (authContext.isIndividual() && !eventId) {
      // 個別投票の場合、UnifiedVotersテーブルから情報を取得
      const voter = await prisma.unifiedVoters.findFirst({
        where: { 
          user_id: authContext.userId,
          auth_type: "individual"
        },
        select: { event_id: true, name: true, vote_data: true }
      })
      
      if (voter) {
        eventId = voter.event_id
        
        // 統合形式での応答
        const event = await getEventWithValidation(eventId)
        const eventData = parseEventData(event)
        
        const response = {
          exists: true,
          event_id: eventId,
          voter_name: voter.name || "",
          vote_data: voter.vote_data || [],
          event_data: {
            event_title: event.event_title,
            event_description: event.event_description,
            start_event_date: event.start_event_date,
            end_event_date: event.end_event_date,
            credits_per_voter: eventData.credits_per_voter || event.credits_per_voter,
            options: eventData.options || [],
          },
        }
        
        return res.json(response)
      } else {
        return res.json({
          exists: false,
          event_id: "",
          voter_name: "",
          vote_data: "",
          event_data: {},
        })
      }
    }

    if (!eventId) {
      return sendErrorResponse(res, 400, "イベントIDが必要です")
    }

    // イベント情報の取得と検証
    const event = await getEventWithValidation(eventId)
    const eventData = parseEventData(event)

    // 既存の投票データを取得
    const voterData = await getVoterData(authContext, eventId)

    // レスポンスデータを構築
    const response = buildFindResponse(event, eventData, authContext, voterData)

    res.json(response)

  } catch (error) {
    // 本番環境でのエラー詳細ログ
    console.error("Find API エラー詳細:", {
      error_message: error.message,
      error_stack: error.stack,
      request_method: req.method,
      request_query: req.query,
      request_headers: {
        authorization: req.headers.authorization ? '***' : 'none',
        cookie: req.headers.cookie ? '***' : 'none',
        'user-agent': req.headers['user-agent']
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    // 認証エラーの場合
    if (error.message.includes("認証")) {
      return sendErrorResponse(res, 401, error.message)
    }
    
    // イベントが見つからない場合
    if (error.message.includes("見つかりません")) {
      return sendErrorResponse(res, 404, error.message)
    }

    return sendErrorResponse(res, 500, error.message || "サーバーエラーが発生しました")
  }
}
