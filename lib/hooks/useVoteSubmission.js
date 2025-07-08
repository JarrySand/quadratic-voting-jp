import { useState } from "react";
import { useRouter } from "next/router";
import { useVoting } from "./useSWRApi";

/**
 * 投票送信処理を管理するカスタムフック
 * 
 * @param {Object} query - URLクエリパラメータ
 * @param {Object} session - NextAuth セッション情報
 * @param {Object} data - 投票データ
 * @returns {Object} 投票送信に関する状態と関数
 */
export const useVoteSubmission = (query, session, data) => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();
  const { submitVote } = useVoting(data?.event_id);

  // 投票モードを判定
  const isSocialVoting = !!query.event && !query.user;

  /**
   * 投票データを送信
   * @param {Array} votes - 投票配列
   * @param {string} name - 投票者名
   */
  const submitVotes = async (votes, name) => {
    setSubmitLoading(true);

    try {
      const voteData = isSocialVoting ? {
        event_id: query.event,
        votes: votes,
        name: session?.user?.name || ""
      } : {
        id: query.user,
        event_id: data.event_id, // 個別投票でもevent_idを送信
        votes: votes,
        name: name,
      };

      await submitVote(voteData);

      // 投票成功時のリダイレクト
      if (isSocialVoting) {
        router.push(`/success?event=${query.event}`);
      } else {
        router.push(`/success?event=${data.event_id}&user=${query.user}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("投票エラー:", error);
      }
      
      // 認証エラーの場合
      if (error.message.includes("401") && isSocialVoting) {
        router.push(`/auth/signin?event=${query.event}`);
        return;
      }
      
      // その他のエラー
      const eventParam = isSocialVoting ? query.event : data.event_id;
      const userParam = isSocialVoting ? "" : `&user=${query.user}`;
      router.push(`/failure?event=${eventParam}${userParam}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    submitLoading,
    submitVotes,
  };
}; 