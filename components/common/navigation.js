import Link from "next/link"; // Dynamic links

export default function Navigation(props) {
  return (
    // Navigation bar
    <div 
      className="navigation"
      style={{
        backgroundColor: '#edff38',
        fontSize: '16px',
        padding: '0px 20px',
        height: '44px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}
    >
      {/* Navigation title and history */}
      <Link 
        href={props.history.link}
        style={{
          textDecoration: 'none',
          color: '#000',
          borderBottom: '1px solid #0f0857',
          fontWeight: '500',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          height: '44px',
          margin: '0',
          padding: '0'
        }}
      >
        ⟵ {props.history.title}に戻る
      </Link>
      <span
        style={{
          fontWeight: 'bold',
          color: '#000',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          height: '44px',
          margin: '0',
          padding: '0'
        }}
      >
        {props.title}
      </span>
      
      {/* Login info section */}
      <div
        className="login-info"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '44px',
          fontSize: '14px',
          gap: '10px'
        }}
      >
        {props.loginInfo && (
          <>
            <span style={{ color: '#000' }}>
              {props.loginInfo.email}
            </span>
            <button
              onClick={props.loginInfo.onLogout}
              style={{
                backgroundColor: '#0f0857',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                height: '24px'
              }}
            >
              ログアウト
            </button>
          </>
        )}
      </div>

      {/* Scoped styling */}
      <style jsx>{`
        .navigation {
          background-color: #edff38;
          font-size: 16px;
          padding: 0px 20px !important;
          height: 44px !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          box-sizing: border-box !important;
          min-height: 44px !important;
        }
        .navigation > a {
          text-decoration: none;
          color: #000;
          border-bottom: 1px solid #0f0857;
          transition: 50ms ease-in-out;
          font-weight: 500;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 44px !important;
          min-height: 44px !important;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: middle !important;
        }
        .navigation > a:hover {
          opacity: 0.8;
        }
        .navigation > span {
          font-weight: bold;
          color: #000;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 44px !important;
          min-height: 44px !important;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: middle !important;
        }
        .login-info {
          display: flex !important;
          align-items: center !important;
          height: 44px !important;
          font-size: 14px !important;
          gap: 10px !important;
        }
        .login-info button {
          transition: 50ms ease-in-out;
        }
        .login-info button:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
