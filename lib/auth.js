import { getToken } from "next-auth/jwt"
import prisma from "db"

// 認証タイプの定義
export const AuthType = {
  INDIVIDUAL: 'individual',
  GOOGLE: 'google',
  LINE: 'line'
}

// 統一認証コンテキストのインターフェース
export class AuthContext {
  constructor(type, userId, email = null, name = null) {
    this.type = type
    this.userId = userId
    this.email = email
    this.name = name
  }

  // UnifiedVotersテーブル用の統一識別子を生成
  getUnifiedUserId() {
    if (this.type === AuthType.INDIVIDUAL) {
      return this.userId // 個別投票の場合はそのままvoter ID
    }
    return `${this.type}:${this.userId}` // ソーシャル認証の場合は "google:123" 形式
  }

  // 認証タイプが個別投票かチェック
  isIndividual() {
    return this.type === AuthType.INDIVIDUAL
  }

  // 認証タイプがソーシャル認証かチェック
  isSocial() {
    return this.type === AuthType.GOOGLE || this.type === AuthType.LINE
  }
}

// リクエストから認証コンテキストを取得
export async function getAuthContext(req) {
  try {
    // 個別投票の場合（POST bodyにidがある）
    if (req.body && req.body.id) {
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.body.id,
        null,
        req.body.name || null
      )
    }

    // クエリパラメータから個別投票IDを取得（GET request）
    if (req.query && req.query.id) {
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.query.id,
        null,
        null
      )
    }

    // ソーシャル認証の場合（NextAuth.jsのJWTトークンから）
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      throw new Error("認証が必要です");
    }

    // プロバイダー判定
    const provider = token.provider || (token.googleId ? 'google' : 'line')
    
    // プロバイダー固有ID取得
    const providerId = token.googleId || token.lineId || token.sub || token.id

    if (!providerId) {
      throw new Error("プロバイダーIDが取得できません");
    }

    const authContext = new AuthContext(
      provider,
      providerId,
      token.email || null,
      token.name || null
    );

    return authContext;

  } catch (error) {
    throw new Error(`認証コンテキストの取得に失敗しました: ${error.message}`);
  }
}

// 認証コンテキストから既存の投票者データを取得
export async function getVoterData(authContext, eventId) {
  try {
    const unifiedUserId = authContext.getUnifiedUserId()
    
    const voter = await prisma.unifiedVoters.findFirst({
      where: {
        event_id: eventId,
        user_id: unifiedUserId,
      },
    })

    return voter
  } catch (error) {
    throw new Error(`投票者データの取得に失敗しました: ${error.message}`)
  }
}

// 認証コンテキストから投票者データを作成または更新
export async function upsertVoterData(authContext, eventId, voteData, voterName = null) {
  try {
    const unifiedUserId = authContext.getUnifiedUserId()
    
    const data = {
      event_id: eventId,
      auth_type: authContext.type,
      user_id: unifiedUserId,
      email: authContext.email,
      name: voterName || authContext.name,
      vote_data: voteData,
      voted_at: new Date(),
    }

    const voter = await prisma.unifiedVoters.upsert({
      where: {
        event_id_user_id: {
          event_id: eventId,
          user_id: unifiedUserId,
        },
      },
      update: {
        name: data.name,
        vote_data: data.vote_data,
        voted_at: data.voted_at,
      },
      create: data,
    })

    return voter
  } catch (error) {
    throw new Error(`投票者データの保存に失敗しました: ${error.message}`)
  }
}

// 重複投票チェック（メールアドレスベース）
export async function checkDuplicateVoteByEmail(authContext, eventId) {
  if (!authContext.email) {
    return null // メールアドレスがない場合はチェックしない
  }

  try {
    const unifiedUserId = authContext.getUnifiedUserId()
    
    // 同じメールアドレスで異なる認証方式の投票をチェック
    const existingVoter = await prisma.unifiedVoters.findFirst({
      where: {
        event_id: eventId,
        email: authContext.email,
        user_id: {
          not: unifiedUserId // 異なるユーザーIDでの投票をチェック
        }
      },
    })

    return existingVoter
  } catch (error) {
    throw new Error(`重複投票チェックに失敗しました: ${error.message}`)
  }
} 