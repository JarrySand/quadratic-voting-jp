# 個別投票URL問題の解決

## 📅 解決日時: 2025年1月18日

## 🔍 **問題の概要**

個別投票用のURLアクセス時に `"id" is not allowed` エラーが発生し、投票が失敗していた問題が発生していました。

## 🚨 **エラー内容**

```
投票に失敗しました: 入力データが無効です: "id" is not allowed
```

### エラーの発生箇所
- **URL**: `/failure?event=cmcuk2so2000cbolfzqamx7pn&user=6d0ba2bb-fa63-4ec5-a303-bd7b827b158f&error=...`
- **API**: `/api/events/vote`
- **HTTP Status**: 400 Bad Request

## 🔬 **根本原因の分析**

### 1. システムの動作フロー
1. **フロントエンド**: 個別投票用に `id` フィールドを含むリクエストを送信
2. **`lib/auth.js`**: `req.body.id` から個別投票者を認証
3. **`lib/security.js`**: バリデーションでリクエストを検証
4. **問題**: `experimentVoteSchema` で `id` フィールドが許可されていない

### 2. コードの不整合
```javascript
// lib/auth.js - 個別投票の認証処理
if (req.body && req.body.id) {
  return new AuthContext(
    AuthType.INDIVIDUAL,
    req.body.id,  // ← idフィールドを期待
    null,
    req.body.name || null
  )
}

// lib/security.js - バリデーションスキーマ（修正前）
export const experimentVoteSchema = Joi.object({
  event_id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(20).max(30).required(),
  votes: Joi.array().items(
    Joi.number().integer().min(0).max(100)
  ).max(50).required(),
  name: Joi.string().max(100).optional()
  // id フィールドが定義されていない！
})
```

## ✅ **解決策**

### 修正内容
`lib/security.js` の `experimentVoteSchema` に個別投票用の `id` フィールドを追加：

```javascript
export const experimentVoteSchema = Joi.object({
  event_id: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).min(20).max(30).required(),
  votes: Joi.array().items(
    Joi.number().integer().min(0).max(100)
  ).max(50).required(),
  name: Joi.string().max(100).optional(),
  id: Joi.string().uuid().optional() // ← 追加: 個別投票用の投票者ID（UUID形式）
})
```

### 修正のポイント
- **`uuid()` 検証**: 投票者IDはUUID形式でセキュリティを確保
- **`optional()`**: 個別投票でのみ使用されるため、オプション設定
- **後方互換性**: ソーシャル認証投票には影響しない

## 🧪 **テスト結果**

### 修正前
```
❌ 個別投票: "id" is not allowed エラー
✅ ソーシャル認証: 正常動作
```

### 修正後
```
✅ 個別投票: 正常動作
✅ ソーシャル認証: 正常動作
```

## 📊 **技術的詳細**

### 関連ファイル
- **`lib/security.js`**: バリデーションスキーマ（修正対象）
- **`lib/auth.js`**: 認証コンテキスト処理
- **`pages/api/events/vote.js`**: 投票API

### 投票フロー
1. **個別投票URL**: `/vote?event=EVENT_ID&id=VOTER_ID`
2. **リクエスト**: `{ event_id, votes, name?, id? }`
3. **認証**: `AuthContext` で投票者を識別
4. **検証**: `experimentVoteSchema` で入力検証
5. **保存**: `UnifiedVoters` テーブルに投票データを保存

## 🎯 **今後の対策**

### 1. 統一的なバリデーション
- 認証処理とバリデーションスキーマの整合性を保つ
- 新しいフィールド追加時は両方の更新を確認

### 2. テストの強化
- 個別投票とソーシャル認証の両方をカバーするテストを実装
- エンドツーエンドテストでユーザーフローを検証

### 3. エラーハンドリングの改善
- より具体的なエラーメッセージの提供
- 開発者向けのデバッグ情報の充実

## 📝 **コミット履歴**

1. **修正コミット**: `Fix individual voting validation: Add optional id field to experimentVoteSchema`
2. **クリーンアップ**: `Remove debug and test files after fixing voting issue`

## 🔗 **参考情報**

- **GitHub Repository**: https://github.com/JarrySand/quadratic-voting-jp
- **個別投票**: UUID形式の投票者IDを使用
- **ソーシャル認証**: NextAuth.js を使用したGoogle/LINE認証

---

**解決日**: 2025年1月18日  
**修正者**: AI Assistant  
**影響範囲**: 個別投票機能全般  
**テスト状況**: ✅ 動作確認済み 