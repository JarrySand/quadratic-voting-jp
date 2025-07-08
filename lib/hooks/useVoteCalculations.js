import { useState, useCallback } from "react";

/**
 * 投票ポイント計算ロジックを管理するカスタムフック
 * 
 * @param {Object} data - イベントデータ
 * @returns {Object} 投票計算に関する状態と関数
 */
export const useVoteCalculations = (data) => {
  const [votes, setVotes] = useState([]);
  const [credits, setCredits] = useState(0);

  /**
   * 投票データから累計投票数と利用可能クレジットを計算
   * @param {Object} rData - 投票データオブジェクト
   */
  const calculateVotes = useCallback((rData) => {
    if (!rData || !rData.vote_data || !rData.event_data) {
      console.warn('calculateVotes: Invalid data structure', rData);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('calculateVotes data:', rData);
    }

    const votesArr = rData.vote_data.map((item) => item.votes || 0);
    const votesArrMultiple = votesArr.map((item) => item * item);
    setVotes(votesArr);
    const remainingCredits = rData.event_data.credits_per_voter - votesArrMultiple.reduce((a, b) => a + b, 0);
    setCredits(remainingCredits);

    if (process.env.NODE_ENV === 'development') {
      console.log('Votes array:', votesArr);
      console.log('Credits calculation:', {
        total: rData.event_data.credits_per_voter,
        used: votesArrMultiple.reduce((a, b) => a + b, 0),
        remaining: remainingCredits
      });
    }
  }, []);

  /**
   * 投票を行い、クレジットを再計算
   * @param {number} index - 投票選択肢のインデックス
   * @param {boolean} increment - 増加の場合true、減少の場合false
   */
  const makeVote = useCallback((index, increment) => {
    if (!data?.event_data) return;
    
    const tempArr = [...votes];
    const currentVote = tempArr[index] || 0;
    increment
      ? (tempArr[index] = currentVote + 1)
      : (tempArr[index] = currentVote - 1);

    setVotes(tempArr);
    const sumVotes = tempArr
      .map((num) => (num || 0) * (num || 0))
      .reduce((a, b) => a + b, 0);
    setCredits(data.event_data.credits_per_voter - sumVotes);
  }, [data, votes]);

  /**
   * 投票ボタンの表示/非表示を判定
   * @param {number} current - 現在の投票数
   * @param {boolean} increment - 増加ボタンの場合true、減少ボタンの場合false
   * @returns {boolean} 表示する場合true
   */
  const calculateShow = useCallback((current, increment) => {
    if (!data?.event_data) return false;
    
    const change = increment ? 1 : -1;
    const canOccur =
      Math.abs(Math.pow(current, 2) - Math.pow(current + change, 2)) <= credits;

    if (current === 0 && credits === 0) {
      return false;
    }

    if (increment) {
      return current <= 0 ? true : canOccur;
    } else {
      if (data.event_data.event_title === "Wish List Poll") {
        return (current >= 0 ? true : canOccur) && (current !== 0);
      } else {
        return current >= 0 ? true : canOccur;
      }
    }
  }, [data, credits]);

  return {
    votes,
    credits,
    calculateVotes,
    makeVote,
    calculateShow,
  };
}; 