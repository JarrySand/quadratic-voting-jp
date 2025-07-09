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
    // 本番環境での詳細なリクエスト情報をログ出力
    if (process.env.NODE_ENV === 'production') {
      console.log("🔍 [DEBUG] Find API 呼び出し:", {
        method: req.method,
        query: req.query,
        headers: {
          'user-agent': req.headers['user-agent'],
          'cookie': req.headers['cookie'] ? 'Present' : 'Missing',
          'authorization': req.headers['authorization'] ? 'Present' : 'Missing',
          'content-type': req.headers['content-type']
        },
        cookies: req.headers.cookie?.split(';').map(c => c.trim()).filter(c => c.includes('next-auth')),
        timestamp: new Date().toISOString()
      });
    }
    
    // 認証コンテキストを取得
    let authContext;
    try {
      authContext = await getAuthContext(req);
      
      // 認証成功時のデバッグ
      if (process.env.NODE_ENV === 'production') {
        console.log("🔍 [DEBUG] 認証コンテキスト取得成功:", {
          auth_type: authContext.type,
          user_id: authContext.userId,
          email: authContext.email,
          name: authContext.name,
          is_individual: authContext.isIndividual(),
          is_social: authContext.isSocial(),
          timestamp: new Date().toISOString()
        });
      }
    } catch (authError) {
      // 認証エラーの詳細をログ出力
      if (process.env.NODE_ENV === 'production') {
        console.error("🔍 [DEBUG] 認証コンテキスト取得エラー:", {
          error_message: authError.message,
          error_stack: authError.stack,
          request_query: req.query,
          request_body: req.body,
          cookies_present: !!req.headers.cookie,
          timestamp: new Date().toISOString()
        });
      }
      
      return sendErrorResponse(res, 401, authError.message);
    }
    
    // イベントIDの取得
    let eventId = req.query.event_id
    
    // 本番環境でのイベントID処理のデバッグ
    if (process.env.NODE_ENV === 'production') {
      console.log("🔍 [DEBUG] イベントID処理:", {
        event_id_from_query: eventId,
        auth_context_type: authContext.type,
        is_individual: authContext.isIndividual(),
        timestamp: new Date().toISOString()
      });
    }
    
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

    // 本番環境でのデータ取得デバッグ
    if (process.env.NODE_ENV === 'production') {
      console.log("🔍 [DEBUG] データ取得完了:", {
        event_id: eventId,
        event_title: event.event_title,
        voter_data_exists: !!voterData,
        voter_data_vote_data: voterData?.vote_data ? 'Present' : 'Missing',
        timestamp: new Date().toISOString()
      });
    }

    // レスポンスデータを構築
    const response = buildFindResponse(event, eventData, authContext, voterData)

    res.json(response)

  } catch (error) {
    // 本番環境でのエラーの詳細をログ出力
    if (process.env.NODE_ENV === 'production') {
      console.error("🔍 [DEBUG] Find API エラー:", {
        error_message: error.message,
        error_stack: error.stack,
        request_query: req.query,
        request_method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error("Find API Error:", error)
    }
    
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
