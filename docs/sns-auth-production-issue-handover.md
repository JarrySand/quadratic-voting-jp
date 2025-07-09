# SNS認証投票 本番環境問題 引継ぎドキュメント

## 📅 **作業期間**: 2025年1月18日
## 👤 **担当**: AI Assistant
## 🎯 **プロジェクト**: Quadratic Voting Tool

---

## 📋 **現在の状況サマリー**

### ✅ **動作している機能**
- **個別URL投票**: 完全に動作
- **イベント作成**: SNS認証/個別投票両方で動作
- **ローカル環境**: 全機能正常動作

### 🚨 **問題が残っている機能**
- **SNS認証投票**: イベント作成後、投票URLアクセス時にエラーページにリダイレクト

---

## 🐛 **問題の詳細**

### **症状**
```
https://quadratic-voting-beryl.vercel.app/vote?event=EVENT_ID
```
上記URLにアクセスすると即座に：
```
https://quadratic-voting-beryl.vercel.app/place?error=true
```
にリダイレクトされる

### **エラーの流れ**
1. 投票ページ (`/vote`) にアクセス
2. `useVoteManager` フックが実行
3. `useApiData` が `/api/events/find?event_id=EVENT_ID` を呼び出し
4. **401 Unauthorized** エラーが発生
5. `isError = true` となり、エラーページにリダイレクト

### **根本原因**
**NextAuth.jsのセッションCookieが本番環境のAPI呼び出しに含まれていない**

- ローカル環境では正常動作（HTTPでsecure: falseでも問題ない）
- 本番環境（HTTPS）ではCookie送信に問題がある

---

## 🔍 **実施したデバッグ作業**

### **1. 環境変数確認**
- ✅ `NEXTAUTH_SECRET`: 44文字で正常設定
- ✅ `NEXTAUTH_URL`: https://quadratic-voting-beryl.vercel.app
- ✅ `GOOGLE_CLIENT_ID/SECRET`: 正常設定
- ✅ `DATABASE_URL`: 正常設定

### **2. デバッグ機能実装**
- **Debug API**: `/api/debug/env-check?token=debug-2025`
- **詳細ログ**: `lib/auth.js`, `pages/api/events/find.js`
- **デバッグモード**: `?debug=true` パラメータ

### **3. Cookie設定修正試行**
```javascript
// NextAuth.js Cookie設定
cookies: {
  sessionToken: {
    options: {
      secure: process.env.NODE_ENV === 'production',
      domain: '.vercel.app', // ドメイン設定追加
      sameSite: 'lax'
    }
  }
}
```

### **4. SWR Credentials設定修正試行**
```javascript
// 認証が必要なAPIのみCredentials追加
const fetcher = async (url) => {
  const fetchOptions = requiresAuth(url) ? 
    { credentials: 'include' } : {};
  // ...
}
```

---

## 📂 **バックアップ状況**

### **リポジトリ状態**
- **メインブランチ**: 安定動作版 (`ee7a62a` - 個別投票修正後)
- **バックアップブランチ**: `debug-attempts-backup` (全デバッグ試行保存)

### **バックアップブランチ内容**
以下のコミットが含まれます：
```
8a6494d - Fix API credentials to be selective based on authentication requirements
16ebca7 - Fix SNS authentication in production by including credentials in API calls  
527c974 - Fix cookie settings for production HTTPS environment
3ad58d3 - Add debugging functionality for SNS authentication issue
369fe3e - Fix SNS authentication issues in production environment
```

---

## 🛠️ **推奨解決アプローチ**

### **Priority 1: Cookie送信問題の解決**

#### **A. NextAuth.js設定の調整**
```javascript
// pages/api/auth/[...nextauth].js
export default NextAuth({
  // ...
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true, // 本番環境ではtrue
        domain: undefined // ドメイン指定を削除してテスト
      }
    }
  },
  // ...
})
```

#### **B. SWR Fetch設定の修正**
```javascript
// lib/hooks/useSWRApi.js
const fetcher = async (url) => {
  const res = await fetch(url, {
    credentials: 'include', // 認証必要APIのみ
    headers: {
      'Content-Type': 'application/json',
    }
  });
  // ...
}
```

### **Priority 2: 段階的テスト**

#### **テスト手順**
1. **ブラウザ開発者ツールで確認**
   ```
   Application > Cookies > https://quadratic-voting-beryl.vercel.app
   ```
   - `next-auth.session-token` の存在確認
   - Cookie属性（secure, sameSite, domain）の確認

2. **Network タブで確認**
   ```
   /api/events/find リクエスト
   ```
   - `Cookie` ヘッダーの送信状況確認
   - レスポンスステータス確認

3. **段階的修正**
   - NextAuth.js設定のみ修正 → テスト
   - SWR設定のみ修正 → テスト
   - 両方修正 → テスト

---

## 📋 **技術仕様**

### **関連ファイル**
```
pages/api/auth/[...nextauth].js     # NextAuth.js設定
lib/hooks/useSWRApi.js              # SWR API呼び出し
lib/hooks/useVoteManager.js         # 投票管理フック
pages/api/events/find.js            # Find API (エラー発生箇所)
lib/auth.js                         # 認証コンテキスト処理
```

### **テクノロジースタック**
- **Next.js**: 14.2.15
- **NextAuth.js**: 4.24.11
- **SWR**: 2.2.5
- **Prisma**: 5.22.0
- **デプロイ**: Vercel

### **認証フロー**
```
1. Google OAuth → 2. NextAuth.js JWT → 3. Session Cookie
4. SWR API呼び出し → 5. Cookie送信 → 6. getAuthContext()
7. トークン検証 → 8. データベースアクセス
```

---

## 🔧 **即座に試行可能な解決案**

### **Option 1: 最小限の修正**
`debug-attempts-backup` ブランチから以下のファイルのみを適用：
- `lib/hooks/useSWRApi.js` (Credentials設定部分のみ)

### **Option 2: NextAuth.js設定のみ修正**
- Cookie domain設定を削除
- secure設定を調整

### **Option 3: 段階的復旧**
1. バックアップブランチから1つずつコミットを適用
2. 各段階でテスト実行
3. 問題が発生した箇所で停止・分析

---

## 📞 **連絡事項**

### **現在の制限事項**
- SNS認証投票は使用不可
- 個別投票機能は完全動作
- イベント作成機能は完全動作

### **緊急回避策**
SNS認証が必要な場合：
1. 個別投票モードでイベントを作成
2. 投票者にURLを個別配布

### **参考リソース**
- [NextAuth.js Cookie設定](https://next-auth.js.org/configuration/options#cookies)
- [Vercel HTTPS環境での注意点](https://vercel.com/docs/concepts/edge-network/cookies)
- [SWR Credentials設定](https://swr.vercel.app/docs/api#options)

---

**最終更新**: 2025年1月18日 10:23 JST  
**ステータス**: 調査・修正継続中 🔍  
**優先度**: High - SNS認証投票は主要機能のため 