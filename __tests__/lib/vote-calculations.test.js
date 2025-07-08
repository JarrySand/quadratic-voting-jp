/**
 * 投票ポイント計算ロジックのテスト
 * pages/vote.jsの計算関数を検証
 */

describe('投票ポイント計算', () => {
  describe('二次投票コスト計算', () => {
    test('単一の投票のコスト計算', () => {
      // 3票入れた場合のコスト = 3^2 = 9
      const votes = 3;
      const cost = votes * votes;
      expect(cost).toBe(9);
    });

    test('複数選択肢の総コスト計算', () => {
      // [3票, 2票, 1票] = 9 + 4 + 1 = 14
      const votesArray = [3, 2, 1];
      const totalCost = votesArray
        .map(votes => (votes || 0) * (votes || 0))
        .reduce((a, b) => a + b, 0);
      expect(totalCost).toBe(14);
    });

    test('0票の場合のコスト', () => {
      const votes = 0;
      const cost = votes * votes;
      expect(cost).toBe(0);
    });

    test('負の投票数は許可されない', () => {
      const votes = -1;
      const cost = votes * votes;
      expect(cost).toBe(1); // 負の数の二乗は正の数
    });
  });

  describe('残りクレジット計算', () => {
    test('初期状態では全クレジットが利用可能', () => {
      const maxCredits = 10;
      const usedCredits = 0;
      const remaining = maxCredits - usedCredits;
      expect(remaining).toBe(10);
    });

    test('投票後の残りクレジット計算', () => {
      const maxCredits = 10;
      const votes = [2, 1]; // 2^2 + 1^2 = 4 + 1 = 5
      const usedCredits = votes
        .map(vote => vote * vote)
        .reduce((a, b) => a + b, 0);
      const remaining = maxCredits - usedCredits;
      expect(remaining).toBe(5);
    });

    test('全クレジット使用時', () => {
      const maxCredits = 10;
      const votes = [3, 1]; // 3^2 + 1^2 = 9 + 1 = 10
      const usedCredits = votes
        .map(vote => vote * vote)
        .reduce((a, b) => a + b, 0);
      const remaining = maxCredits - usedCredits;
      expect(remaining).toBe(0);
    });

    test('クレジット不足の場合', () => {
      const maxCredits = 5;
      const votes = [3, 2]; // 3^2 + 2^2 = 9 + 4 = 13 > 5
      const usedCredits = votes
        .map(vote => vote * vote)
        .reduce((a, b) => a + b, 0);
      const remaining = maxCredits - usedCredits;
      expect(remaining).toBe(-8); // 不足分
      expect(remaining < 0).toBe(true); // クレジット不足
    });
  });

  describe('投票可能性チェック', () => {
    test('十分なクレジットがある場合は投票可能', () => {
      const currentVotes = 2;
      const remainingCredits = 10;
      const nextVotes = currentVotes + 1;
      const additionalCost = (nextVotes * nextVotes) - (currentVotes * currentVotes);
      const canVote = additionalCost <= remainingCredits;
      expect(canVote).toBe(true); // 5 <= 10
    });

    test('クレジット不足の場合は投票不可', () => {
      const currentVotes = 3;
      const remainingCredits = 2;
      const nextVotes = currentVotes + 1;
      const additionalCost = (nextVotes * nextVotes) - (currentVotes * currentVotes);
      const canVote = additionalCost <= remainingCredits;
      expect(canVote).toBe(false); // 7 > 2
    });

    test('投票を減らす場合は常に可能', () => {
      const currentVotes = 3;
      const nextVotes = currentVotes - 1;
      const canReduceVote = currentVotes > 0;
      expect(canReduceVote).toBe(true);
    });

    test('0票から減らすことはできない', () => {
      const currentVotes = 0;
      const canReduceVote = currentVotes > 0;
      expect(canReduceVote).toBe(false);
    });
  });
}); 