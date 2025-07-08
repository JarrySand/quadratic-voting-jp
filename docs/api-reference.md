# 📡 API リファレンス

## 📋 概要

RadicalxChange Quadratic Voting System の API 仕様書です。  
このAPIは投票イベントの作成、投票、統計取得などの機能を提供します。

### ベースURL
```
http://localhost:2000/api
```

### 認証方式
- **個別投票**: UUID識別子
- **Google認証**: OAuth 2.0 + NextAuth.js
- **LINE認証**: LINE Login API + NextAuth.js

## 🗳️ Events API

### 1. イベント作成
**POST** `/api/events/create`

新しい投票イベントを作成します。

#### Request Body
```json
{
  "event_title": "サンプルイベント",
  "event_description": "イベントの説明文",
  "num_voters": 10,
  "credits_per_voter": 10,
  "start_event_date": "2024-01-01T00:00:00Z",
  "end_event_date": "2024-01-31T23:59:59Z",
  "voting_mode": "individual",
  "subjects": [
    {
      "title": "選択肢1",
      "description": "選択肢の説明",
      "url": "https://example.com"
    },
    {
      "title": "選択肢2",
      "description": "選択肢の説明",
      "url": "https://example.com"
    }
  ]
}
```

#### Response
```json
{
  "id": "event-uuid",
  "secret_key": "[ADMIN-SECRET-KEY]",
  "message": "イベントが正常に作成されました"
}
```

### 2. 投票送信
**POST** `/api/events/vote`

投票を送信または更新します。

#### Request Body
```json
{
  "event_id": "event-uuid",
  "votes": [
    {
      "title": "選択肢1",
      "votes": 3
    },
    {
      "title": "選択肢2",
      "votes": 2
    }
  ],
  "name": "投票者名（任意）"
}
```

#### Response
```json
{
  "success": true,
  "message": "投票を受け付けました",
  "data": {
    "action": "created",
    "voter_id": "voter-uuid",
    "total_credits_used": 5
  }
}
```

### 3. 投票検索
**GET** `/api/events/find`

既存の投票データを取得します。

#### Query Parameters
- `event_id`: イベントID（必須）
- `user_id`: ユーザーID（任意）

#### Response
```json
{
  "success": true,
  "data": {
    "voter_id": "voter-uuid",
    "event_id": "event-uuid",
    "vote_data": {
      "選択肢1": 3,
      "選択肢2": 2
    },
    "total_credits_used": 5,
    "voted_at": "2024-01-15T10:30:00Z"
  }
}
```

### 4. 投票統計
**GET** `/api/events/stats`

投票結果の統計を取得します。

#### Query Parameters
- `event_id`: イベントID（必須）
- `secret`: 管理者キー（統計詳細取得用）

#### Response
```json
{
  "success": true,
  "data": {
    "event_title": "サンプルイベント",
    "total_voters": 25,
    "total_votes": 150,
    "results": [
      {
        "title": "選択肢1",
        "votes": 75,
        "percentage": 50.0
      },
      {
        "title": "選択肢2",
        "votes": 75,
        "percentage": 50.0
      }
    ],
    "voter_breakdown": {
      "individual": 10,
      "google": 10,
      "line": 5
    }
  }
}
```

### 5. イベント存在確認
**GET** `/api/events/exists`

指定されたイベントが存在するかを確認します。

#### Query Parameters
- `event_id`: イベントID（必須）

#### Response
```json
{
  "success": true,
  "exists": true,
  "data": {
    "event_title": "サンプルイベント",
    "voting_mode": "individual",
    "is_active": true
  }
}
```

### 6. イベント詳細
**GET** `/api/events/details`

イベントの詳細情報を取得します。

#### Query Parameters
- `event_id`: イベントID（必須）
- `secret`: 管理者キー（任意）

#### Response
```json
{
  "success": true,
  "data": {
    "event_title": "サンプルイベント",
    "event_description": "イベントの説明文",
    "num_voters": 10,
    "credits_per_voter": 10,
    "start_event_date": "2024-01-01T00:00:00Z",
    "end_event_date": "2024-01-31T23:59:59Z",
    "voting_mode": "individual",
    "subjects": [
      {
        "title": "選択肢1",
        "description": "選択肢の説明",
        "url": "https://example.com"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 7. イベント更新
**PUT** `/api/events/update`

既存のイベントを更新します。

#### Request Body
```json
{
  "event_id": "event-uuid",
  "secret": "[ADMIN-SECRET-KEY]",
  "event_title": "更新されたタイトル",
  "event_description": "更新された説明",
  "subjects": [
    {
      "title": "更新された選択肢1",
      "description": "更新された説明",
      "url": "https://example.com"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "イベントが正常に更新されました",
  "data": {
    "event_id": "event-uuid",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## 🧪 Experiment API

### 1. データエクスポート
**GET** `/api/experiment/export`

実証実験用のデータをエクスポートします。

#### Query Parameters
- `event_id`: イベントID（必須）
- `admin_key`: 管理者キー（必須）
- `format`: 出力形式（`csv` または `json`）

#### Response
```json
{
  "success": true,
  "data": {
    "export_id": "export-uuid",
    "format": "csv",
    "download_url": "/api/experiment/download/export-uuid",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. データバックアップ
**POST** `/api/experiment/backup`

実証実験のデータをバックアップします。

#### Request Body
```json
{
  "event_id": "event-uuid",
  "admin_key": "[ADMIN-KEY]",
  "backup_type": "full"
}
```

#### Response
```json
{
  "success": true,
  "message": "バックアップが正常に作成されました",
  "data": {
    "backup_id": "backup-uuid",
    "size": "1.5MB",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## 🔐 Authentication API

### 1. Google認証
**GET** `/api/auth/signin/google`

Google OAuth認証を開始します。

#### Response
```
Location: https://accounts.google.com/oauth/authorize?...
```

### 2. LINE認証
**GET** `/api/auth/signin/line`

LINE OAuth認証を開始します。

#### Response
```
Location: https://access.line.me/oauth2/v2.1/authorize?...
```

### 3. セッション確認
**GET** `/api/auth/session`

現在のセッション情報を取得します。

#### Response
```json
{
  "user": {
    "id": "user-uuid",
    "name": "ユーザー名",
    "email": "user@example.com",
    "provider": "google"
  },
  "expires": "2024-01-15T10:30:00Z"
}
```

## 📝 エラーレスポンス

### エラー形式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "投票データが無効です",
    "details": {
      "field": "votes",
      "issue": "投票ポイントが不足しています"
    }
  }
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `VALIDATION_ERROR` | 入力データが無効 | 400 |
| `UNAUTHORIZED` | 認証が必要 | 401 |
| `FORBIDDEN` | アクセス権限なし | 403 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `DUPLICATE_VOTE` | 重複投票 | 409 |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 | 429 |
| `INTERNAL_SERVER_ERROR` | サーバーエラー | 500 |

## 🔄 レート制限

### 制限事項
- **投票API**: 10分間に20回まで
- **統計API**: 1分間に60回まで
- **認証API**: 1分間に10回まで

### レート制限ヘッダー
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1642248000
```

## 📊 使用例

### JavaScriptでの投票送信
```javascript
const response = await fetch('/api/events/vote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    event_id: 'your-event-id',
    votes: [
      { title: '選択肢1', votes: 3 },
      { title: '選択肢2', votes: 2 }
    ]
  })
});

const result = await response.json();
console.log(result);
```

### cURLでの統計取得
```bash
curl -X GET \
  "http://localhost:2000/api/events/stats?event_id=your-event-id" \
  -H "Content-Type: application/json"
```

## 🛡️ セキュリティ

### 認証要件
- **公開API**: 認証不要（exists, stats等）
- **投票API**: セッション認証または個別UUID
- **管理API**: 管理者キーが必要

### セキュリティ対策
- **CSRF保護**: NextAuth.jsによる自動対応
- **入力検証**: Joiスキーマによる検証
- **レート制限**: 不正使用防止
- **SQL注入対策**: Prisma ORM使用

---

*このAPIリファレンスにより、RadicalxChange Quadratic Voting System と安全に連携できます。  
詳細な実装については、ソースコードもご参照ください。* 