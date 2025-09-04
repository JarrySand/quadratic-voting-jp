import Layout from "components/common/layout";
import Navigation from "components/common/navigation";
import { VoteInterface } from "components/vote/VoteInterface";
import { useVoteManager } from "lib/hooks/useVoteManager";
import { toggleDescription } from "lib/voteHelpers";
import { signIn } from "next-auth/react";
import styles from "styles/Vote.module.css";

function Vote({ query }) {
  // 統合されたフックで全ての投票機能を管理
  const {
    data,
    isLoading,
    isSocialVoting,
    votes,
    credits,
    makeVote,
    calculateShow,
    submitVotes,
    submitLoading,
    session,
    status,
  } = useVoteManager(query);

  // 読み込み中の場合
  if (isLoading) {
    return (
      <Layout>
        <Navigation
          history={{
            title: "ホーム",
            link: "/",
          }}
          title="投票"
          loginInfo={null}
        />
        <div className={styles.vote__loading}>
          <h1>読み込み中...</h1>
          <p>あなたの投票プロフィールを取得しています。少々お待ちください。</p>
        </div>
      </Layout>
    );
  }

  // 認証が必要で、まだ読み込み中の場合
  if (isSocialVoting && status === "loading") {
    return (
      <Layout>
        <Navigation
          history={{
            title: "ホーム",
            link: "/",
          }}
          title="投票"
          loginInfo={null}
        />
        <div className={styles.vote__loading}>
          <h1>読み込み中...</h1>
          <p>認証状態を確認しています...</p>
        </div>
      </Layout>
    );
  }

  // 認証が必要だが、未認証の場合
  if (isSocialVoting && status === "unauthenticated") {
    return (
      <Layout>
        <Navigation
          history={{
            title: "ホーム",
            link: "/",
          }}
          title="投票"
          loginInfo={null}
        />
        <div className={styles.vote__auth}>
          <h1>投票には認証が必要です</h1>
          <p>この投票に参加するには、認証を行ってください。</p>
          <button 
            className={styles.social__signin_button}
            onClick={() => signIn()}
          >
            認証して投票する
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation
        history={{
          title: "ホーム",
          link: "/",
        }}
        title="投票"
        loginInfo={null}
      />
      
      <VoteInterface
        data={data}
        votes={votes}
        credits={credits}
        makeVote={makeVote}
        calculateShow={calculateShow}
        toggleDescription={toggleDescription}
        submitVotes={submitVotes}
        submitLoading={submitLoading}
        isSocialVoting={isSocialVoting}
      />
    </Layout>
  );
}

// URLパラメータを取得
Vote.getInitialProps = ({ query }) => {
  return { query };
};

export default Vote;
