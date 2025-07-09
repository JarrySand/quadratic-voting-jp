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
    // 詳細なリクエスト情報をログ出力（環境チェック削除）
    console.log("🔍 [AUTH] getAuthContext 開始:", {
      method: req.method,
      query: req.query,
      body: req.body,
      headers: {
        'cookie': req.headers.cookie ? 'Present' : 'Missing',
        'authorization': req.headers.authorization ? 'Present' : 'Missing',
      },
      cookies: req.headers.cookie?.split(';').map(c => c.trim()).filter(c => c.includes('next-auth') || c.includes('__Secure-') || c.includes('__Host-')),
      timestamp: new Date().toISOString()
    });
    
    // 個別投票の場合（POST bodyにidがある）
    if (req.body && req.body.id) {
      console.log("🔍 [AUTH] 個別投票認証 (POST body):", {
        user_id: req.body.id,
        name: req.body.name || null,
        timestamp: new Date().toISOString()
      });
      
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.body.id,
        null,
        req.body.name || null
      )
    }

    // クエリパラメータから個別投票IDを取得（GET request）
    if (req.query && req.query.id) {
      console.log("🔍 [AUTH] 個別投票認証 (GET query):", {
        user_id: req.query.id,
        timestamp: new Date().toISOString()
      });
      
      return new AuthContext(
        AuthType.INDIVIDUAL,
        req.query.id,
        null,
        null
      )
    }

    // ソーシャル認証の場合（NextAuth.jsのJWTトークンから）
    console.log("🔍 [AUTH] ソーシャル認証処理開始:", {
      nextauth_secret_exists: !!process.env.NEXTAUTH_SECRET,
      nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length,
      timestamp: new Date().toISOString()
    });
    
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    console.log("🔍 [AUTH] NextAuth.js トークン取得結果:", {
      token_exists: !!token,
      token_keys: token ? Object.keys(token) : null,
      token_data: token ? {
        provider: token.provider,
        googleId: token.googleId,
        lineId: token.lineId,
        sub: token.sub,
        id: token.id,
        email: token.email,
        name: token.name,
        exp: token.exp,
        iat: token.iat
      } : null,
      timestamp: new Date().toISOString()
    });
    
    if (!token) {
      const errorMessage = "認証が必要です";
      console.error("🔍 [AUTH] NextAuth.js トークン取得失敗:", {
        error_message: errorMessage,
        cookies_present: !!req.headers.cookie,
        cookie_content: req.headers.cookie?.split(';').map(c => c.trim()).filter(c => c.includes('next-auth') || c.includes('__Secure-') || c.includes('__Host-')),
        timestamp: new Date().toISOString()
      });
      throw new Error(errorMessage);
    }

    // プロバイダー判定
    const provider = token.provider || (token.googleId ? 'google' : 'line')
    
    // プロバイダー固有ID取得
    const providerId = token.googleId || token.lineId || token.sub || token.id

    console.log("🔍 [AUTH] プロバイダー情報処理:", {
      provider: provider,
      providerId: providerId,
      googleId: token.googleId,
      lineId: token.lineId,
      sub: token.sub,
      id: token.id,
      timestamp: new Date().toISOString()
    });

    if (!providerId) {
      const errorMessage = "プロバイダーIDが取得できません";
      console.error("🔍 [AUTH] プロバイダーID取得失敗:", {
        error_message: errorMessage,
        token_keys: Object.keys(token),
        token_data: token,
        timestamp: new Date().toISOString()
      });
      throw new Error(errorMessage);
    }

    const authContext = new AuthContext(
      provider,
      providerId,
      token.email || null,
      token.name || null
    );

    console.log("🔍 [AUTH] 認証コンテキスト作成成功:", {
      auth_type: authContext.type,
      user_id: authContext.userId,
      email: authContext.email,
      name: authContext.name,
      unified_user_id: authContext.getUnifiedUserId(),
      timestamp: new Date().toISOString()
    });

    return authContext;

  } catch (error) {
    const errorMessage = `認証コンテキストの取得に失敗しました: ${error.message}`;
    
    console.error("🔍 [AUTH] getAuthContext エラー:", {
      error_message: errorMessage,
      original_error: error.message,
      error_stack: error.stack,
      request_method: req.method,
      request_query: req.query,
      request_body: req.body,
      cookies_present: !!req.headers.cookie,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(errorMessage);
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