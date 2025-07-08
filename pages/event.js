import useSWR from "swr"; // State-while-revalidate
import moment from "moment"; // Moment date parsing
import Head from "next/head"; // Custom meta images
import Layout from "components/common/layout"; // Layout wrapper
import Navigation from "components/common/navigation"; // Navigation
import Datetime from "react-datetime"; // Datetime component
import { useState, useEffect } from "react"; // State handling
import QRCode from 'react-qr-code'; // QR code generation
import { useEventData, useVoteData } from "lib/hooks/useSWRApi"; // SWRカスタムフック
import EventChart from "components/event/EventChart"; // Chart component
import useEventManager from "lib/hooks/useEventManager"; // Event management hook
import styles from "styles/Event.module.css"; // CSS Modules

// Setup fetcher for SWR
const fetcher = (url) => fetch(url).then((r) => r.json());

function Event({ query }) {
  const [votingMode, setVotingMode] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false); // QR code display state

  // 最初は詳細データを取得して投票モードを判定
  const baseUrl = `/api/events/details?id=${query.id}${query.secret ? `&secret_key=${query.secret}` : ""}`;
  const { data: baseData, isLoading: baseLoading } = useEventData(
    query.id ? baseUrl : null
  );

  // 投票モードを取得（SWRデータから）
  useEffect(() => {
    if (baseData && baseData.event && votingMode === null) {
      setVotingMode(baseData.event.voting_mode || "individual");
    }
  }, [baseData, votingMode]);

  // 投票モードに応じた適切なエンドポイントを決定
  const getApiEndpoint = () => {
    if (votingMode === "google_auth" || votingMode === "social_auth") {
      return `/api/events/stats?event_id=${query.id}${query.secret ? `&secret_key=${query.secret}` : ""}`;
    } else {
      return `/api/events/details?id=${query.id}${query.secret ? `&secret_key=${query.secret}` : ""}`;
    }
  };

  // 投票モード判定後の実際のデータ取得（リアルタイム更新）
  const { data, isLoading } = useVoteData(
    votingMode ? getApiEndpoint() : null
  );

  // Event management hook
  const eventManager = useEventManager(data, votingMode, query);



  return (
    <Layout event>
      {/* Custom meta images */}
      <Head>
        <meta
          property="og:image"
          content={`https://qv-image.vercel.app/api/?id=${query.id}`}
        />
        <meta
          property="twitter:image"
          content={`https://qv-image.vercel.app/api/?id=${query.id}`}
        />
      </Head>

      {/* Navigation header */}
      <Navigation
        history={{
          // If secret is not present, return to home
          title:
            query.secret && query.secret !== "" ? "イベント作成" : "home",
          // If secret is present, return to create page
          link: query.secret && query.secret !== "" ? `/create` : "/",
        }}
        title="イベント詳細"
      />

      {/* Event page summary */}
      <div className={styles.event}>
        <h1>イベント詳細</h1>
        <div className={styles.eventInformation}>
          <h2>{!isLoading && data ? data.event.event_title : "読み込み中..."}</h2>
          <p>
            {!isLoading && data ? data.event.event_description : "読み込み中..."}
          </p>
          {data ? (
            <>
            {(moment() > moment(data.event.end_event_date)) ? (
              <h3>このイベントは終了しました。結果をご覧ください！</h3>
            ) : (
              <>
              {(moment() < moment(data.event.start_event_date)) ? (
                <h3>このイベントは {moment(data.event.start_event_date).format('YYYY年M月D日 H:mm')} に開始します</h3>
              ) : (
                <h3>このイベントは {moment(data.event.end_event_date).format('YYYY年M月D日 H:mm')} に終了します</h3>
              )}
              </>
            )}
            </>
          ) : null}
        </div>

        {/* Event start date selection */}
        {!isLoading && data ? (
          eventManager.editMode ? (
            <div className={styles.eventSection}>
              <label>イベント開始日</label>
              <div className={styles.eventDates}>
                <Datetime
                  className="create__settings_datetime"
                  value={eventManager.startDate}
                  onChange={(value) => eventManager.setStartDate(value)}
                />
                <button
                  type="button"
                  onClick={() => eventManager.toggleEditMode(false)}
                >保存
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.eventSection}>
              <label>イベント開始日</label>
              <div className={styles.eventDates}>
                <p>
                  {moment(data.event.start_event_date).format('YYYY年M月D日 H:mm')}
                </p>
                {query.secret && query.secret !== "" ? (
                  <button
                    type="button"
                    onClick={() => eventManager.toggleEditMode(true)}
                  >編集
                  </button>
                ) : null}
              </div>
            </div>
          )
        ) : null}

        {/* Event end date selection */}
        {!isLoading && data ? (
          eventManager.editMode ? (
            <div className={styles.eventSection}>
              <label>イベント終了日</label>
              <div className={styles.eventDates}>
                <Datetime
                  className="create__settings_datetime"
                  value={eventManager.endDate}
                  onChange={(value) => eventManager.setEndDate(value)}
                />
                <button
                  type="button"
                  onClick={() => eventManager.toggleEditMode(false)}
                >保存
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.eventSection}>
              <label>イベント終了日</label>
              <div className={styles.eventDates}>
                <p>
                  {moment(data.event.end_event_date).format('YYYY年M月D日 H:mm')}
                </p>
                {query.secret && query.secret !== "" ? (
                  <button
                    type="button"
                    onClick={() => eventManager.toggleEditMode(true)}
                  >編集
                  </button>
                ) : null}
              </div>
            </div>
          )
        ) : null}

        {/* Event public URL */}
        <div className={styles.eventSection}>
          <label>イベントURL</label>
          <p>統計ダッシュボードURL</p>
          <input
            value={`${process.env.NEXT_PUBLIC_BASE_URL}/event?id=${query.id}`}
            readOnly
          />
        </div>

        {/* Event private URL */}
        {query.id !== "" &&
        query.secret !== "" &&
        query.secret !== undefined &&
        !isLoading &&
        data ? (
          <div className={styles.eventSection}>
            <label className={styles.privateLabel}>プライベート管理者URL</label>
            <p>このURLを保存してイベント管理や変更を行ってください</p>
            <input
              value={`${process.env.NEXT_PUBLIC_BASE_URL}/event?id=${query.id}&secret=${query.secret}`}
              readOnly
            />
          </div>
        ) : null}

        {/* Social Authentication Voting URL and QR Code (Admin only) */}
        {query.id !== "" &&
        query.secret !== "" &&
        query.secret !== undefined &&
        !isLoading &&
        data &&
        (data.event.voting_mode === "google_auth" || data.event.voting_mode === "social_auth") ? (
          <div className={styles.eventSection}>
            <label className={styles.privateLabel}>ソーシャル認証投票URL</label>
            <p>Google・LINE認証での投票用URL（QRコードからアクセス可能）</p>
            <input
              value={`${process.env.NEXT_PUBLIC_BASE_URL}/vote?event=${query.id}`}
              readOnly
            />
            <div className={styles.qrSection}>
              <button 
                onClick={() => setShowQRCode(!showQRCode)}
                className={styles.qrToggleButton}
              >
                {showQRCode ? 'QRコードを非表示' : 'QRコードを表示'}
              </button>
              {showQRCode && (
                <div className={styles.qrDisplay}>
                  <QRCode
                    id="qr-canvas"
                    value={`${process.env.NEXT_PUBLIC_BASE_URL}/vote?event=${query.id}`}
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                  <button onClick={eventManager.downloadQRCode} className={styles.downloadButton}>
                    QRコードをダウンロード
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Event copyable links（個別URL方式のみ） */}
        {query.id !== "" &&
        query.secret !== "" &&
        query.secret !== undefined &&
        !isLoading &&
        data &&
        data.event.voting_mode === "individual" ? (
          <div className={styles.eventSection}>
            <label className={styles.privateLabel}>個別投票リンク</label>
            <p>投票者との個別共有用</p>
            <textarea
              className={styles.eventSectionTextarea}
              // Collect voter urls as one text element
              value={data.event.voters
                .map(
                  (voter, _) => `${process.env.NEXT_PUBLIC_BASE_URL}/vote?user=${voter.user_id}`
                )
                .join("\n")}
              readOnly
            />
            <button onClick={eventManager.downloadTXT} className={styles.downloadButton}>
              TXTとしてダウンロード
            </button>
          </div>
        ) : null}

        {/* Event public chart */}
        {query.id !== "" &&
        !isLoading &&
        data ? (
          <EventChart
            data={data}
            isLoading={isLoading}
            votingMode={votingMode}
            onDownload={eventManager.downloadXLSX}
          />
        ) : null}

        {/* Event public statistics */}
        {query.id !== "" &&
        !isLoading &&
        data ? (
          <div className={styles.eventSection}>
              <label>イベント統計</label>
              {data.statistics ? (
              <>
                <div className={styles.eventSubSection}>
                  <label>投票参加者</label>
                  <h3>
                    {!isLoading && data
                      ? `${data.statistics.numberVoters.toLocaleString()} / ${data.statistics.numberVotersTotal.toLocaleString()}`
                      : "読み込み中..."}
                  </h3>
                </div>
                <div className={styles.eventSubSection}>
                  <label>使用クレジット</label>
                  <h3>
                    {!isLoading && data
                      ? `${data.statistics.numberVotes.toLocaleString()} / ${data.statistics.numberVotesTotal.toLocaleString()}`
                      : "読み込み中..."}
                  </h3>
                </div>
              </>
              ) : (
                <p>イベント終了後にイベント統計が表示されます</p>
              )}
          </div>
        ) : null}
      </div>


    </Layout>
  );
}

// On initial page load:
Event.getInitialProps = ({ query }) => {
  // Return URL params
  return { query };
};

export default Event;
