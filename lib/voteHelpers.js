/**
 * 投票関連の汎用的なヘルパー関数
 */

/**
 * 投票選択肢の説明文の表示/非表示を切り替える
 * @param {number} key - 選択肢を特定するキー
 */
export const toggleDescription = (key) => {
  const description = document.getElementById("description-container-" + key);
  const link = document.getElementById("link-container-" + key);
  const toggleButton = document.getElementById("toggle-button-" + key);
  
  if (toggleButton.alt === "down arrow") {
    toggleButton.src = "/vectors/up_arrow.svg";
    toggleButton.alt = "up arrow";
  } else {
    toggleButton.src = "/vectors/down_arrow.svg";
    toggleButton.alt = "down arrow";
  }
  
  if (description) {
    if (description.style.display === "none") {
      description.style.display = "block";
    } else {
      description.style.display = "none";
    }
  }
  
  if (link) {
    if (link.style.display === "none") {
      link.style.display = "block";
    } else {
      link.style.display = "none";
    }
  }
};

/**
 * 投票データをフォーマットする
 * @param {Array} votes - 投票配列
 * @returns {Array} フォーマットされた投票データ
 */
export const formatVoteData = (votes) => {
  return votes.map(vote => vote || 0);
};

/**
 * 投票データを検証する
 * @param {Array} votes - 投票配列
 * @param {number} maxCredits - 最大利用可能クレジット
 * @returns {boolean} 有効な場合true
 */
export const validateVoteData = (votes, maxCredits) => {
  if (!Array.isArray(votes)) {
    return false;
  }
  
  // 二次投票コストの計算
  const totalCost = votes
    .map(vote => (vote || 0) * (vote || 0))
    .reduce((sum, cost) => sum + cost, 0);
  
  return totalCost <= maxCredits;
};

/**
 * 投票状況のサマリーを生成する
 * @param {Array} votes - 投票配列
 * @param {number} maxCredits - 最大利用可能クレジット
 * @returns {Object} 投票状況サマリー
 */
export const generateVoteSummary = (votes, maxCredits) => {
  const totalVotes = votes.reduce((sum, vote) => sum + (vote || 0), 0);
  const totalCost = votes
    .map(vote => (vote || 0) * (vote || 0))
    .reduce((sum, cost) => sum + cost, 0);
  const remainingCredits = maxCredits - totalCost;
  
  return {
    totalVotes,
    totalCost,
    remainingCredits,
    isValid: remainingCredits >= 0
  };
}; 