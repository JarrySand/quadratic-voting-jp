import Link from "next/link"
import { useRouter } from "next/router"
import Layout from "components/common/layout"
import Navigation from "components/common/navigation"

const errors = {
  Signin: 'サインインに失敗しました。',
  OAuthSignin: 'OAuthサインインに失敗しました。',
  OAuthCallback: 'OAuthコールバックエラーが発生しました。',
  OAuthCreateAccount: 'OAuthアカウント作成に失敗しました。',
  EmailCreateAccount: 'メールアカウント作成に失敗しました。',
  Callback: 'コールバックエラーが発生しました。',
  OAuthAccountNotLinked: 'このメールアドレスは別のアカウントで既に使用されています。',
  EmailSignin: 'メールサインインに失敗しました。',
  CredentialsSignin: '認証情報が正しくありません。',
  SessionRequired: 'この操作にはログインが必要です。',
  default: '認証エラーが発生しました。',
}

export default function ErrorPage() {
  const router = useRouter()
  const { error, event } = router.query

  const errorMessage = error && errors[error] ? errors[error] : errors.default

  return (
    <Layout>
      <Navigation
        history={{
          title: "ホーム",
          link: "/",
        }}
        title="エラー"
      />

      <div className="error">
        <div className="error__container">
          <h1>認証エラー</h1>
          <p className="error__message">{errorMessage}</p>
          
          <div className="error__actions">
            <Link href={event ? `/auth/signin?event=${event}` : "/auth/signin"}>
              再度ログインする
            </Link>
            <Link href="/">
              ホームに戻る
            </Link>
          </div>

          <div className="error__help">
            <h3>問題が解決しない場合</h3>
            <ul>
              <li>ブラウザのキャッシュとクッキーをクリアしてください</li>
              <li>別のブラウザまたはシークレットモードで試してください</li>
              <li>Googleアカウントに正常にログインできることを確認してください</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
        }

        .error__container {
          text-align: center;
        }

        .error h1 {
          color: #e74c3c;
          margin-bottom: 1rem;
        }

        .error__message {
          color: #666;
          font-size: 18px;
          margin-bottom: 2rem;
          background: #fee;
          padding: 1rem;
          border-radius: 4px;
          border-left: 4px solid #e74c3c;
        }

        .error__actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .error__actions a {
          display: inline-block;
          padding: 10px 20px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s;
        }

        .error__actions a:hover {
          background: #2980b9;
        }

        .error__help {
          text-align: left;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .error__help h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .error__help ul {
          color: #666;
          font-size: 14px;
        }

        .error__help li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </Layout>
  )
} 