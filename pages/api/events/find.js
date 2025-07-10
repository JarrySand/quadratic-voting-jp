import prisma from "db"
import { getAuthContext, getVoterData } from "lib/auth"
import { 
  getEventWithValidation, 
  parseEventData, 
  buildFindResponse,
  sendErrorResponse,
  convertBigIntToString
} from "lib/helpers"

// --> /api/events/find (統一検索API)
export default async (req, res) => {
  try {

    
    // 認証コンテキストを取得
    let authContext;
    try {
      authContext = await getAuthContext(req);
      

    } catch (authError) {

      
      return sendErrorResponse(res, 401, authError.message);
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
        
        return res.json(convertBigIntToString(response))
      } else {
        const response = {
          exists: false,
          event_id: "",
          voter_name: "",
          vote_data: "",
          event_data: {},
        }
        return res.json(convertBigIntToString(response))
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



    res.json(convertBigIntToString(response))

  } catch (error) {

    
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
