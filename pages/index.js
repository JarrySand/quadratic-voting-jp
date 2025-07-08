import Link from "next/link"; // Dynamic links
import Layout from "components/common/layout"; // Layout wrapper

export default function Home() {
  return (
    // Home page
    <Layout>
      <div className="home">
        {/* Home heading */}
        <div className="home__content">
          <h1>QV System</h1>
          <h2>二次投票システム（日本語化・認証機能強化版）</h2>
          <p>
            二次投票は、民主的なコミュニティにおいて数学的に最適な投票方法です。
            選好の<i>方向性</i>だけでなく、<i>程度</i>を表現する投票の配分により、
            集合的意思決定を通じて投票しましょう。
          </p>
          <h2>二次投票イベントを開催しましょう！</h2>
        </div>

        {/* Home buttons */}
        <div className="home__cta">
          <div className="home__cta_button">
            <img src="/vectors/create_event.svg" alt="イベント作成" />
            <h2>イベントを作成</h2>
            <p>あなたのイベントで二次投票を設定しましょう。</p>
            <Link href="/create">
              イベント設定
            </Link>
          </div>
          <div className="home__cta_button">
            <img src="/vectors/place_vote.svg" alt="投票する" />
            <h2>投票する</h2>
            <p>秘密コードを使用して投票してください。</p>
            <Link href="/place">
              投票画面へ
            </Link>
          </div>
        </div>

        {/* Scoped styling */}
        <style jsx>{`
          .home__content {
            max-width: 700px;
            padding: 50px 20px 0px 20px;
            margin: 0px auto;
          }
          .home__content > h1 {
            font-size: 40px;
            color: #000;
            margin: 0px;
          }
          .home__content > h2 {
            color: #000;
            margin-block-start: 0px;
          }
          .home__content > h2:nth-of-type(2) {
            color: #000;
            margin-block-end: 0px;
            margin-block-start: 60px;
          }
          .home__content > p {
            font-size: 18px;
            line-height: 150%;
            color: #80806b;
          }
          .home__cta {
            padding-top: 20px;
          }
          .home__cta_button {
            display: inline-block;
            max-width: 270px;
            width: calc(100% - 70px);
            background-color: #fff;
            margin: 20px;
            border-radius: 16px;
            border: 1px solid #f1f2e5;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.125);
            padding: 15px;
            vertical-align: top;
          }
          .home__cta_button > img {
            height: 90px;
            margin-top: 15px;
          }
          .home__cta_button > h2 {
            color: #000;
            margin-block-end: 0px;
          }
          .home__cta_button > p {
            color: #80806b;
            font-size: 15px;
            margin-block-start: 5px;
            margin-block-end: 40px;
          }
          .home__cta_button > a {
            text-decoration: none;
            padding: 12px 0px;
            width: 100%;
            display: inline-block;
            border-radius: 16px;
            background-color: #000;
            color: #edff38;
            font-size: 18px;
            transition: 50ms ease-in-out;
          }
          .home__cta_button > a:hover {
            opacity: 0.8;
          }
        `}</style>
      </div>
    </Layout>
  );
}
