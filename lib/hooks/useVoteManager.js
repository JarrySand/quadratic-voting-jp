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

  // デバッグ情報を出力（環境変数チェック削除）
  useEffect(() => {
    const debugInfo = {
      query_params: query,
      session_status: status,
      session_data: session ? {
        provider: session.provider,
        user_email: session.user?.email,
        user_name: session.user?.name,
        expires: session.expires,
        session_keys: Object.keys(session)
      } : null,
      voting_mode: {
        isSocialVoting,
        isIndividualVoting
      },
      cookies: typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim()).filter(c => c.includes('next-auth') || c.includes('__Secure-next-auth') || c.includes('__Host-next-auth')) : 'SSR',
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    
    // 確実にデバッグ情報を表示するための複数の方法
    console.log("🔍 [DEBUG] useVoteManager初期化:", debugInfo);
    console.error("🔍 [DEBUG] useVoteManager初期化:", debugInfo);
    
    // DOM要素でもデバッグ情報を表示
    if (typeof document !== 'undefined') {
      let debugElement = document.getElementById('debug-info');
      if (!debugElement) {
        debugElement = document.createElement('div');
        debugElement.id = 'debug-info';
        debugElement.style.cssText = 'position:fixed;top:10px;right:10px;background:black;color:white;padding:10px;z-index:9999;max-width:300px;font-size:12px;border:1px solid red;';
        document.body.appendChild(debugElement);
      }
      debugElement.innerHTML = `
        <strong>🔍 DEBUG INFO:</strong><br/>
        Session: ${status}<br/>
        Social: ${isSocialVoting}<br/>
        Individual: ${isIndividualVoting}<br/>
        Cookies: ${debugInfo.cookies.length} found<br/>
        Env: ${process.env.NODE_ENV}<br/>
        Time: ${new Date().toLocaleTimeString()}
      `;
    }
  }, [query, session, status, isSocialVoting, isIndividualVoting]);

  // SWRでデータ取得
  const apiUrl = isSocialVoting && status === "authenticated" ? 
    `/api/events/find?event_id=${query.event}` :
    isIndividualVoting ? 
    `/api/events/find?id=${query.user}` : null;
  
  // API URL デバッグ（環境変数チェック削除）
  useEffect(() => {
    if (apiUrl) {
      console.log("🔍 [DEBUG] API URL生成:", {
        api_url: apiUrl,
        will_include_credentials: apiUrl.includes('/api/events/find?event_id='),
        session_authenticated: status === "authenticated",
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }
  }, [apiUrl, status]);
  
  const { data, isLoading, isError } = useApiData(apiUrl);
  const { submitVote } = useVoting(data?.event_id);

  // API レスポンスのデバッグ（環境変数チェック削除）
  useEffect(() => {
    console.log("🔍 [DEBUG] API レスポンス状況:", {
      api_url: apiUrl,
      data_received: !!data,
      is_loading: isLoading,
      is_error: isError,
      data_keys: data ? Object.keys(data) : null,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }, [data, isLoading, isError, apiUrl]);

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

      // 詳細なログ出力（デバッグ用）
      console.log("🔍 [DEBUG] 投票データ送信:", {
        voting_mode: isSocialVoting ? 'social' : 'individual',
        event_id: voteData.event_id || query.event,
        votes_count: votes.length,
        user_authenticated: !!session,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });

      await submitVote(voteData);

      // 投票成功時のリダイレクト
      if (isSocialVoting) {
        router.push(`/success?event=${query.event}`);
      } else {
        router.push(`/success?event=${data.event_id}&user=${query.user}`);
      }
    } catch (error) {
      // 詳細なエラーログ出力（デバッグ用）
      console.error("🔍 [DEBUG] 投票エラー詳細:", {
        error_message: error.message,
        error_stack: error.stack,
        voting_mode: isSocialVoting ? 'social' : 'individual',
        event_id: data?.event_id || query.event,
        user_id: query.user,
        session_exists: !!session,
        env: process.env.NODE_ENV,
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
      console.error("🔍 [DEBUG] 投票モード判定エラー:", {
        query_event: query.event,
        query_user: query.user,
        is_social: isSocialVoting,
        is_individual: isIndividualVoting,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      router.push("/place?error=true");
      return;
    }

    if (isSocialVoting && status === "unauthenticated") {
      console.error("🔍 [DEBUG] ソーシャル認証エラー:", {
        voting_mode: 'social',
        status: status,
        event_id: query.event,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      router.push(`/auth/signin?event=${query.event}`);
      return;
    }

    if (isError) {
      console.error("🔍 [DEBUG] データ取得エラー:", {
        api_url: apiUrl,
        is_error: isError,
        voting_mode: isSocialVoting ? 'social' : 'individual',
        auth_status: status,
        session_data: session ? {
          provider: session.provider,
          user_email: session.user?.email
        } : null,
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
      router.push("/place?error=true");
      return;
    }
  }, [status, query.event, query.user, isSocialVoting, isIndividualVoting, isError, router, apiUrl, session]);

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