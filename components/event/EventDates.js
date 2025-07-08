import moment from "moment";
import Datetime from "react-datetime";

function EventDates({ 
  data, 
  isLoading, 
  startDate, 
  endDate, 
  setStartDate, 
  setEndDate, 
  editMode, 
  onToggleEditMode, 
  hasSecret 
}) {
  if (isLoading || !data) return null;

  const { event } = data;

  return (
    <>
      {/* Event start date section */}
      <div className="event__section">
        <label>イベント開始日</label>
        <div className="event__dates">
          {editMode ? (
            <>
              <Datetime
                className="create__settings_datetime"
                value={startDate}
                onChange={(value) => setStartDate(value)}
              />
              <button
                type="button"
                onClick={() => onToggleEditMode(false)}
              >
                保存
              </button>
            </>
          ) : (
            <>
              <p>
                {moment(event.start_event_date).format('YYYY年M月D日 H:mm')}
              </p>
              {hasSecret && (
                <button
                  type="button"
                  onClick={() => onToggleEditMode(true)}
                >
                  編集
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event end date section */}
      <div className="event__section">
        <label>イベント終了日</label>
        <div className="event__dates">
          {editMode ? (
            <>
              <Datetime
                className="create__settings_datetime"
                value={endDate}
                onChange={(value) => setEndDate(value)}
              />
              <button
                type="button"
                onClick={() => onToggleEditMode(false)}
              >
                保存
              </button>
            </>
          ) : (
            <>
              <p>
                {moment(event.end_event_date).format('YYYY年M月D日 H:mm')}
              </p>
              {hasSecret && (
                <button
                  type="button"
                  onClick={() => onToggleEditMode(true)}
                >
                  編集
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default EventDates; 