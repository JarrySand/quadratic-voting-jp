import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Navigation from "../common/navigation";
import RemainingCredits from "./credits";
import { VoteBallot } from "./VoteBallot";

/**
 * メインの投票インターフェースを管理するコンポーネント
 */
export const VoteInterface = ({
  data,
  votes,
  credits,
  makeVote,
  calculateShow,
  toggleDescription,
  submitVotes,
  submitLoading,
  isSocialVoting
}) => {
  const { data: session } = useSession();

  if (!data || !data.event_data) {
    return (
      <div className="vote__loading">
        <h1>読み込み中...</h1>
        <p>あなたの投票プロフィールを取得しています。少々お待ちください。</p>
      </div>
    );
  }

  return (
    <div className="vote">
      {/* ソーシャル投票の場合のヘッダー */}
      {isSocialVoting && session && (
        <div className="vote__header">
          <div className="vote__user-info">
            <span>ログイン中: {session.user.name}</span>
            <span>({session.user.email})</span>
          </div>
          <button 
            className="signout__button"
            onClick={() => signOut()}
          >
            ログアウト
          </button>
        </div>
      )}

      {/* 投票メイン部分 */}
      <div className="vote__info">
        <div className="event__summary">
          <h2>{data.event_data.event_title}</h2>
          <p>{data.event_data.event_description}</p>
          <Link href={`/event?id=${data.event_data.event_id}`}>
            イベント詳細を見る
          </Link>
        </div>



        {/* 投票選択肢 */}
        <VoteBallot
          data={data}
          votes={votes}
          makeVote={makeVote}
          calculateShow={calculateShow}
          toggleDescription={toggleDescription}
        />
      </div>

      {/* サイドバー：クレジット表示と投票送信 */}
      <div id="budget-container">
        <RemainingCredits
          creditsRemaining={credits}
          creditBalance={data.event_data.credits_per_voter}
        />
        
        <button
          className="submit__button"
          onClick={() => submitVotes(votes)}
          disabled={submitLoading || credits < 0}
        >
          {submitLoading ? "投票中..." : "投票を送信"}
        </button>
      </div>

      {/* 投票インターフェース用のスタイル */}
      <style jsx>{`
        .vote {
          text-align: center;
        }

        .vote__info {
          max-width: 660px;
          width: calc(100% - 40px);
          margin: 50px 0px;
          padding: 0px 20px;
          display: inline-block;
          position: relative;
        }

        #budget-container {
          padding: 1vw 2vw;
          position: sticky;
          top: 0;
          left: 0;
          z-index: 1;
          background: white;
        }

        .vote__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .vote__user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .signout__button {
          padding: 6px 12px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .signout__button:hover {
          background: #c82333;
        }

        .event__summary {
          display: inline-block;
          box-shadow: 0 0 35px rgba(127, 150, 174, 0.125);
          background-color: #fff;
          margin: 20px 0px !important;
          padding: 20px;
          box-sizing: border-box;
          border-radius: 8px;
        }

        .event__summary > h2 {
          color: #000;
          margin: 0 0 1rem 0;
        }

        .event__summary > a {
          display: inline-block;
          margin-top: 10px;
          padding: 12px 24px;
          background-color: #000;
          color: #edff38;
          text-decoration: none;
          border-radius: 5px;
          transition: 100ms ease-in-out;
        }

        .event__summary > a:hover {
          opacity: 0.8;
        }



        .submit__button {
          padding: 12px 0px;
          width: 100%;
          display: inline-block;
          border-radius: 5px;
          background-color: #000;
          color: #edff38;
          font-size: 16px;
          transition: 100ms ease-in-out;
          border: none;
          cursor: pointer;
          margin-top: 20px;
        }

        .submit__button:hover:not(:disabled) {
          opacity: 0.8;
        }

        .submit__button:disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
        }

        .vote__loading {
          text-align: center;
          padding: 3rem;
          margin: 50px auto 0px auto;
        }

        @media only screen and (min-width: 768px) {
          .vote {
            display: grid;
            grid-template-columns: 1fr auto;
          }

          .vote__info {
            grid-column: 1;
            margin: 50px 0 50px auto;
          }

          #budget-container {
            background: none;
            grid-column: 2;
            position: sticky;
            top: 0;
            height: 100vh;
            padding: 50px 2rem;
          }

          .vote__loading {
            margin: 50px auto 0px auto !important;
          }
        }
      `}</style>
    </div>
  );
}; 