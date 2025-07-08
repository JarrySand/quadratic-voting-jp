import Link from "next/link"; // Dynamic links
import Layout from "components/common/layout"; // Layout wrapper
import Navigation from "components/common/navigation"; // Navigation component

function Failure({ query }) {
  // 投票モードを判定
  const isSocialVoting = !!query.event && !query.user;
  const isIndividualVoting = !!query.user && !!query.event;

  // ナビゲーション履歴を設定
  const navigationHistory = isSocialVoting 
    ? {
        title: "投票", 
        link: `/vote?event=${query.event}`
      }
    : {
        title: "投票",
        link: `/vote?user=${query.user}`
      };

  return (
    <Layout>
      {/* Navigation header */}
      <Navigation
        history={navigationHistory}
        title="投票失敗"
      />

      {/* Failure dialog */}
      <div className="failure">
        <h1>おっと！投票に失敗しました。</h1>
        <p>これは起こるべきではありません。後でもう一度お試しください！</p>

        {/* Return to voting - ソーシャル認証と個別投票の両方に対応 */}
        {isSocialVoting && (
          <Link href={`/vote?event=${query.event}`}>
            投票をやり直す
          </Link>
        )}
        
        {isIndividualVoting && (
          <Link href={`/vote?user=${query.user}`}>
            投票をやり直す
          </Link>
        )}

        {/* Redirect to event dashboard */}
        <Link href={`/event?id=${query.event}`}>
          イベントダッシュボードを見る
        </Link>
      </div>

      {/* Scoped styling */}
      <style jsx>{`
        .failure {
          max-width: 700px;
          width: calc(100% - 40px);
          padding: 50px 20px 0px 20px;
          margin: 0px auto;
        }

        .failure > h1 {
          font-size: 40px;
          color: #000;
          margin: 0px;
        }

        .failure > p {
          font-size: 18px;
          line-height: 150%;
          color: #80806b;
          margin-block-start: 0px;
        }

        .failure > a {
          max-width: 200px;
          width: calc(100% - 40px);
          margin: 10px 20px;
          padding: 12px 0px;
          border-radius: 5px;
          text-decoration: none;
          font-size: 18px;
          display: inline-block;
          text-decoration: none;
          transition: 100ms ease-in-out;
        }

        .failure > a:hover {
          opacity: 0.8;
        }

        .failure > a:nth-of-type(1) {
          background-color: #edff38;
          color: #000;
        }

        .failure > a:nth-of-type(2) {
          background-color: #000;
          color: #edff38;
        }
      `}</style>
    </Layout>
  );
}

// On initial page load:
Failure.getInitialProps = ({ query }) => {
  // Collect URL params
  return { query };
};

export default Failure;
