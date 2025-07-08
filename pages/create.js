import moment from "moment"; // Date handling
import { useState } from "react"; // State handling
import Layout from "components/common/layout"; // Layout wrapper
import Loader from "components/common/loader"; // Loader component
import { useRouter } from "next/router"; // Router hooks
import Navigation from "components/common/navigation"; // Navigation bar
import { useEventCreation } from "lib/hooks/useSWRApi"; // SWRカスタムフック
import GlobalSettingsSection from "components/create/GlobalSettingsSection"; // 全体設定セクション
import SubjectManagement from "components/create/SubjectManagement"; // 選択肢管理セクション
import styles from "../styles/Create.module.css";

// Initial global settings
const defaultGlobalSettings = {
  event_title: "",
  event_description: "",
  num_voters: 10,
  credits_per_voter: 99,
  start_event_date: moment(),
  end_event_date: moment().add(1, "days"),
  voting_mode: "individual", // デフォルトは個別投票
};

// Initial empty subject
const defaultCurrentSubject = {
  title: "",
  description: "",
  url: "",
};

export default function Create() {
  // Router object
  const router = useRouter();
  // Global settings object
  const [globalSettings, setGlobalSettings] = useState(defaultGlobalSettings);
  // Current subject object
  const [currentSubject, setCurrentSubject] = useState(defaultCurrentSubject);
  // Array of all subjects
  const [subjects, setSubjects] = useState([]);
  // Loading state
  const [loading, setLoading] = useState(false);
  // SWR hooks
  const { createEvent } = useEventCreation();

  /**
   * Sets the number of voters (between 1 - 250)
   * @param {number} value number of voters
   */
  const setNumVoters = (value) => {
    setGlobalSettings({
      ...globalSettings, // Current settings
      num_voters: Math.max(1, Math.min(1000, Number(Math.round(value)))), // Number between 1 - 250 and not decimal
    });
  };

  /**
   * Sets the number of voting credits per voter (min. 1)
   * @param {number} value number of voting credits
   */
  const setCreditsPerVoter = (value) => {
    setGlobalSettings({
      ...globalSettings, // Current settings
      credits_per_voter: Math.max(1, Number(Math.round(value))), // Number above 1 and not decimal
    });
  };

  /**
   * Sets event start/end date
   * @param {string} type name of object date key
   * @param {object} value moment date object
   */
  const setEventData = (type, value) => {
    setGlobalSettings({
      ...globalSettings,
      [type]: value,
    });
  };

  /**
   * Updates subject object with input field information
   * @param {string} field object key
   * @param {string} value input field value
   */
  const setSubjectData = (field, value) => {
    setCurrentSubject({
      ...currentSubject,
      [field]: value,
    });
  };

  /**
   * Submits subject to array
   */
  const submitSubject = () => {
    // Push subject to subjects array
    setSubjects((oldSubjects) => [...oldSubjects, currentSubject]);
    // Clear current subject by resetting to default
    setCurrentSubject(defaultCurrentSubject);
  };

  /**
   * Edits item with x index by setting it to current and deleting from subjects[]
   * @param {number} index array index of item to edit
   */
  const editSubject = (index) => {
    // Set current subject to to-be-edited item
    setCurrentSubject(subjects[index]);
    // Delete to-be-edited item from subjects array
    deleteSubject(index);
  };

  /**
   * Deletes item with x index by filtering it out of subjects[]
   * @param {number} index array index of item to delete
   */
  const deleteSubject = (index) => {
    // Filter array for all items that are not subjects[index]
    setSubjects(subjects.filter((item, i) => i !== index));
  };

  /**
   * POST event creation endpoint
   */
  const submitEvent = async () => {
    // Toggle loading
    setLoading(true);

    try {
      // Post create endpoint and retrieve event details
      const eventDetails = await createEvent({
        ...globalSettings,
        subjects,
      });

      // Toggle loading
      setLoading(false);

      // Redirect to events page on submission
      router
        .push(
          `/event?id=${eventDetails.id}&secret=${eventDetails.secret_key}`
        )
        .then(() => window.scrollTo(0, 0));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("イベント作成エラー:", error);
      }
      setLoading(false);
      // エラーハンドリング - 必要に応じてユーザーに通知
      alert("イベント作成に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <Layout>
      {/* Navigation header */}
      <Navigation
        history={{
          title: "ホーム",
          link: "/",
        }}
        title="イベント作成"
      />

              {/* Create page */}
        <div className={styles.create}>
          {/* Create page heading */}
          <div className={styles.createContent}>
            <h1>新しいイベントを作成</h1>
            <p>
              イベントを作成するには、イベント設定を入力し、選択肢を追加してください。
              参加者と共有できるクイックリンクを生成します。
            </p>
          </div>

          {/* Global settings */}
          <GlobalSettingsSection 
            globalSettings={globalSettings}
            setEventData={setEventData}
            setNumVoters={setNumVoters}
            setCreditsPerVoter={setCreditsPerVoter}
          />

          {/* Subject settings */}
          <SubjectManagement 
            subjects={subjects}
            currentSubject={currentSubject}
            setSubjectData={setSubjectData}
            submitSubject={submitSubject}
            editSubject={editSubject}
            deleteSubject={deleteSubject}
          />

          {/* Submit event creation */}
          <div className={styles.submission}>
            {subjects.length > 1 ? (
              // If subjects have been provided, enable event creation
              <button className={styles.eventButton} onClick={submitEvent}>
                {loading ? <Loader /> : "イベントを作成"}
              </button>
            ) : (
              // Else, prompt to add subject via disabled state
              <button className={styles.eventDisabled} disabled>
                少なくとも2つの選択肢を追加してください
              </button>
            )}
          </div>
        </div>

      {/* Global styling - only for accordion buttons and fonts */}
      <style jsx global>{`
        .accordion__button {
          background-color: #f1f2e5;
          color: #000;
          max-width: calc(100% - 36px);
        }
        .accordion__button:hover {
          background-color: #f1f2e5;
          opacity: 0.8;
        }
        div:focus,
        button:focus {
          outline: none;
        }

        @font-face {
            font-family: 'suisse_intlbook_italic';
            src: url('./fonts/suisseintl-bookitalic-webfont.woff2') format('woff2'),
                 url('./fonts/suisseintl-bookitalic-webfont.woff') format('woff');
            font-weight: normal;
            font-style: normal;
        }

        @font-face {
            font-family: 'suisse_intlbook';
            src: url('./fonts/suisseintl-book-webfont.woff2') format('woff2'),
                 url('./fonts/suisseintl-book-webfont.woff') format('woff');
            font-weight: normal;
            font-style: normal;
        }

        @font-face {
            font-family: 'messerv2.1condensed';
            src: url('./fonts/messerv2.1-condensed-webfont.woff2') format('woff2'),
                 url('./fonts/messerv2.1-condensed-webfont.woff') format('woff');
            font-weight: normal;
            font-style: normal;
        }
      `}</style>
    </Layout>
  );
}
