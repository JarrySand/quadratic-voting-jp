# 🧪 実証実験ガイド

## 🎯 概要

RadicalxChange Quadratic Voting System を使用した大規模実証実験（1000名規模）の実施ガイドです。  
実験の準備から実施、データ収集、分析まで包括的にサポートします。

## 🚀 実証実験の特徴

### 対応規模
- **参加者数**: 1000名以上
- **同時接続**: 最大500名
- **データ処理**: リアルタイム投票・統計
- **実験期間**: 数時間から数日間

### 認証方式
- **個別投票**: 匿名参加（QRコード・URL）
- **Google認証**: Gmail アカウント
- **LINE認証**: LINE アカウント

## 📋 実験準備

### 1. 事前準備チェックリスト

#### 技術的準備
- [ ] サーバー環境の確認（メモリ8GB以上推奨）
- [ ] データベース接続の確認
- [ ] OAuth認証設定の確認
- [ ] 実験管理者キーの設定
- [ ] バックアップ保存先の確認

#### 実験設計
- [ ] 実験目的の明確化
- [ ] 参加者数の見積もり
- [ ] 投票選択肢の準備（最大50選択肢）
- [ ] 投票クレジット数の設定
- [ ] 実験期間の設定

### 2. 環境設定

#### 実験用環境変数
```env
# 実験管理者キー（必須）
EXPERIMENT_ADMIN_KEY=[YOUR-ADMIN-KEY-HERE]

# 実験サポート連絡先
EXPERIMENT_SUPPORT_EMAIL=support@your-domain.com

# データベース設定（実験用）
DATABASE_URL=postgresql://user:password@localhost:5432/experiment_db

# 実験用レート制限（緩和設定）
EXPERIMENT_RATE_LIMIT_ENABLED=true
EXPERIMENT_RATE_LIMIT_ATTEMPTS=20
EXPERIMENT_RATE_LIMIT_WINDOW=10
```

#### サーバー設定
```bash
# メモリ使用量の最適化
export NODE_OPTIONS="--max-old-space-size=8192"

# 実験用ポート設定
export PORT=2000
```

### 3. 実験イベントの作成

#### API経由での作成
```bash
curl -X POST "http://localhost:2000/api/events/create" \
  -H "Content-Type: application/json" \
  -d '{
    "event_title": "大規模実証実験 - 地域政策優先順位",
    "event_description": "1000名規模での政策優先順位決定実験",
    "num_voters": 1000,
    "credits_per_voter": 100,
    "start_event_date": "2024-03-01T09:00:00Z",
    "end_event_date": "2024-03-01T17:00:00Z",
    "voting_mode": "mixed",
    "subjects": [
      {
        "title": "教育環境の改善",
        "description": "小中学校の設備更新、教員増員",
        "url": "https://example.com/education"
      },
      {
        "title": "交通インフラの整備",
        "description": "道路改修、公共交通機関の充実",
        "url": "https://example.com/transport"
      },
      {
        "title": "医療体制の強化",
        "description": "病院・診療所の拡充、医師確保",
        "url": "https://example.com/healthcare"
      }
    ]
  }'
```

### 4. 参加者の招待

#### QRコードの生成
```bash
# イベント詳細ページでQRコードを自動生成
# 以下のURLを参加者に配布
https://your-domain.com/vote?event=EVENT_ID
```

#### 招待メール用テンプレート
```
件名: 【重要】大規模実証実験へのご参加について

○○様

この度は、RadicalxChange二次投票システムを使用した実証実験にご参加いただき、
ありがとうございます。

【実験概要】
・実験名: 地域政策優先順位決定実験
・日時: 2024年3月1日 9:00-17:00
・参加方法: 以下のURLにアクセスしてご投票ください

【投票URL】
https://your-domain.com/vote?event=EVENT_ID

【注意事項】
・投票は一度のみ可能です
・GoogleまたはLINEアカウントでの認証が必要です
・投票時間は約10-15分です

【サポート】
技術的な問題: support@your-domain.com
```

## 🔧 実験実施

### 1. 実験開始前の確認

#### システムチェック
```bash
# データベース接続確認
npm run db:check

# 認証システム確認
npm run auth:test

# 負荷テスト（推奨）
npm run load:test
```

#### 事前バックアップ
```bash
curl -X POST "http://localhost:2000/api/experiment/backup" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]" \
  -d '{
    "action": "create_manual",
    "event_id": "EVENT_ID",
    "phase": "実験開始前"
  }'
```

### 2. 実験中の監視

#### リアルタイム統計の確認
```bash
# 投票状況の確認
curl -X GET "http://localhost:2000/api/events/stats?event_id=EVENT_ID" \
  -H "Content-Type: application/json"
```

#### 参加者数の監視
```javascript
// 自動監視スクリプト例
setInterval(async () => {
  const response = await fetch(`/api/events/stats?event_id=${EVENT_ID}`);
  const data = await response.json();
  
  console.log(`参加者数: ${data.data.total_voters}`);
  console.log(`投票率: ${(data.data.total_voters / 1000 * 100).toFixed(1)}%`);
}, 30000); // 30秒ごとに確認
```

### 3. トラブルシューティング

#### よくある問題と対処法

##### 1. 接続エラー
```bash
# 症状: 参加者が「接続できません」と報告
# 対処: サーバー状態を確認
systemctl status your-app
docker logs your-container
```

##### 2. 認証エラー
```bash
# 症状: Google/LINE認証が失敗
# 対処: OAuth設定を確認
# 1. クライアントIDとシークレットの確認
# 2. リダイレクトURLの確認
# 3. 認証プロバイダーの状態確認
```

##### 3. 投票エラー
```bash
# 症状: 投票が送信できない
# 対処: レート制限とデータベースを確認
# 1. レート制限状況の確認
# 2. データベース接続の確認
# 3. 投票データの整合性確認
```

## 📊 データ収集・分析

### 1. 投票データのエクスポート

#### リアルタイムエクスポート
```bash
# JSON形式でのエクスポート
curl -X GET "http://localhost:2000/api/experiment/export?event_id=EVENT_ID&format=json" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]"

# CSV形式でのエクスポート
curl -X GET "http://localhost:2000/api/experiment/export?event_id=EVENT_ID&format=csv" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]"
```

#### エクスポートデータの構造
```json
{
  "event_info": {
    "id": "event123",
    "title": "地域政策優先順位決定実験",
    "start_date": "2024-03-01T09:00:00Z",
    "end_date": "2024-03-01T17:00:00Z",
    "total_participants": 847,
    "subjects": [
      "教育環境の改善",
      "交通インフラの整備",
      "医療体制の強化"
    ]
  },
  "raw_data": [
    {
      "user_id": "user_847291",
      "auth_type": "google",
      "vote_data": [45, 30, 25],
      "voted_at": "2024-03-01T10:30:00Z",
      "name": "参加者A",
      "seconds_from_start": 5400,
      "total_credits_used": 100
    }
  ],
  "summary": {
    "total_participants": 847,
    "completion_rate": 84.7,
    "average_voting_time": 12.3,
    "export_timestamp": "2024-03-01T17:30:00Z"
  }
}
```

### 2. 統計分析

#### 基本統計
```bash
# 投票結果の統計
curl -X GET "http://localhost:2000/api/events/stats?event_id=EVENT_ID&secret=[ADMIN-SECRET]" \
  -H "Content-Type: application/json"
```

#### 分析用データ処理
```python
# Python での分析例
import pandas as pd
import json

# エクスポートデータの読み込み
with open('experiment_data.json', 'r') as f:
    data = json.load(f)

# データフレームの作成
df = pd.DataFrame(data['raw_data'])

# 基本統計
print("参加者数:", len(df))
print("平均投票時間:", df['seconds_from_start'].mean() / 60, "分")
print("認証方式別内訳:")
print(df['auth_type'].value_counts())

# 投票分布の分析
vote_matrix = pd.DataFrame(df['vote_data'].tolist(), 
                          columns=data['event_info']['subjects'])
print("\n投票分布:")
print(vote_matrix.describe())
```

### 3. 実験後の処理

#### 最終バックアップ
```bash
curl -X POST "http://localhost:2000/api/experiment/backup" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]" \
  -d '{
    "action": "create_manual",
    "event_id": "EVENT_ID",
    "phase": "実験終了時"
  }'
```

#### データ整合性チェック
```bash
curl -X POST "http://localhost:2000/api/experiment/backup" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]" \
  -d '{
    "action": "verify_integrity",
    "event_id": "EVENT_ID"
  }'
```

## 🛡️ セキュリティとプライバシー

### 1. データ保護

#### 個人情報の取り扱い
- **最小限の情報のみ取得**: 投票に必要な情報のみ
- **匿名化**: 分析時には個人特定情報を除去
- **暗号化**: 保存データの暗号化

#### データ削除
```bash
# 実験終了後のデータ削除（必要に応じて）
curl -X DELETE "http://localhost:2000/api/experiment/cleanup" \
  -H "x-admin-key: [YOUR-ADMIN-KEY]" \
  -d '{
    "event_id": "EVENT_ID",
    "delete_type": "personal_data_only"
  }'
```

### 2. 実験倫理

#### 参加者への説明
- **実験目的の明確化**: 何のための実験かを明示
- **データ利用方針**: 収集データの用途説明
- **参加の任意性**: 参加は任意であることを明示
- **結果の共有**: 実験結果の共有方法を説明

## 📈 実験成果の活用

### 1. 結果レポート作成

#### 基本統計レポート
```markdown
# 実証実験結果レポート

## 実験概要
- 実験名: 地域政策優先順位決定実験
- 期間: 2024年3月1日 9:00-17:00
- 参加者: 847名（目標1000名の84.7%）

## 結果サマリー
- 最優先政策: 教育環境の改善（平均45ポイント）
- 平均投票時間: 12.3分
- 完了率: 84.7%

## 認証方式別参加状況
- Google認証: 456名（53.8%）
- LINE認証: 287名（33.9%）
- 個別投票: 104名（12.3%）
```

### 2. 学術論文・発表

#### 推奨分析項目
- **投票行動の分析**: 二次投票の特徴
- **認証方式の影響**: 認証方式による投票パターンの違い
- **システムの使いやすさ**: ユーザビリティ評価
- **大規模運用の知見**: 1000名規模での運用知見

## 🔧 運用支援

### 1. 技術サポート

#### サポート体制
- **実験前**: 環境設定・動作確認サポート
- **実験中**: リアルタイム監視・トラブル対応
- **実験後**: データ分析・レポート作成支援

#### 連絡先
- **GitHub Issues**: 技術的な問題・質問
- **Email**: 実験サポート専用メール

### 2. 継続的改善

#### フィードバック収集
```bash
# 参加者フィードバック収集API
curl -X POST "http://localhost:2000/api/experiment/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "EVENT_ID",
    "feedback_type": "usability",
    "rating": 4,
    "comment": "システムが使いやすかった"
  }'
```

## 📚 参考資料

### 1. 関連文献
- **二次投票理論**: RadicalxChange 公式文献
- **実験デザイン**: 社会実験の設計方法
- **データ分析**: 投票データの統計分析手法

### 2. 技術文書
- **セットアップガイド**: [setup-guide.md](setup-guide.md)
- **API リファレンス**: [api-reference.md](api-reference.md)
- **セキュリティガイド**: [../SECURITY.md](../SECURITY.md)

---

*この実証実験ガイドにより、RadicalxChange Quadratic Voting System を使用した大規模実証実験を安全かつ効果的に実施できます。  
実験の成功を心よりお祈りしています。* 