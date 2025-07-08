import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from "react-accessible-accordion";
import styles from "../../styles/Create.module.css";

export default function SubjectManagement({ 
  subjects, 
  currentSubject, 
  setSubjectData, 
  submitSubject, 
  editSubject, 
  deleteSubject 
}) {
  return (
    <div className={styles.settings}>
      {/* Subject settings heading */}
      <h2>投票選択肢</h2>
      <p>
        投票者が投票ポイントを配分できる選択肢を追加する設定です。
        選択肢のタイトル、説明、リンクを追加できます。
      </p>

      {/* Listing of all subjects via accordion*/}
      <h3>投票選択肢</h3>
      <div className={styles.settingsSection}>
        {subjects.length > 0 ? (
          // If subjects array contains at least one subject
          <Accordion>
            {subjects.map((subject, i) => {
              // Render subjects in accordion
              return (
                <AccordionItem key={i}>
                  <AccordionItemHeading>
                    <AccordionItemButton>
                      {subject.title}
                    </AccordionItemButton>
                  </AccordionItemHeading>
                  <AccordionItemPanel>
                    {subject.description !== "" ? (
                      // If subject has a description
                      <div className={styles.accordionValue}>
                        <label>説明</label>
                        <textarea value={subject.description} disabled />
                      </div>
                    ) : null}
                    {subject.url !== "" ? (
                      // If subject has a URL
                      <div className={styles.accordionValue}>
                        <label>リンク</label>
                        <a
                          href={subject.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {subject.url}
                        </a>
                      </div>
                    ) : null}
                    <div className={styles.accordionButtons}>
                      <button onClick={() => editSubject(i)}>
                        選択肢を編集
                      </button>
                      <button onClick={() => deleteSubject(i)}>
                        選択肢を削除
                      </button>
                    </div>
                  </AccordionItemPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          // Else, if no subjects in subjects array
          <span className={styles.emptySubjects}>選択肢が追加されていません</span>
        )}
      </div>

      {/* Form to add subjects */}
      <h3>選択肢を追加</h3>
      <div className={styles.settingsSection}>
        {/* Subject addition form */}
        <div className={styles.subjectForm}>
          {/* Add subject tile */}
          <div>
            <label>選択肢タイトル</label>
            <input
              type="text"
              placeholder="選択肢のタイトルを入力"
              value={currentSubject.title}
              onChange={(e) => setSubjectData("title", e.target.value)}
            />
          </div>

          {/* Add subject description */}
          <div>
            <label>選択肢の説明</label>
            <textarea
              placeholder="選択肢の説明を入力してください。"
              value={currentSubject.description}
              onChange={(e) =>
                setSubjectData("description", e.target.value)
              }
            />
          </div>

          {/* Add subject link */}
          <div>
            <label>選択肢のリンク</label>
            <input
              type="text"
              placeholder="https://example.com/info"
              value={currentSubject.url}
              onChange={(e) => setSubjectData("url", e.target.value)}
            />
          </div>

          {currentSubject.title !== "" ? (
            // If form has title filled, allow submission
            <button onClick={submitSubject}>選択肢を追加</button>
          ) : (
            // Else, show disabled state
            <button className={styles.buttonDisabled} disabled>
              タイトルを入力してください
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 