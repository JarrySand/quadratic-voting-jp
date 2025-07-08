import rateLimit from 'express-rate-limit'
import Joi from 'joi'

// 実証実験用レート制限（緩和版）
export const voteRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分
  max: 20, // 実験参加者の利便性を考慮
  message: '投票試行が集中しています。しばらくお待ちください。',
  standardHeaders: true,
  legacyHeaders: false,
  // 実験用の識別子を使用
  keyGenerator: (req) => {
    const authContext = req.authContext || {}
    return authContext.getUnifiedUserId?.() || req.ip
  }
})

// 基本入力検証
export const experimentVoteSchema = Joi.object({
  event_id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(20).max(30).required(), // CUID形式（英数字、ハイフン、アンダースコア）に対応
  votes: Joi.array().items(
    Joi.number().integer().min(0).max(100)
  ).max(50).required(), // 実験では選択肢数制限
  name: Joi.string().max(100).optional(),
  id: Joi.string().uuid().optional() // 個別投票用の投票者ID（UUID形式）
})

// 入力検証ミドルウェア
export const validateVoteInput = (req, res, next) => {
  const { error } = experimentVoteSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      error: '入力データが無効です',
      details: error.details[0].message,
      support_contact: process.env.EXPERIMENT_SUPPORT_EMAIL
    })
  }
  next()
}

// 実験参加者向けエラーハンドラー
export const experimentErrorHandler = (error, req, res, next) => {
  const userFriendlyMessage = {
    VOTE_ALREADY_SUBMITTED: '既に投票が完了しています',
    INVALID_PARTICIPANT: '参加者IDが無効です。運営にお問い合わせください',
    SYSTEM_ERROR: 'システムエラーが発生しました。運営にご連絡ください'
  }
  
  // 実験運営者に通知（本番では実装）
  if (process.env.NODE_ENV === 'production') {
    console.error('Experiment Error:', {
      error: error.message,
      stack: error.stack,
      user: req.authContext?.getUnifiedUserId?.(),
      event_id: req.body?.event_id,
      timestamp: new Date().toISOString()
    })
  }
  
  res.status(400).json({
    error: userFriendlyMessage[error.code] || 'エラーが発生しました',
    support_contact: process.env.EXPERIMENT_SUPPORT_EMAIL || 'support@example.com'
  })
}

// レート制限用のNext.js API統合
export const applyRateLimit = (handler) => async (req, res) => {
  return new Promise((resolve, reject) => {
    voteRateLimit(req, res, (result) => {
      if (result instanceof Error) {
        return res.status(429).json({
          error: '投票試行が集中しています。しばらくお待ちください。',
          retry_after: Math.ceil(voteRateLimit.windowMs / 1000)
        })
      }
      return resolve(result)
    })
  }).then(() => handler(req, res))
} 