import { useState } from "react";
import moment from "moment";
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { useEventUpdate } from "./useSWRApi";

function useEventManager(data, votingMode, query) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const { updateEvent } = useEventUpdate();

  /**
   * Admin view: download voter URLs as text file
   */
  const downloadTXT = () => {
    // Collect voter URLs in single text string
    const text = data.event.voters
      .map((voter, _) => `${process.env.NEXT_PUBLIC_BASE_URL}/vote?user=${voter.user_id}`)
      .join("\n");

    // Create link component
    const element = document.createElement("a");
    // Create blob from text
    const file = new Blob([text], { type: "text/plain" });

    // Setup link component to be downloadable and hidden
    element.href = URL.createObjectURL(file);
    element.download = "voter_links.txt";
    element.style.display = "none";

    // Append link component to body
    document.body.appendChild(element);

    // Click link component to download file
    element.click();

    // Remove link component from body
    document.body.removeChild(element);
  };

  const downloadXLSX = () => {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
    
    if (votingMode === "google_auth" || votingMode === "social_auth") {
      // ソーシャル認証投票の場合（Google・LINE統合）
      const options = data.results.map(result => result.title);
      const descriptions = data.results.map(result => result.description);
      const effectiveVotes = data.results.map(result => result.total_votes);
      
      var rows = [];
      for (let i = 0; i < options.length; i++) {
        var option = {
          title: options[i],
          description: descriptions[i],
          votes: effectiveVotes[i],
        }
        rows.push(option);
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], {type: fileType});
      FileSaver.saveAs(fileData, 'qv-social-results' + fileExtension);
    } else {
      // 個別投票の場合（従来のロジック）
      const options = data.chart.labels
      const descriptions = data.chart.descriptions
      const effectiveVotes = data.chart.datasets[0].data
      var rows = [];
      var i;
      for (i = 0; i < options.length; i++) {
        var option = {
          title: options[i],
          description: descriptions[i],
          votes: effectiveVotes[i],
        }
        rows.push(option);
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], {type: fileType});
      FileSaver.saveAs(fileData, 'qv-results' + fileExtension);
    }
  };

  /**
   * Admin view: download QR code as PNG file
   */
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const toggleEditMode = async (start) => {
    if (start) {
      if (data) {
        setStartDate(moment(data.event.start_event_date));
        setEndDate(moment(data.event.end_event_date));
        setEditMode(true);
      }
    } else {
      try {
        // POST data and collect status
        await updateEvent({
          id: data.event.id,
          start_event_date: startDate,
          end_event_date: endDate,
        });
        // If POST is a success
        setEditMode(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("イベント更新エラー:", error);
        }
        alert("イベントの更新に失敗しました。もう一度お試しください。");
      }
    }
  };

  return {
    // 状態
    startDate,
    endDate,
    editMode,
    // 状態更新
    setStartDate,
    setEndDate,
    // 関数
    downloadTXT,
    downloadXLSX,
    downloadQRCode,
    toggleEditMode,
  };
}

export default useEventManager; 