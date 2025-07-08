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
      case 'POST':
        return await handleBackupAction(req, res)
      case 'GET':
        return await handleBackupList(req, res)
      default:
        return sendErrorResponse(res, 405, `${method}メソッドは許可されていません`)
    }
  } catch (error) {
    console.error('Backup API Error:', error)
    return sendErrorResponse(res, 500, error.message)
  }
}

async function handleBackupAction(req, res) {
  const { action, event_id, phase } = req.body

  switch (action) {
    case 'create_manual':
      if (!event_id) {
        return sendErrorResponse(res, 400, "event_idが必要です")
      }
      const backupData = await createManualBackup(event_id, phase)
      return sendSuccessResponse(res, backupData, "手動バックアップを作成しました")

    case 'verify_integrity':
      if (!event_id) {
        return sendErrorResponse(res, 400, "event_idが必要です")
      }
      const integrity = await verifyDataIntegrity(event_id)
      return sendSuccessResponse(res, integrity, "データ整合性チェックを実行しました")

    default:
      return sendErrorResponse(res, 400, `不明なアクション: ${action}`)
  }
}

async function handleBackupList(req, res) {
  const fs = require('fs')
  const path = require('path')
  
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    // バックアップディレクトリが存在しない場合は作成
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const files = fs.readdirSync(backupDir)
    
    const backupList = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(backupDir, file)
        const stats = fs.statSync(filepath)
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    return sendSuccessResponse(res, 
      { backups: backupList },
      `${backupList.length}個のバックアップファイルを発見しました`
    )
  } catch (error) {
    return sendErrorResponse(res, 500, "バックアップリストの取得に失敗しました")
  }
}

// 手動バックアップ作成（シンプル版）
async function createManualBackup(eventId, phase = 'manual') {
  const fs = require('fs')
  const path = require('path')
  
  // バックアップディレクトリを作成
  const backupDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  // データを取得
  const [event, voters] = await Promise.all([
    prisma.events.findUnique({
      where: { id: eventId }
    }),
    prisma.unified_voters.findMany({
      where: { event_id: eventId }
    })
  ])

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // バックアップデータを作成
  const backupData = {
    backup_info: {
      event_id: eventId,
      phase: phase,
      created_at: new Date().toISOString(),
      version: '1.0'
    },
    event: event,
    voters: voters
  }

  // ファイル名を生成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup_${eventId}_${phase}_${timestamp}.json`
  const filepath = path.join(backupDir, filename)

  // ファイルに保存
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2))

  return {
    filename: filename,
    path: filepath,
    size: fs.statSync(filepath).size,
    voter_count: voters.length,
    created_at: backupData.backup_info.created_at
  }
}

// データ整合性チェック（シンプル版）
async function verifyDataIntegrity(eventId) {
  const [event, voters] = await Promise.all([
    prisma.events.findUnique({
      where: { id: eventId }
    }),
    prisma.unified_voters.findMany({
      where: { event_id: eventId }
    })
  ])

  if (!event) {
    throw new Error('イベントが見つかりません')
  }

  // 基本的な整合性チェック
  const issues = []

  // 投票データの検証
  voters.forEach((voter, index) => {
    if (!voter.vote_data) {
      issues.push(`投票者 ${index + 1}: 投票データがありません`)
    } else {
      try {
        const votes = voter.vote_data
        if (!Array.isArray(votes)) {
          issues.push(`投票者 ${index + 1}: 投票データの形式が不正です`)
        }
      } catch (error) {
        issues.push(`投票者 ${index + 1}: 投票データの解析に失敗しました`)
      }
    }
  })

  return {
    event_id: eventId,
    check_timestamp: new Date().toISOString(),
    total_voters: voters.length,
    issues_found: issues.length,
    issues: issues.slice(0, 10), // 最大10件のエラーを表示
    integrity_status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND'
  }
} 