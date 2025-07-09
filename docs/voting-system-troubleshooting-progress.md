# SNS認証投票システム トラブルシューティング進捗レポート

## 📅 **作業期間**: 2025年1月18日
## 👤 **担当**: AI Assistant  
## 🎯 **プロジェクト**: Quadratic Voting Tool - 本番環境問題解決

---

## 🔍 **問題の進化と現在の状況**

### **Phase 1: 初期問題 (解決済み)**
- **症状**: 401 Unauthorized エラー
- **原因**: NextAuth.js Cookie設定 + SWR credentials設定
- **解決**: Cookie設定とAPI credentials設定を修正

### **Phase 2: 現在の問題**
- **症状**: 500 Internal Server Error
- **原因**: Prisma → Supabase接続の特定クエリでの失敗
- **状況**: 認証は成功、基本的なDB接続は正常

---

## 🧪 **実施した診断テスト**

### **✅ 成功したテスト**
1. **認証状態**: `Session: authenticated, Social: true`
2. **基本DB接続**: `/api/test-db` → 正常動作
3. **ローカル環境**: 完全正常動作
4. **本番環境**: 簡単なクエリ (`SELECT 1`) → 成功

### **❌ 失敗するテスト**
1. **実際の投票API**: `/api/events/find` → 500エラー
2. **イベント詳細API**: `/api/events/details` → 500エラー  
3. **Prisma findUnique**: 実際のテーブルアクセスで失敗

---

## 🔍 **技術的分析**

### **エラーの詳細**
```
PrismaClientInitializationError: 
Invalid `prisma.events.findUnique()` invocation:
Can't reach database server at `aws-0-ap-northeast-1.pooler.supabase.com:5432`
```

### **重要な発見**
1. **認証処理**: 部分的に成功 (フロントエンドでは authenticated)
2. **Cookie送信**: 改善されている（Cookies検出パターン修正済み）
3. **データベース**: 基本接続は正常
4. **環境変数**: 設定に問題なし

---

## 🎯 **問題の範囲**

### **動作している機能**
- ✅ NextAuth.js認証フロー
- ✅ 基本的なデータベース接続
- ✅ 簡単なSQLクエリ実行
- ✅ ローカル環境の全機能

### **問題がある機能**
- ❌ 本番環境での実際のPrismaクエリ
- ❌ `events.findUnique()` 実行
- ❌ 投票データの取得・保存
- ❌ イベント詳細の取得

---

## 🔬 **技術的仮説**

### **仮説1: Prisma Connection Pool問題**
- **原因**: 本番環境でのPrismaクライアント初期化
- **症状**: 特定のクエリでのみ接続失敗
- **解決案**: Connection Pool設定の調整

### **仮説2: Supabase Connection Pooler制限**
- **原因**: `pooler.supabase.com` の接続制限
- **症状**: 複雑クエリでの接続タイムアウト
- **解決案**: Direct connection またはPool設定変更

### **仮説3: 環境依存のPrisma設定**
- **原因**: 本番環境でのPrismaクライアント設定
- **症状**: ローカルは正常、本番のみ失敗
- **解決案**: Prisma設定の本番環境最適化

---

## 🛠️ **提案する解決策**

### **Priority 1: Connection Pool設定**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

// または db/index.js
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})
```

### **Priority 2: Supabase Direct Connection**
```env
# DATABASE_URLを変更
postgresql://[user]:[password]@db.[ref].supabase.co:5432/postgres
# pooler.supabase.com → db.supabase.co
```

### **Priority 3: Prisma Client設定**
```javascript
// db/index.js
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

---

## 🧪 **次のテスト計画**

### **Step 1: Prisma詳細ログの有効化**
- Prismaクライアントでのクエリログを有効化
- 実際のSQL実行状況を確認

### **Step 2: Connection Pool設定の変更**
- Supabaseの直接接続を試行
- Pooler設定を調整

### **Step 3: 段階的クエリテスト**
- 簡単なクエリから複雑なクエリまで段階的にテスト
- 失敗する境界を特定

---

## 📊 **診断結果サマリー**

| コンポーネント | ローカル | 本番(基本) | 本番(実際) | 状態 |
|----------------|----------|------------|------------|------|
| 認証システム | ✅ | ✅ | ✅ | 解決済み |
| データベース接続 | ✅ | ✅ | ❌ | 部分的問題 |
| 簡単なクエリ | ✅ | ✅ | ✅ | 正常 |
| 実際のクエリ | ✅ | ❌ | ❌ | 要修正 |
| フロントエンド | ✅ | ✅ | ✅ | 正常 |

---

## 🔧 **即座に実行可能な対策**

### **1. DATABASE_URLの確認・変更**
```bash
# 現在（Pooler使用）
postgresql://[user]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# 変更案（Direct接続）
postgresql://[user]:[password]@db.[ref].supabase.co:5432/postgres
```

### **2. Prisma詳細ログの有効化**
```javascript
// db/index.js
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### **3. Connection timeout設定**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["relationJoins"]
}
```

---

## 🎯 **成功の判定基準**

### **完全解決の条件**
1. **投票URL**: `https://quadratic-voting-beryl.vercel.app/vote?event=ID` → 正常表示
2. **API応答**: `/api/events/find` → 200 OK
3. **データ取得**: 投票データの正常な取得・表示
4. **エラーログ**: Prisma関連エラーの解消

### **部分解決の条件**
1. **API応答**: 500エラー → 400エラー (より具体的なエラー)
2. **ログ出力**: 詳細なエラー内容の特定
3. **接続状況**: Connection poolの状態確認

---

## 📞 **次のアクションアイテム**

1. **DATABASE_URL変更**: Pooler → Direct接続
2. **Prismaログ有効化**: 詳細なクエリログを確認
3. **段階的テスト**: 簡単なクエリから実際のクエリまで
4. **Supabase設定確認**: Connection pool設定の確認

---

**最終更新**: 2025年1月18日 12:30 JST  
**ステータス**: 根本原因特定・解決策実行段階 🔧  
**優先度**: Critical - データベース接続問題の解決が必要 