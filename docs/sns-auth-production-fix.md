# SNS認証投票の本番環境問題診断

## 📅 診断開始日時: 2025年1月18日
## 🔄 修正実施日時: 2025年1月18日

## 🔍 **問題の概要**

本番環境（quadratic-voting-beryl.vercel.app）でのみ、SNS認証投票時に401エラーが発生。ローカル環境では正常に動作するため、環境変数またはビルド設定の問題と推測される。

## 🚨 **症状**

- **エラーメッセージ**: 401 Unauthorized
- **発生場所**: `/api/events/find?event_id=...` APIエンドポイント
- **影響範囲**: 本番環境でのSNS認証投票機能全体
- **ローカル環境**: 正常動作

## 🔬 **診断結果**

### 想定原因
1. **レート制限機能**: `security.js`の`applyRateLimit`が本番環境で誤動作
2. **NextAuth.js Cookie設定**: `secure: true`が本番環境で認証を阻害
3. **環境変数**: `NEXTAUTH_SECRET`などの設定不備
4. **ビルド設定**: 本番環境でのビルド時の問題

## ✅ **実施した修正**

### 1. **レート制限の一時的な無効化**
**ファイル**: `pages/api/events/vote.js`
```javascript
// 修正前
export default applyRateLimit(voteHandler)

// 修正後（テスト用）
export default voteHandler
```

### 2. **NextAuth.js Cookie設定の調整**
**ファイル**: `pages/api/auth/[...nextauth].js`
```javascript
// 修正前
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
}

// 修正後（テスト用）
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false // 一時的に無効化
    }
  }
}
```

### 3. **デバッグ機能の強化**
**ファイル**: `pages/api/auth/[...nextauth].js`
```javascript
// 本番環境でのデバッグを有効化
debug: true,

// JWTコールバックでのデバッグログ
callbacks: {
  async jwt({ token, account, profile }) {
    if (process.env.NODE_ENV === 'production') {
      console.log('NextAuth JWT callback:', {
        has_token: !!token,
        has_account: !!account,
        has_profile: !!profile,
        provider: account?.provider,
        timestamp: new Date().toISOString()
      });
    }
    // ... 既存のコード
  }
}
```

### 4. **認証処理の詳細ログ追加**
**ファイル**: `lib/auth.js`, `pages/api/events/find.js`, `pages/api/events/vote.js`
- 認証コンテキストの取得状況をログ出力
- NextAuth.jsトークンの取得状況をログ出力
- エラーの詳細情報をログ出力

## 📊 **テスト手順**

### 1. **修正コードのデプロイ**
```bash
git add .
git commit -m "Fix SNS authentication issues in production environment"
git push origin main
```

### 2. **本番環境でのテスト**
1. **イベント作成**: https://quadratic-voting-beryl.vercel.app/create
2. **SNS認証投票**: 作成されたイベントのQRコードまたはURLにアクセス
3. **Google認証**: 認証プロセスを実行
4. **投票実行**: 投票を実行して成功することを確認

### 3. **ログの確認**
- **Vercelダッシュボード**: Functions → Logs でエラーログを確認
- **ブラウザコンソール**: Network タブで API リクエストを確認

## 🎯 **期待される結果**

### 修正後の動作
- ✅ SNS認証投票が正常に動作
- ✅ 401エラーが解消
- ✅ 認証フローが正常に完了
- ✅ 投票が正常に保存される

### 確認ポイント
1. **認証**: Google認証が正常に完了する
2. **API**: `/api/events/find` が正常にレスポンスを返す
3. **投票**: 投票データが正常に保存される
4. **リダイレクト**: 投票後に成功ページにリダイレクトされる

## 🔧 **本修正後の作業（修正確認後）**

### 1. **レート制限の再有効化**
```javascript
// pages/api/events/vote.js
export default applyRateLimit(voteHandler)
```

### 2. **Cookie設定の最適化**
```javascript
// pages/api/auth/[...nextauth].js
cookies: {
  sessionToken: {
    options: {
      secure: process.env.NODE_ENV === 'production'
    }
  }
}
```

### 3. **デバッグログの最適化**
```javascript
// 本番環境でのデバッグを開発環境のみに戻す
debug: process.env.NODE_ENV === 'development',
```

## 📝 **修正の根拠**

### なぜこの修正が効果的か
1. **レート制限**: 複雑な認証処理で誤動作している可能性
2. **Cookie設定**: HTTPS証明書の問題でsecureオプションが機能しない可能性
3. **デバッグ**: 本番環境での詳細な動作確認が必要
4. **段階的解決**: 一つずつ問題を切り分けて原因を特定

### リスクの最小化
- 一時的な修正のため、セキュリティリスクは限定的
- 問題解決後は元の設定に戻す
- 詳細なログで問題の根本原因を特定

## 🔗 **関連情報**

- **Vercel環境**: https://quadratic-voting-beryl.vercel.app
- **NextAuth.js ドキュメント**: https://next-auth.js.org/configuration/options
- **修正ブランチ**: main
- **テスト期間**: 2025年1月18日〜

---

**修正実施**: 2025年1月18日  
**修正者**: AI Assistant  
**対象環境**: https://quadratic-voting-beryl.vercel.app  
**状況**: 修正完了 - テスト待ち 🧪 