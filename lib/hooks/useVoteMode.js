import { useEffect } from "react";
import { useRouter } from "next/router";
import { useApiData } from "./useSWRApi";

/**
 * 投票モード判定と認証状態管理を行うカスタムフック
 * 
 * @param {Object} query - URLクエリパラメータ
 * @param {string} status - NextAuth 認証状態
 * @returns {Object} 投票モードに関する状態と関数
 */
export const useVoteMode = (query, status) => {
  const router = useRouter();
  
  // 投票モードを判定（個別投票 vs ソーシャル認証投票）
  const isSocialVoting = !!query.event && !query.user;
  const isIndividualVoting = !!query.user && !query.event;

  // SWRでデータ取得用のURL生成
  const apiUrl = isSocialVoting && status === "authenticated" ? 
    `/api/events/find?event_id=${query.event}` :
    isIndividualVoting ? 
    `/api/events/find?id=${query.user}` : null;
  
  // データ取得
  const { data, isLoading, isError } = useApiData(apiUrl);

  // エラーハンドリング
  useEffect(() => {
    if (!isSocialVoting && !isIndividualVoting) {
      router.push("/place?error=true");
      return;
    }

    if (isSocialVoting && status === "unauthenticated") {
      router.push(`/auth/signin?event=${query.event}`);
      return;
    }

    if (isError) {
      router.push("/place?error=true");
      return;
    }
  }, [status, query.event, query.user, isSocialVoting, isIndividualVoting, isError, router]);

  return {
    isSocialVoting,
    isIndividualVoting,
    data,
    isLoading,
    isError,
  };
}; 