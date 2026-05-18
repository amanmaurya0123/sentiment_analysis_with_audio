import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  LineElement, PointElement,
  LinearScale, CategoryScale, Filler,
} from "chart.js";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  LineElement, PointElement,
  LinearScale, CategoryScale, Filler
);

const EMOTION_ORDER = [
  { key: "excited",    label: "Excited",    color: "#7c3aed" },
  { key: "happy",      label: "Happy",      color: "#059669" },
  { key: "neutral",    label: "Neutral",    color: "#d97706" },
  { key: "unhappy",    label: "Unhappy",    color: "#2563eb" },
  { key: "frustrated", label: "Frustrated", color: "#dc2626" },
];

export default function MoodChart({ counts, timeline }) {
  const doughnutData = {
    labels: EMOTION_ORDER.map(e => e.label),
    datasets: [{
      data:            EMOTION_ORDER.map(e => counts[e.key] ?? 0),
      backgroundColor: EMOTION_ORDER.map(e => `${e.color}cc`),
      borderColor:     EMOTION_ORDER.map(e => e.color),
      borderWidth: 1.5,
      hoverOffset: 6,
    }],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} response${ctx.parsed !== 1 ? "s" : ""}`,
        },
      },
    },
    cutout: "68%",
    animation: { duration: 500 },
  };

  const lineData = {
    labels: timeline.map(p => p.time),
    datasets: [{
      label:           "Sentiment Score",
      data:            timeline.map(p => p.compound),
      borderColor:     "#2563eb",
      backgroundColor: "rgba(37,99,235,0.06)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: timeline.map(p =>
        p.compound >= 0.05 ? "#059669" :
        p.compound <= -0.05 ? "#dc2626" : "#d97706"
      ),
      pointBorderColor: "white",
      pointBorderWidth: 1.5,
    }],
  };

  const lineOptions = {
    scales: {
      y: {
        min: -1, max: 1,
        ticks: { stepSize: 0.5, callback: v => v.toFixed(1), font: { size: 11 } },
        grid: { color: "#f1f5f9" },
      },
      x: {
        ticks: { maxTicksLimit: 8, font: { size: 11 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` Score: ${ctx.parsed.y > 0 ? "+" : ""}${ctx.parsed.y.toFixed(3)}`,
        },
      },
    },
    animation: { duration: 300 },
    responsive: true,
    maintainAspectRatio: true,
  };

  const hasData = Object.values(counts).some(v => v > 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: "16px" }}>
      <div style={cardStyle}>
        <p style={chartTitle}>Emotion Breakdown</p>
        {hasData
          ? <Doughnut data={doughnutData} options={doughnutOptions} />
          : <p style={emptyStyle}>Waiting for feedback…</p>
        }
      </div>
      <div style={cardStyle}>
        <p style={chartTitle}>Sentiment Score Over Time</p>
        {timeline.length > 0
          ? <Line data={lineData} options={lineOptions} />
          : <p style={emptyStyle}>Waiting for feedback…</p>
        }
      </div>
    </div>
  );
}

const cardStyle = {
  background: "var(--bg-white)",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "var(--shadow-sm)",
  border: "1px solid var(--border)",
};

const chartTitle = {
  fontSize: "0.72rem",
  color: "var(--text-tertiary)",
  fontWeight: 600,
  marginBottom: "18px",
  textTransform: "uppercase",
  letterSpacing: "1px",
};

const emptyStyle = {
  textAlign: "center",
  color: "#cbd5e1",
  fontSize: "0.825rem",
  padding: "48px 0",
};