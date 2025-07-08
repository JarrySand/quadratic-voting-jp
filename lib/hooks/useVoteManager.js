import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useApiData, useVoting } from "./useSWRApi";

/**
 * 投票機能を統合管理するカスタムフック
 * create.js/event.jsの構造に合わせて、必要最小限の状態管理を行う
 * 
 * @param {Object} query - URLクエリパラメータ
 * @returns {Object} 投票機能に関する状態と関数
 */
export const useVoteManager = (query) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // 投票状態管理
  const [votes, setVotes] = useState([]);
  const [credits, setCredits] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 投票モード判定
  const isSocialVoting = !!query.event && !query.user;
  const isIndividualVoting = !!query.user && !query.event;

  // SWRでデータ取得
  const apiUrl = isSocialVoting && status === "authenticated" ? 
    `/api/events/find?event_id=${query.event}` :
    isIndividualVoting ? 
    `/api/events/find?id=${query.user}` : null;
  
  const { data, isLoading, isError } = useApiData(apiUrl);
  const { submitVote } = useVoting(data?.event_id);

  // 投票データから累計投票数とクレジットを計算
  const calculateVotes = useCallback((rData) => {
    if (!rData || !rData.vote_data || !rData.event_data) return;

    const votesArr = rData.vote_data.map((item) => item.votes || 0);
    const votesArrMultiple = votesArr.map((item) => item * item);
    setVotes(votesArr);
    const remainingCredits = rData.event_data.credits_per_voter - votesArrMultiple.reduce((a, b) => a + b, 0);
    setCredits(remainingCredits);
  }, []);

  // 投票処理
  const makeVote = useCallback((index, increment) => {
    if (!data?.event_data) return;
    
    const tempArr = [...votes];
    const currentVote = tempArr[index] || 0;
    increment ? (tempArr[index] = currentVote + 1) : (tempArr[index] = currentVote - 1);

    setVotes(tempArr);
    const sumVotes = tempArr.map((num) => (num || 0) * (num || 0)).reduce((a, b) => a + b, 0);
    setCredits(data.event_data.credits_per_voter - sumVotes);
  }, [data, votes]);

  // 投票ボタンの表示判定
  const calculateShow = useCallback((current, increment) => {
    if (!data?.event_data) return false;
    
    const change = increment ? 1 : -1;
    const canOccur = Math.abs(Math.pow(current, 2) - Math.pow(current + change, 2)) <= credits;

    if (current === 0 && credits === 0) return false;
    if (increment) return current <= 0 ? true : canOccur;
    
    return current >= 0 ? true : canOccur;
  }, [data, credits]);

  // 投票送信
  const submitVotes = async (votes, name) => {
    setSubmitLoading(true);

    try {
      const voteData = isSocialVoting ? {
        event_id: query.event,
        votes: votes,
        name: session?.user?.name || ""
      } : {
        id: query.user,
        event_id: data.event_id,
        votes: votes,
        name: name,
      };

      // 詳細なログ出力（本番環境でのデバッグ用）
      if (process.env.NODE_ENV === 'production') {
        console.log("投票データ送信:", {
          voting_mode: isSocialVoting ? 'social' : 'individual',
          event_id: voteData.event_id || query.event,
          votes_count: votes.length,
          user_authenticated: !!session,
          timestamp: new Date().toISOString()
        });
      }

      await submitVote(voteData);

      // 投票成功時のリダイレクト
      if (isSocialVoting) {
        router.push(`/success?event=${query.event}`);
      } else {
        router.push(`/success?event=${data.event_id}&user=${query.user}`);
      }
    } catch (error) {
      // 詳細なエラーログ出力（本番環境でのデバッグ用）
      console.error("投票エラー詳細:", {
        error_message: error.message,
        error_stack: error.stack,
        voting_mode: isSocialVoting ? 'social' : 'individual',
        event_id: data?.event_id || query.event,
        user_id: query.user,
        session_exists: !!session,
        timestamp: new Date().toISOString()
      });
      
      // エラー時のリダイレクト
      if (error.message.includes("401") && isSocialVoting) {
        router.push(`/auth/signin?event=${query.event}`);
        return;
      }
      
      const eventParam = isSocialVoting ? query.event : data.event_id;
      const userParam = isSocialVoting ? "" : `&user=${query.user}`;
      router.push(`/failure?event=${eventParam}${userParam}&error=${encodeURIComponent(error.message)}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // エラーハンドリング
  useEffect(() => {
    if (!isSocialVoting && !isIndividualVoting) {
      console.error("投票モード判定エラー:", {
        query_event: query.event,
        query_user: query.user,
        is_social: isSocialVoting,
        is_individual: isIndividualVoting,
        timestamp: new Date().toISOString()
      });
      router.push("/place?error=true");
      return;
    }

    if (isSocialVoting && status === "unauthenticated") {
      console.error("ソーシャル認証エラー:", {
        voting_mode: 'social',
        status: status,
        event_id: query.event,
        timestamp: new Date().toISOString()
      });
      router.push(`/auth/signin?event=${query.event}`);
      return;
    }

    if (isError) {
      console.error("データ取得エラー:", {
        api_url: apiUrl,
        is_error: isError,
        voting_mode: isSocialVoting ? 'social' : 'individual',
        auth_status: status,
        timestamp: new Date().toISOString()
      });
      router.push("/place?error=true");
      return;
    }
  }, [status, query.event, query.user, isSocialVoting, isIndividualVoting, isError, router, apiUrl]);

  // データが取得できたときの処理
  useEffect(() => {
    if (data && !isLoading) {
      calculateVotes(data);
    }
  }, [data, isLoading, calculateVotes]);

  return {
    // 基本状態
    data,
    isLoading,
    isError,
    
    // 投票モード
    isSocialVoting,
    isIndividualVoting,
    
    // 投票状態
    votes,
    credits,
    
    // 投票機能
    makeVote,
    calculateShow,
    
    // 送信
    submitVotes,
    submitLoading,
    
    // セッション情報
    session,
    status,
  };
}; 