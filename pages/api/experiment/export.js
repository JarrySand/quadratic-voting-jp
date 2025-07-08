import prisma from "db"
import { sendErrorResponse, sendSuccessResponse } from "lib/helpers"

export default async function handler(req, res) {
  // 実験管理者の認証
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== process.env.EXPERIMENT_ADMIN_KEY) {
    return sendErrorResponse(res, 403, "管理者権限が必要です")
  }

  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await handleExportGet(req, res)
      default:
        return sendErrorResponse(res, 405, `${method}メソッドは許可されていません`)
    }
  } catch (error) {
    console.error('Export API Error:', error)
    return sendErrorResponse(res, 500, error.message)
  }
}

async function handleExportGet(req, res) {
  const { event_id } = req.query

  if (!event_id) {
    return sendErrorResponse(res, 400, "event_idが必要です")
  }

  const exportData = await exportExperimentData(event_id)
  return sendSuccessResponse(res, exportData, "実験データをエクスポートしました")
}

// 実験データエクスポート（シンプル版）
async function exportExperimentData(eventId) {
  // 投票データを取得
  const data = await prisma.unified_voters.findMany({
    where: { event_id: eventId },
    select: {
      user_id: true,
      auth_type: true,
      vote_data: true,
      voted_at: true,
      name: true
    },
    orderBy: { voted_at: 'asc' }
  })

  // イベント情報を取得
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      start_date: true,
      end_date: true,
      subjects: true
    }
  })

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // 実験開始時刻からの経過時間を計算
  const eventStart = new Date(event.start_date)
  const processedData = data.map(voter => ({
    user_id: voter.user_id,
    auth_type: voter.auth_type,
    vote_data: voter.vote_data,
    voted_at: voter.voted_at,
    name: voter.name,
    seconds_from_start: Math.floor((new Date(voter.voted_at) - eventStart) / 1000)
  }))

  return {
    event_info: {
      id: event.id,
      title: event.title,
      start_date: event.start_date,
      end_date: event.end_date,
      subjects: event.subjects
    },
    raw_data: processedData,
    summary: {
      total_participants: data.length,
      export_timestamp: new Date().toISOString()
    }
  }
} 