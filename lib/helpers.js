import prisma from "db"
import moment from "moment"

// イベントの取得と基本検証
export async function getEventWithValidation(eventId) {
  try {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        event_title: true,
        event_description: true,
        start_event_date: true,
        end_event_date: true,
        credits_per_voter: true,
        event_data: true,
        voting_mode: true,
      },
    })

    if (!event) {
      throw new Error("イベントが見つかりません")
    }

    return event
  } catch (error) {
    throw new Error(`イベントの取得に失敗しました: ${error.message}`)
  }
}

// イベントデータのパースと検証
export function parseEventData(event) {
  try {
    let eventData
    if (typeof event.event_data === 'string') {
      eventData = JSON.parse(event.event_data)
    } else {
      eventData = event.event_data
    }

    // 基本構造の検証
    if (!eventData || !eventData.options || !Array.isArray(eventData.options)) {
      throw new Error("イベントデータの形式が不正です")
    }

    return eventData
  } catch (error) {
    throw new Error(`イベントデータの解析に失敗しました: ${error.message}`)
  }
}

// 投票期間の検証
export function validateVotingPeriod(event) {
  const now = moment()
  const startDate = moment(event.start_event_date)
  const endDate = moment(event.end_event_date)

  if (now.isBefore(startDate)) {
    throw new Error("投票期間が開始されていません")
  }

  if (now.isAfter(endDate)) {
    throw new Error("投票期間が終了しています")
  }

  return true
}

// 投票モードの検証
export function validateVotingMode(event, authContext) {
  const votingMode = event.voting_mode

  // 個別投票の場合
  if (authContext.isIndividual()) {
    if (votingMode === "social_auth" || votingMode === "google_auth") {
      throw new Error("このイベントは個別投票に対応していません")
    }
    return true
  }

  // ソーシャル認証の場合
  if (authContext.isSocial()) {
    if (votingMode !== "social_auth" && votingMode !== "google_auth") {
      throw new Error("このイベントはソーシャル認証投票に対応していません")
    }
    return true
  }

  throw new Error("不正な投票モードです")
}

// 投票データの形式検証
export function validateVoteData(votes, eventData) {
  if (!Array.isArray(votes)) {
    throw new Error("投票データは配列である必要があります")
  }

  if (votes.length !== eventData.options.length) {
    throw new Error("投票データの項目数が一致しません")
  }

  // 各投票数が非負整数かチェック
  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i]
    if (typeof vote !== 'number' || vote < 0 || !Number.isInteger(vote)) {
      throw new Error("投票数は非負整数である必要があります")
    }
  }

  return true
}

// 投票ポイントの計算と検証（二次投票コスト）
export function validateVoteCredits(votes, eventData, event) {
  const totalCost = votes.reduce((sum, voteCount) => sum + (voteCount * voteCount), 0)
  const maxCredits = eventData.credits_per_voter || event.credits_per_voter || 5

  if (totalCost > maxCredits) {
    throw new Error(`投票ポイントが上限を超えています（${totalCost}/${maxCredits}）`)
  }

  return {
    totalCost,
    maxCredits,
    remainingCredits: maxCredits - totalCost
  }
}

// 投票データの構築
export function buildVoteData(votes, eventData) {
  return eventData.options.map((option, index) => ({
    title: option.title,
    description: option.description || "",
    url: option.url || "",
    votes: votes[index] || 0,
  }))
}

// 個別投票用の初期化データ生成
export function generateInitialVoteData(eventData) {
  if (!eventData || !eventData.options) {
    return []
  }

  return eventData.options.map((option) => ({
    title: option.title,
    description: option.description || "",
    url: option.url || "",
    votes: 0,
  }))
}

// レスポンスデータの構築
export function buildFindResponse(event, eventData, authContext, voterData = null) {
  const baseResponse = {
    exists: true,
    event_id: event.id,
    voter_name: authContext.name || "",
    vote_data: voterData?.vote_data || generateInitialVoteData(eventData),
    event_data: {
      event_title: event.event_title,
      event_description: event.event_description,
      start_event_date: event.start_event_date,
      end_event_date: event.end_event_date,
      credits_per_voter: eventData.credits_per_voter || event.credits_per_voter,
      options: eventData.options || [],
    },
  }

  // ソーシャル認証の場合は追加情報を含める
  if (authContext.isSocial()) {
    baseResponse.user_info = {
      provider: authContext.type,
      provider_id: authContext.userId,
      email: authContext.email,
      name: authContext.name,
    }
    baseResponse.has_voted = !!voterData?.voted_at
  }

  return baseResponse
}

// エラーレスポンスの統一
export function sendErrorResponse(res, statusCode, message) {
  return res.status(statusCode).json({ error: message })
}

// 成功レスポンスの統一
export function sendSuccessResponse(res, data, message = null) {
  const response = message ? { message, ...data } : data
  return res.status(200).json(response)
} 