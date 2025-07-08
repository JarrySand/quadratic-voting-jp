import Datetime from "react-datetime";
import styles from "../../styles/Create.module.css";

export default function GlobalSettingsSection({ 
  globalSettings, 
  setEventData, 
  setNumVoters, 
  setCreditsPerVoter 
}) {
  return (
    <div className={styles.settings}>
      {/* Global settings header */}
      <h2>全体設定</h2>
      <p>
        これらの設定でイベントをセットアップします。イベントタイトルと説明の追加、
        投票者数の選択、各投票者が受け取る投票ポイント数、投票開始・終了日時を設定できます。
      </p>

      {/* Event title selection */}
      <div className={styles.settingsSection}>
        <label htmlFor="event_title">イベントタイトル</label>
        <p>イベント名を入力してください</p>
        <input
          type="text"
          id="event_title"
          placeholder="イベントタイトル例"
          value={globalSettings.event_title}
          onChange={(e) => setEventData("event_title", e.target.value)}
        />
      </div>

      {/* Event description selection */}
      <div className={styles.settingsSection}>
        <label htmlFor="event_description">イベント説明</label>
        <p>240文字以内でイベントを説明してください：</p>
        <input
          type="text"
          id="event_description"
          placeholder="イベント説明例"
          value={globalSettings.event_description}
          maxLength="240"
          onChange={(e) =>
            setEventData("event_description", e.target.value)
          }
        />
      </div>

      {/* Voting mode selection */}
      <div className={styles.settingsSection}>
        <label htmlFor="voting_mode">投票方式</label>
        <p>投票者のアクセス方法を選択してください：</p>
        <select
          id="voting_mode"
          value={globalSettings.voting_mode}
          onChange={(e) => setEventData("voting_mode", e.target.value)}
        >
          <option value="individual">個別URL方式（従来）</option>
          <option value="google_auth">ソーシャル認証方式（QRコード対応）</option>
        </select>
        <div className={styles.votingModeDescription}>
          {globalSettings.voting_mode === "individual" ? (
            <div className={styles.modeDescription}>
              <h4>個別URL方式</h4>
              <ul>
                <li>参加者ごとに個別のURLを生成</li>
                <li>URLを知っている人のみ投票可能</li>
                <li>投票者数を事前に設定（現在: {globalSettings.num_voters}人）</li>
                <li>従来の方式で、シンプルなアクセス制御</li>
              </ul>
            </div>
          ) : (
            <div className={styles.modeDescription}>
              <h4>ソーシャル認証方式</h4>
              <ul>
                <li>共通のQRコード/URLでアクセス</li>
                <li>Google・LINEログインによる本人確認</li>
                <li>シビル攻撃耐性（一人一回の投票保証）</li>
                <li>イベント会場での一斉投票に最適</li>
              </ul>
              <p><strong>注意：</strong> この方式では投票者数の設定は無効になります。参加者は自分のアカウントでログインして投票します。</p>
            </div>
          )}
        </div>
      </div>

      {/* Number of voters selection (only for individual mode) */}
      {globalSettings.voting_mode === "individual" && (
        <div className={styles.settingsSection}>
          <label htmlFor="num_voters">投票者数</label>
          <p>何名分の投票リンクを生成しますか？</p>
          <input
            type="number"
            id="num_voters"
            value={globalSettings.num_voters}
            onChange={(e) => setNumVoters(e.target.value)}
          />
        </div>
      )}

      {/* Number of credits per voter selection */}
      <div className={styles.settingsSection}>
        <label htmlFor="credits_per_voter">投票者あたりのポイント</label>
        <p>各投票者は何ポイント受け取りますか？</p>
        <input
          type="number"
          max="100"
          min="1"
          step="1"
          id="credits_per_voter"
          value={globalSettings.credits_per_voter}
          onChange={(e) => setCreditsPerVoter(e.target.value)}
        />
      </div>

      {/* Event start date selection */}
      <div className={styles.settingsSection}>
        <label>Event start date</label>
        <p>When would you like to begin polling?</p>
        <Datetime
          className={styles.settingsDatetime}
          value={globalSettings.start_event_date}
          onChange={(value) => setEventData("start_event_date", value)}
        />
      </div>

      {/* Event end date selection */}
      <div className={styles.settingsSection}>
        <label>Event end date</label>
        <p>When would you like to end polling?</p>
        <Datetime
          className={styles.settingsDatetime}
          value={globalSettings.end_event_date}
          onChange={(value) => setEventData("end_event_date", value)}
        />
      </div>
    </div>
  );
} 