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
    // 本番環境でのデバッグログ（SNS認証投票のトラブルシューティング用）
    if (process.env.NODE_ENV === 'production') {
      console.log('getAuthContext 開始:', {
        method: req.method,
        has_body: !!req.body,
        has_query: !!req.query,
        body_keys: req.body ? Object.keys(req.body) : [],
        query_keys: req.query ? Object.keys(req.query) : [],
        has_cookies: !!req.cookies,
        cookie_keys: req.cookies ? Object.keys(req.cookies) : [],
        timestamp: new Date().toISOString()
      });
    }
    
    // 個別投票の場合（POST bodyにidがある）
    if (req.body && req.body.id) {
      if (process.env.NODE_ENV === 'production') {
        console.log('個別投票認証（POST body）:', {
          user_id: req.body.id.substring(0, 10),
          has_name: !!req.body.name,
          timestamp: new Date().toISOString()
        });
      }
      
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.body.id,
        null,
        req.body.name || null
      )
    }

    // クエリパラメータから個別投票IDを取得（GET request）
    if (req.query && req.query.id) {
      if (process.env.NODE_ENV === 'production') {
        console.log('個別投票認証（GET query）:', {
          user_id: req.query.id.substring(0, 10),
          timestamp: new Date().toISOString()
        });
      }
      
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.query.id,
        null,
        null
      )
    }

    // ソーシャル認証の場合（NextAuth.jsのJWTトークンから）
    if (process.env.NODE_ENV === 'production') {
      console.log('ソーシャル認証処理開始:', {
        has_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_SECRET_length: process.env.NEXTAUTH_SECRET?.length,
        cookie_session_token: req.cookies ? !!req.cookies['next-auth.session-token'] : false,
        timestamp: new Date().toISOString()
      });
    }
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (process.env.NODE_ENV === 'production') {
      console.log('NextAuth.jsトークン取得結果:', {
        token_exists: !!token,
        token_keys: token ? Object.keys(token) : [],
        has_provider: token ? !!token.provider : false,
        has_googleId: token ? !!token.googleId : false,
        has_lineId: token ? !!token.lineId : false,
        has_email: token ? !!token.email : false,
        has_name: token ? !!token.name : false,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!token) {
      throw new Error("認証が必要です")
    }

    // プロバイダー判定
    const provider = token.provider || (token.googleId ? 'google' : 'line')
    
    // プロバイダー固有ID取得
    const providerId = token.googleId || token.lineId || token.sub || token.id

    if (!providerId) {
      if (process.env.NODE_ENV === 'production') {
        console.log('プロバイダーID取得失敗:', {
          provider: provider,
          has_googleId: !!token.googleId,
          has_lineId: !!token.lineId,
          has_sub: !!token.sub,
          has_id: !!token.id,
          token_keys: Object.keys(token),
          timestamp: new Date().toISOString()
        });
      }
      throw new Error("プロバイダーIDが取得できません")
    }

    if (process.env.NODE_ENV === 'production') {
      console.log('ソーシャル認証成功:', {
        provider: provider,
        provider_id_prefix: providerId.substring(0, 10),
        has_email: !!token.email,
        has_name: !!token.name,
        timestamp: new Date().toISOString()
      });
    }

    return new AuthContext(
      provider,
      providerId,
      token.email || null,
      token.name || null
    )

  } catch (error) {
    // 本番環境でのエラー詳細ログ
    console.error("認証コンテキスト取得エラー:", {
      error_message: error.message,
      error_stack: error.stack,
      request_method: req.method,
      has_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      cookie_keys: req.cookies ? Object.keys(req.cookies) : [],
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(`認証コンテキストの取得に失敗しました: ${error.message}`)
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
    const existingVoter = await prisma.unifiedVoters.findFirst({
      where: {
        event_id: eventId,
        email: authContext.email,
        auth_type: {
          not: authContext.type // 異なる認証方式での投票をチェック
        }
      },
    })

    return existingVoter
  } catch (error) {
    throw new Error(`重複投票チェックに失敗しました: ${error.message}`)
  }
} 