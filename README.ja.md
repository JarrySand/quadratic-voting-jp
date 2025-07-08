<h1 align="center" style="border-bottom: none;">RadicalxChange 二次投票システム</h1>
<h3 align="center">日本語化・認証機能強化・実証実験対応版（フォーク）</h3>
<p align="center">
  <em>🍴 <a href="https://github.com/RadicalxChange/quadratic-voting">RadicalxChange/quadratic-voting</a> からフォーク</em>
</p>

<p align="center">
  <strong>🌐 完全日本語化対応</strong><br>
  <strong>🔐 3つの認証方式（個別・Google・LINE）</strong><br>
  <strong>⚡ 最新技術スタック（Node.js 22, Next.js 14, Prisma 5.x）</strong><br>
  <strong>📊 13個の構造化コンポーネント</strong><br>
  <strong>🧪 1000名規模実証実験対応</strong>
</p>

> ⚠️ **重要**: このプロジェクトは非営利目的でのみ使用可能です（CC BY-NC 2.0）
> 
> 商用利用・営利企業での使用は禁止されています。

## ✨ 主要機能

- **📊 二次投票（Quadratic Voting）システム**: 民主的意思決定のための投票システム
- **🔐 複数認証方式**: 個別投票・Google認証・LINE認証
- **🌐 日本語完全対応**: 自然な日本語UI・専門用語統一
- **📱 リアルタイム投票**: SWRによる即座の結果反映
- **📈 統計・分析**: 投票結果の可視化・Excel出力
- **🛡️ セキュリティ強化**: 重複投票防止・セキュアUUID・レート制限
- **🧪 高いテストカバレッジ**: 60%テストカバレッジ・統合テスト実装
- **🏗️ 本番運用対応**: メモリリーク修正・1000名規模対応

## 🏗️ アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js 14.2.15 (React 18.3.1)
- **バックエンド**: Node.js 22.14.0 LTS
- **データベース**: PostgreSQL + Prisma 5.22.0
- **認証**: NextAuth.js 4.24.8
- **状態管理**: SWR 2.2.5
- **スタイル**: CSS Modules
- **テスト**: Jest (60%カバレッジ)

### コンポーネント構造（13個の構造化コンポーネント）
```
components/
├── common/           # 共通コンポーネント
│   ├── layout.js     # レイアウト
│   ├── navigation.js # ナビゲーション
│   └── loader.js     # ローディング
├── vote/             # 投票関連
│   ├── VoteInterface.js    # メインUI
│   ├── VoteBallot.js       # 投票選択肢
│   └── VoteAuthHandler.js  # 認証処理
├── create/           # イベント作成
│   ├── GlobalSettingsSection.js # 全体設定
│   └── SubjectManagement.js     # 選択肢管理
└── event/            # イベント管理
    ├── EventChart.js # チャート表示
    └── EventDates.js # 日付表示
```

### データベース設計
統合された`UnifiedVoters`テーブルで複数認証方式を統一管理：

```sql
-- 統合投票者テーブル
CREATE TABLE UnifiedVoters (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL,
  auth_type  TEXT NOT NULL, -- "individual" | "google" | "line"
  user_id    TEXT NOT NULL, -- 統一識別子
  email      TEXT,          -- LINE認証の場合はoptional
  name       TEXT,
  vote_data  JSONB,
  voted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(event_id, user_id)
);
```

## 🚀 ローカル開発環境

### 必要環境
- **Node.js**: 22.14.0 LTS以上
- **PostgreSQL**: 12以上
- **npm**: 9以上

### 1. データベース設定
```bash
# データベース作成
createdb quadratic_voting

# スキーマ適用
psql -f prisma/schema.sql quadratic_voting
```

### 2. 環境変数設定
```bash
# 環境変数ファイル作成
cp .env.example .env

# .envファイルを編集して以下を設定:
# - DATABASE_URL: PostgreSQL接続文字列
# - NEXTAUTH_URL: アプリケーションURL
# - NEXTAUTH_SECRET: JWT暗号化キー
# - GOOGLE_CLIENT_ID: Google OAuth設定
# - GOOGLE_CLIENT_SECRET: Google OAuth設定
# - LINE_CLIENT_ID: LINE OAuth設定（オプション）
# - LINE_CLIENT_SECRET: LINE OAuth設定（オプション）
```

### 3. アプリケーション起動
```bash
# 依存関係インストール
npm install

# Prisma設定
npx prisma generate
npx prisma db push

# 開発サーバー起動
npm run dev
```

アプリケーションは http://localhost:2000 で起動します。

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
npm test

# 特定テスト実行
npm test __tests__/api/events/unified-apis.test.js
npm test __tests__/lib/vote-calculations.test.js

# テストカバレッジ確認
npm run test:coverage
```

### テストカバレッジ
- **基本カバレッジ**: 60%
- **重要機能**: 100%カバレッジ
- **API統合テスト**: 実装済み
- **単体テスト**: 投票計算・認証・バリデーション

## 🔧 環境変数

`.env`ファイルを作成して以下を設定：

```env
# データベース設定
DATABASE_URL="postgresql://username:password@localhost:5432/quadratic_voting"

# NextAuth設定
NEXTAUTH_URL="http://localhost:2000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth設定（必須）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# LINE OAuth設定（オプション）
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"

# 環境設定
NODE_ENV="development"
```

### Google OAuth設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存を選択
3. Google+ APIを有効化
4. OAuth 2.0認証情報を作成
5. 認証リダイレクトURIに`http://localhost:2000/api/auth/callback/google`を追加
6. クライアントIDとシークレットを`.env`に設定

### LINE OAuth設定（オプション）
1. [LINE Developers Console](https://developers.line.biz/)にアクセス
2. 新しいプロバイダーとチャネルを作成
3. コールバックURL: `http://localhost:2000/api/auth/callback/line`を設定
4. クライアントIDとシークレットを`.env`に設定

## 🐳 Docker での実行

```bash
# コンテナビルド
docker build . -t rxc_qv

# 実行
docker run -d --env DATABASE_URL=postgresql://__USER__:__PASSWORD__@__HOST__/__DATABASE__ -p 2000:2000 rxc_qv
```

## 🌟 強化された機能

元のプロジェクトから大幅に改善されています：

### **品質改善**
- **コード削減**: 35%削減（2,315行→1,500行）
- **大規模ファイル削除**: 100%解決（3個→0個）
- **重複コード削除**: 170行削除（100%削除）
- **メモリリーク**: useEffectクリーンアップで完全修正
- **バンドルサイズ**: 11KB削減（axios削除）

### **セキュリティ強化**
- **セキュアUUID**: 予測可能IDからセキュア識別子に変更
- **レート制限**: 10分間に20回の試行制限
- **入力検証**: Joiスキーマによる包括的検証
- **CSRF保護**: 多層セキュリティ

### **実証実験対応**
- **規模対応**: 1000名以上の参加者実験対応
- **データエクスポート**: タイムスタンプ付きCSV/JSON形式
- **バックアップシステム**: 手動・自動バックアップ
- **負荷最適化**: 実験用2秒間隔更新

## 📚 ドキュメント

- **🇺🇸 English README**: [README.md](README.md)
- **🧪 実験機能ガイド**: [EXPERIMENT_USAGE.md](EXPERIMENT_USAGE.md)
- **🤝 貢献ガイド**: [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 ライセンス

このプロジェクトは [Creative Commons Attribution-NonCommercial 2.0 (CC BY-NC 2.0)](LICENSE) の下で公開されています。

### 使用条件
- ✅ **非営利目的での使用**: 研究・教育・個人利用
- ✅ **改変・再配布**: 著作者クレジット表示が必要
- ❌ **商用利用**: 営利目的での使用は禁止

### 対象用途
- 🎓 教育機関での授業・研究
- 🔬 学術研究・実証実験
- 🏛️ 非営利組織での意思決定
- 👥 コミュニティの合意形成

## 🙏 謝辞

このプロジェクトは元の [RadicalxChange Quadratic Voting](https://github.com/RadicalxChange/quadratic-voting) システムの**フォーク**です。この強化版を可能にしてくださった民主的革新の基盤を作成してくださったRadicalxChangeコミュニティに感謝いたします。

### 主要改善点
- 文化的適応を含む完全日本語化
- マルチプロバイダー認証システム（Google、LINE）
- 最新技術スタック移行（Node.js 22、Next.js 14、Prisma 5.x）
- 本番対応実証実験サポート（1000名以上対応）
- 包括的セキュリティ改善
- 60%テストカバレッジ・統合テスト実装

## 🤝 貢献方法

新規開発者の貢献を歓迎します！詳細については[貢献ガイドライン](CONTRIBUTING.md)をご確認ください。

### 貢献開始手順
1. **リポジトリをフォーク**
2. **フィーチャーブランチ作成**: `git checkout -b feature/amazing-feature`
3. **変更をコミット**: `git commit -m 'Add amazing feature'`
4. **ブランチにプッシュ**: `git push origin feature/amazing-feature`
5. **Pull Requestを作成**

### 開発ガイドライン
- 既存のコードスタイルと構造に従ってください
- 新機能にはテストを追加してください
- 必要に応じてドキュメントを更新してください
- プルリクエスト送信前に全テストが通ることを確認してください

## 🔗 関連リンク

- **元プロジェクト**: [RadicalxChange/quadratic-voting](https://github.com/RadicalxChange/quadratic-voting)
- **RadicalxChange**: [公式サイト](https://www.radicalxchange.org/)
- **ライブデモ**: [quadraticvote.radicalxchange.org](https://quadraticvote.radicalxchange.org/)

---

*英語ドキュメントと詳細なセットアップ手順については、[README.md](README.md)をご覧ください* 