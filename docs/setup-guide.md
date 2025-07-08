# 📋 セットアップガイド

## 🎯 概要

RadicalxChange Quadratic Voting System のローカル開発環境を構築するための詳細なセットアップガイドです。

## 🔧 前提条件

### システム要件
- **Node.js**: 22.14.0 LTS 以上
- **PostgreSQL**: 12 以上
- **npm**: 9 以上
- **Git**: 2.0 以上

### 推奨環境
- **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **メモリ**: 8GB 以上
- **ストレージ**: 5GB 以上の空き容量

## 📦 インストール手順

### 1. プロジェクトの取得
```bash
# リポジトリをフォーク後、クローン
git clone https://github.com/YOUR_USERNAME/quadratic-voting.git
cd quadratic-voting
```

### 2. Node.js 環境の準備
```bash
# Node.js バージョン確認
node --version  # v22.14.0 以上

# npm バージョン確認
npm --version   # 9.0.0 以上

# 依存関係のインストール
npm install
```

### 3. PostgreSQL データベースの設定

#### macOS の場合
```bash
# Homebrew でインストール
brew install postgresql
brew services start postgresql

# データベース作成
createdb quadratic_voting
```

#### Ubuntu の場合
```bash
# PostgreSQL インストール
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 開始
sudo systemctl start postgresql
sudo systemctl enable postgresql

# データベース作成
sudo -u postgres createdb quadratic_voting
```

#### Windows の場合
1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)からインストーラーをダウンロード
2. インストーラーを実行してPostgreSQLをインストール
3. pgAdmin またはコマンドラインで `quadratic_voting` データベースを作成

### 4. 環境変数の設定

#### 基本設定
```bash
# 環境変数ファイルをコピー
cp .env.example .env

# .env ファイルを編集
# Windows: notepad .env
# macOS/Linux: nano .env
```

#### .env ファイルの内容
```env
# データベース設定
DATABASE_URL="postgresql://username:password@localhost:5432/quadratic_voting"

# NextAuth設定
NEXTAUTH_URL="http://localhost:2000"
NEXTAUTH_SECRET="[YOUR-STRONG-RANDOM-SECRET-HERE]"

# Google OAuth設定（必須）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="[YOUR-GOOGLE-CLIENT-SECRET]"

# LINE OAuth設定（オプション）
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="[YOUR-LINE-CLIENT-SECRET]"

# 環境設定
NODE_ENV="development"
```

### 5. OAuth認証の設定

#### Google OAuth の設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成または既存のプロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. 「認証情報を作成」→「OAuth 2.0 クライアント ID」を選択
5. アプリケーションタイプは「ウェブアプリケーション」を選択
6. 承認済みのリダイレクトURIに以下を追加：
   - `http://localhost:2000/api/auth/callback/google`
7. クライアントIDとシークレットを `.env` ファイルに設定

#### LINE OAuth の設定（オプション）
1. [LINE Developers Console](https://developers.line.biz/)にアクセス
2. 新しいプロバイダーとチャネルを作成
3. チャネル設定で以下を設定：
   - コールバックURL: `http://localhost:2000/api/auth/callback/line`
   - Webアプリケーションのスコープ: `profile openid email`
4. チャネルIDとシークレットを `.env` ファイルに設定

### 6. データベースの初期化

#### Prisma の設定
```bash
# Prisma クライアントを生成
npx prisma generate

# データベーススキーマをプッシュ
npx prisma db push

# データベースの状態を確認
npx prisma db seed
```

#### 手動でのスキーマ適用（代替方法）
```bash
# SQLファイルからスキーマを適用
psql -f prisma/schema.sql quadratic_voting
```

### 7. 開発サーバーの起動

```bash
# 開発サーバーを起動
npm run dev

# または特定のポートで起動
PORT=2000 npm run dev
```

アプリケーションは http://localhost:2000 で起動します。

## 🧪 動作確認

### 1. 基本機能の確認
- [ ] トップページが表示される
- [ ] イベント作成ページが表示される
- [ ] Google認証が動作する
- [ ] LINE認証が動作する（設定した場合）

### 2. 投票機能の確認
- [ ] 個別投票（匿名）が可能
- [ ] Google認証での投票が可能
- [ ] 投票結果が表示される
- [ ] 統計情報が表示される

### 3. テストの実行
```bash
# 全てのテストを実行
npm test

# 特定のテストを実行
npm test __tests__/api/events/unified-apis.test.js

# テストカバレッジを確認
npm run test:coverage
```

## 🐳 Docker を使用した環境構築

### Docker Compose の利用
```bash
# Docker コンテナをビルド・起動
docker-compose up -d

# データベースの初期化
docker-compose exec app npx prisma db push

# アプリケーションへのアクセス
# http://localhost:2000
```

### 個別の Docker コンテナ
```bash
# イメージをビルド
docker build . -t rxc_qv

# コンテナを起動
docker run -d \
  --env DATABASE_URL=postgresql://user:password@host:5432/db \
  -p 2000:2000 \
  rxc_qv
```

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. Node.js バージョンエラー
```bash
# エラー: Node.js バージョンが古い
# 解決: Node.js 22.14.0 LTS をインストール
nvm install 22.14.0
nvm use 22.14.0
```

#### 2. データベース接続エラー
```bash
# エラー: PostgreSQL に接続できない
# 解決: PostgreSQL の状態を確認
pg_ctl -D /usr/local/var/postgres status  # macOS
sudo systemctl status postgresql          # Ubuntu
```

#### 3. 認証エラー
```bash
# エラー: OAuth認証が失敗する
# 解決: 
# 1. リダイレクトURIが正しいか確認
# 2. クライアントIDとシークレットが正しいか確認
# 3. OAuth設定が有効になっているか確認
```

#### 4. ポート衝突
```bash
# エラー: ポート 2000 が使用中
# 解決: 異なるポートを使用
PORT=3000 npm run dev
```

### ログの確認
```bash
# 開発サーバーのログ
npm run dev

# データベースのログ
npx prisma db push --preview-feature
```

## 🚀 本番環境への展開

### 環境変数の設定
```env
# 本番環境用の設定
NODE_ENV="production"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="postgresql://user:password@prod-server:5432/db"
```

### ビルドとデプロイ
```bash
# プロダクションビルド
npm run build

# 本番サーバーでの起動
npm run start
```

## 📚 次のステップ

1. **実証実験ガイド**: [experiment-guide.md](experiment-guide.md)
2. **API リファレンス**: [api-reference.md](api-reference.md)
3. **コントリビューション**: [../CONTRIBUTING.md](../CONTRIBUTING.md)

## 📞 サポート

問題が発生した場合は、以下の方法でサポートを受けることができます：

- **GitHub Issues**: バグレポートや質問
- **GitHub Discussions**: 一般的な議論
- **CONTRIBUTING.md**: 貢献方法

---

*このセットアップガイドにより、RadicalxChange Quadratic Voting System の開発環境が構築できます。  
何か問題がございましたら、お気軽にお問い合わせください。* 