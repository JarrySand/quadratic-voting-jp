# 実験機能 使用ガイド

## 🎯 概要

投票実験のraw dataを取得するための最小限の機能のみを提供します。

---

## 📋 利用可能な機能

### 1. **投票データエクスポート**
```bash
# 投票データのエクスポート
curl -X GET "http://localhost:2000/api/experiment/export?event_id=EVENT_ID" \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "event_info": {
      "id": "event123",
      "title": "実験タイトル",
      "start_date": "2025-01-17T10:00:00Z",
      "end_date": "2025-01-17T16:00:00Z",
      "subjects": ["選択肢1", "選択肢2", "選択肢3"]
    },
    "raw_data": [
      {
        "user_id": "user123",
        "auth_type": "google",
        "vote_data": [10, 20, 30],
        "voted_at": "2025-01-17T11:00:00Z",
        "name": "参加者A",
        "seconds_from_start": 3600
      }
    ],
    "summary": {
      "total_participants": 1,
      "export_timestamp": "2025-01-17T12:00:00Z"
    }
  }
}
```

---

### 2. **手動バックアップ**
```bash
# 手動バックアップの作成
curl -X POST "http://localhost:2000/api/experiment/backup" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{
    "action": "create_manual",
    "event_id": "EVENT_ID",
    "phase": "実験開始時"
  }'
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "filename": "backup_event123_実験開始時_2025-01-17T12-00-00-000Z.json",
    "path": "/path/to/backups/backup_event123_実験開始時_2025-01-17T12-00-00-000Z.json",
    "size": 1024,
    "voter_count": 5,
    "created_at": "2025-01-17T12:00:00Z"
  }
}
```

---

### 3. **データ整合性チェック**
```bash
# データ整合性の確認
curl -X POST "http://localhost:2000/api/experiment/backup" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{
    "action": "verify_integrity",
    "event_id": "EVENT_ID"
  }'
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "event_id": "event123",
    "check_timestamp": "2025-01-17T12:00:00Z",
    "total_voters": 5,
    "issues_found": 0,
    "issues": [],
    "integrity_status": "OK"
  }
}
```

---

### 4. **バックアップリスト取得**
```bash
# バックアップファイルのリスト
curl -X GET "http://localhost:2000/api/experiment/backup" \
  -H "x-admin-key: YOUR_ADMIN_KEY"
```

---

## 🔧 設定

### 環境変数
```bash
# 実験管理者キー（必須）
EXPERIMENT_ADMIN_KEY=your_secret_admin_key
```

### バックアップファイル保存先
```
project_root/
└── backups/
    ├── backup_event123_manual_2025-01-17T12-00-00-000Z.json
    └── backup_event456_実験終了時_2025-01-17T16-00-00-000Z.json
```

---

## 📊 投票データ形式

### vote_data配列
```json
[10, 20, 30]  // 各選択肢への投票数
```

### 参加者データ
```json
{
  "user_id": "unique_user_id",
  "auth_type": "google|twitter|github",
  "vote_data": [10, 20, 30],
  "voted_at": "ISO8601_timestamp",
  "name": "参加者名",
  "seconds_from_start": 3600
}
```

---

## 🚨 重要な注意点

1. **管理者キーの設定**: `EXPERIMENT_ADMIN_KEY`環境変数の設定が必須
2. **バックアップ**: 重要なタイミングで手動バックアップを実行
3. **データ整合性**: 実験開始前・終了後にデータチェックを実行
4. **セキュリティ**: 基本的なレート制限（10分20回）が適用

---

## 📁 ファイル構成

```
pages/api/experiment/
├── export.js    # 投票データエクスポート
└── backup.js    # バックアップ・整合性チェック

lib/
└── security.js  # 基本セキュリティ機能
```

---

*作成日: 2025年1月17日*  
*対象: 投票実験 raw data取得* 