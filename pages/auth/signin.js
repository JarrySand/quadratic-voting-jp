import { getProviders, signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/router"
import Layout from "components/common/layout"
import Navigation from "components/common/navigation"

export default function SignIn({ providers }) {
  const [loading, setLoading] = useState(null)
  const router = useRouter()
  const { callbackUrl, event } = router.query

  const handleSocialSignIn = async (providerId) => {
    setLoading(providerId)
    
    // イベントIDを含むコールバックURLを設定
    const redirectUrl = event 
      ? `/vote?event=${event}`
      : callbackUrl || '/vote'
    
    await signIn(providerId, { 
      callbackUrl: redirectUrl
    })
  }

  return (
    <Layout>
      <Navigation
        history={{
          title: "ホーム",
          link: "/",
        }}
        title="ログイン"
      />

      <div className="signin">
        <div className="signin__container">
          <h1>ソーシャル認証でログイン</h1>
          <p>投票するにはGoogle、またはLINEアカウントでログインしてください。</p>
          <p>これにより、重複投票を防ぎ、公正な投票を実現します。</p>

          <div className="signin__providers">
            {Object.values(providers).map((provider) => (
              <div key={provider.name} className="signin__provider">
                {provider.name === 'Google' && (
                  <button
                    onClick={() => handleSocialSignIn('google')}
                    disabled={loading === 'google'}
                    className="signin__google-button"
                  >
                    {loading === 'google' ? (
                      "ログイン中..."
                    ) : (
                      <>
                        <img 
                          src="https://developers.google.com/identity/images/g-logo.png" 
                          alt="Google" 
                          width="20" 
                          height="20"
                        />
                        Googleでログイン
                      </>
                    )}
                  </button>
                )}
                
                {provider.name === 'LINE' && (
                  <button
                    onClick={() => handleSocialSignIn('line')}
                    disabled={loading === 'line'}
                    className="signin__line-button"
                  >
                    {loading === 'line' ? (
                      "ログイン中..."
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-3-8h1v4h-1v-4zm3 0h1v4h-1v-4zm3 0h1v4h-1v-4z"/>
                        </svg>
                        LINEでログイン
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="signin__info">
            <h3>プライバシーについて</h3>
            <ul>
              <li>ログイン時にGoogle、またはLINEアカウントの情報を取得します</li>
              <li>取得した情報は投票の重複防止にのみ使用されます</li>
              <li>個人情報は適切に保護され、第三者に共有されません</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signin {
          max-width: 500px;
          margin: 2rem auto;
          padding: 2rem;
        }

        .signin__container {
          text-align: center;
        }

        .signin h1 {
          color: #333;
          margin-bottom: 1rem;
        }

        .signin p {
          color: #666;
          margin-bottom: 1rem;
        }

        .signin__providers {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 300px;
          margin: 2rem auto;
        }

        .signin__provider {
          margin: 0;
        }

        .signin__google-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
        }

        .signin__line-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #00c300;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          width: 100%;
        }

        .signin__google-button:hover:not(:disabled) {
          background: #357ae8;
        }

        .signin__line-button:hover:not(:disabled) {
          background: #00a000;
        }

        .signin__google-button:disabled,
        .signin__line-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .signin__info {
          margin-top: 3rem;
          text-align: left;
          background: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
        }

        .signin__info h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .signin__info ul {
          color: #666;
          font-size: 14px;
        }

        .signin__info li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </Layout>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  // すでにログインしている場合はリダイレクト
  if (session) {
    const { event } = context.query
    const redirectUrl = event ? `/vote?event=${event}` : '/vote'
    
    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    }
  }

  const providers = await getProviders()

  return {
    props: {
      providers,
    },
  }
} 