import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import HashLoader from "react-spinners/HashLoader";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function EventChart({ data, isLoading, votingMode, onDownload }) {
  // チャートデータを投票モードに応じて生成
  const getChartData = () => {
    if (!data) return null;
    
    if (votingMode === "google_auth" || votingMode === "social_auth") {
      // ソーシャル認証投票の場合（Google・LINE統合）
      return {
        labels: data.results.map(result => result.title),
        datasets: [
          {
            label: "投票数",
            data: data.results.map(result => result.total_votes),
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1,
          },
        ],
      };
    } else {
      // 個別投票の場合（従来のロジック）
      return data.chart;
    }
  };

  const chartData = getChartData();

  if (!chartData) {
    return (
      <div className="event__section">
        <label>イベント投票結果</label>
        <p>投票結果はまだありません。投票期間中または終了後に表示されます。</p>
      </div>
    );
  }

  return (
    <div className="event__section">
      <label>イベント投票結果</label>
      <p>二次投票重み付け投票結果</p>
      {!isLoading && data ? (
        <>
          <div className="chart" style={{ height: '400px', width: '100%' }}>
            <Bar 
              data={chartData} 
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  },
                  y: {
                    display: true
                  }
                }
              }}
            />
          </div>
          <button onClick={onDownload} className="download__button">
            スプレッドシートをダウンロード
          </button>
        </>
      ) : (
        <div className="loading__chart">
          <HashLoader
            size={50}
            color="#000"
            css={{ display: "inline-block" }}
          />
          <h3>チャート読み込み中...</h3>
          <span>少々お待ちください</span>
        </div>
      )}
    </div>
  );
}

export default EventChart; 