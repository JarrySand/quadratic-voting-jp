import Link from "next/link";
import ProposalBlocks from "./proposalBlocks";

/**
 * 投票選択肢の表示と操作を担当するコンポーネント
 */
export const VoteBallot = ({
  data,
  votes,
  makeVote,
  calculateShow,
  toggleDescription
}) => {
  if (!data || !data.event_data || !data.event_data.options) {
    return (
      <div className="ballot__loading">
        <p>投票選択肢を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="ballot_container">
      <div className="event__options">
        {data.event_data.options.map((option, i) => {
          return (
            <div key={i} className="event__option_item">
              <div className="event__option_item_info">
                <div className="title-container">
                  <label>選択肢 {i + 1}</label>
                  <h3>{option.title}</h3>
                </div>
                
                {/* 説明文の表示・非表示切り替え */}
                {option.description && (
                  <div className="description-toggle">
                    <button
                      className="description-toggle-button"
                      onClick={() => toggleDescription(i)}
                    >
                      説明を表示
                      <img
                        id={`toggle-button-${i}`}
                        src="/vectors/down_arrow.svg"
                        alt="down arrow"
                      />
                    </button>
                    <div
                      id={`description-container-${i}`}
                      className="event__option_item_desc"
                      style={{ display: "none" }}
                    >
                      {option.description}
                    </div>
                  </div>
                )}

                {/* リンクがある場合の表示 */}
                {option.url && (
                  <div
                    id={`link-container-${i}`}
                    className="option-link"
                    style={{ display: "none" }}
                  >
                    <Link 
                      href={option.url}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      詳細を見る
                    </Link>
                  </div>
                )}
              </div>

              {/* 投票部分 */}
              <div className="event__option_item_vote">
                <input
                  type="number"
                  value={votes[i] || 0}
                  readOnly
                  className="vote-input"
                />
                
                {/* 投票数に応じたクレジット表示 */}
                <span className="item__vote_credits">
                  {(votes[i] || 0) * (votes[i] || 0)} クレジット
                </span>

                {/* 投票量のビジュアル化 */}
                {votes[i] > 0 && (
                  <ProposalBlocks cost={(votes[i] || 0) * (votes[i] || 0)} />
                )}

                {/* 投票ボタン */}
                <div className="item__vote_buttons">
                  {calculateShow(votes[i] || 0, false) ? (
                    <button
                      name="input-element"
                      onClick={() => makeVote(i, false)}
                      className="vote-button vote-button--decrease"
                    >
                      -
                    </button>
                  ) : (
                    <button
                      className="button__disabled"
                      disabled
                    >
                      -
                    </button>
                  )}
                  
                  {calculateShow(votes[i] || 0, true) ? (
                    <button
                      name="input-element"
                      onClick={() => makeVote(i, true)}
                      className="vote-button vote-button--increase"
                    >
                      +
                    </button>
                  ) : (
                    <button
                      className="button__disabled"
                      disabled
                    >
                      +
                    </button>
                  )}
                </div>

                {/* 以前の投票記録がある場合の表示 */}
                {data.voter_name !== "" && data.voter_name !== null && data.vote_data[i] ? (
                  <div className="existing__votes">
                    <span>
                      この選択肢に{" "}
                      <strong>{data.vote_data[i].votes || 0} 票</strong>{" "}
                      を最後に配分しました。
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* 投票選択肢用のスタイル */}
      <style jsx>{`
        .ballot_container {
          width: 100%;
          margin: 20px 0;
        }

        .ballot__loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .event__options {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .event__option_item {
          box-shadow: 0 0 35px rgba(127, 150, 174, 0.125);
          background-color: #fff;
          border-radius: 8px;
          overflow: hidden;
        }

        .event__option_item_info {
          padding: 20px;
        }

        .title-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }

        .title-container > label {
          text-transform: uppercase;
          font-size: 14px;
          font-weight: bold;
          color: #666;
          text-align: left;
        }

        .title-container > h3 {
          margin: 0;
          font-size: 18px;
          color: #000;
          text-align: left;
        }

        .description-toggle {
          margin: 10px 0;
        }

        .description-toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: 1px solid #ddd;
          padding: 8px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .description-toggle-button:hover {
          background-color: #f5f5f5;
        }

        .description-toggle-button img {
          width: 12px;
          height: 12px;
        }

        .event__option_item_desc {
          white-space: pre-wrap;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
          margin-top: 10px;
          font-size: 14px;
          line-height: 1.5;
        }

        .option-link {
          margin-top: 10px;
        }

        .option-link a {
          color: #0066cc;
          text-decoration: none;
          font-size: 14px;
        }

        .option-link a:hover {
          text-decoration: underline;
        }

        .event__option_item_vote {
          border-top: 2px solid #e7eaf3;
          padding: 15px 20px;
          background-color: #f8f9fa;
        }

        .vote-input {
          width: calc(100% - 10px);
          font-size: 18px;
          border-radius: 5px;
          border: 1px solid #f1f2e5;
          padding: 10px 5px;
          background-color: #fff;
          text-align: center;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .item__vote_credits {
          color: #80806b;
          font-size: 14px;
          text-align: right;
          display: block;
          margin-bottom: 10px;
        }

        .item__vote_buttons {
          display: flex;
          gap: 2%;
        }

        .vote-button {
          width: 49%;
          font-size: 22px;
          font-weight: bold;
          border-radius: 5px;
          border: none;
          transition: 50ms ease-in-out;
          padding: 8px 0px;
          cursor: pointer;
        }

        .vote-button--decrease {
          background-color: #edff38;
          color: #000;
        }

        .vote-button--increase {
          background-color: #000;
          color: #edff38;
        }

        .vote-button:hover {
          opacity: 0.8;
        }

        .button__disabled {
          width: 49%;
          font-size: 22px;
          font-weight: bold;
          border-radius: 5px;
          border: none;
          padding: 8px 0px;
          background-color: #f1f2e5 !important;
          color: #000 !important;
          cursor: not-allowed !important;
        }

        .existing__votes {
          background-color: #ffffe0;
          padding: 7.5px 10px;
          border-radius: 5px;
          text-align: center;
          border: 1px solid #fada5e;
          margin-top: 10px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}; 