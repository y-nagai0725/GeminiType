<template>
  <div class="growth-chart">
    <Line
      v-if="chartData.labels.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
    <p v-else class="growth-chart__no-data">
      データが足りません。もっと遊んでね！
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "vue-chartjs";

// (★) Chart.js を使うための「おまじない（登録）」
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- Props ---
const props = defineProps({
  // 履歴データ (新しい順に入ってる想定)
  sessions: { type: Array, required: true },
});

// --- データ加工 ---
const chartData = computed(() => {
  // (★) グラフは「古い順（左→右）」で見たいから、配列を逆順にする！
  // (slice()を使うのは、元の配列を壊さないためだよ♡)
  const reversedSessions = props.sessions.slice().reverse();

  // 日付ラベル (例: "11/25")
  const labels = reversedSessions.map((s) => {
    const d = new Date(s.created_at);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  // KPMデータ
  const kpmData = reversedSessions.map((s) => Math.round(s.average_kpm));

  // 正確率データ
  const accData = reversedSessions.map((s) => Math.round(s.average_accuracy));

  return {
    labels,
    datasets: [
      {
        label: "KPM (速度)",
        borderColor: "#007bff", // 青
        backgroundColor: "#007bff",
        data: kpmData,
        yAxisID: "y", // 左の軸を使う
        tension: 0.3, // (★) 線をちょっと滑らかにする
      },
      {
        label: "Accuracy (正確率 %)",
        borderColor: "#28a745", // 緑
        backgroundColor: "#28a745",
        data: accData,
        yAxisID: "y1", // 右の軸を使う
        tension: 0.3,
      },
    ],
  };
});

// --- オプション設定 ---
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // (★) 高さをCSSで自由に決めるため
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: { position: "top" },
    title: { display: true, text: "成長の記録" },
  },
  scales: {
    y: {
      type: "linear",
      display: true,
      position: "left",
      title: { display: true, text: "KPM" },
    },
    y1: {
      type: "linear",
      display: true,
      position: "right",
      min: 0,
      max: 100,
      title: { display: true, text: "Accuracy (%)" },
      grid: {
        drawOnChartArea: false, // グリッド線が重なると見にくいから消す
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.growth-chart {
  width: 100%;
  height: 300px; /* (★) グラフの高さ */

  &__no-data {
    text-align: center;
    color: #888;
    padding-top: 4rem;
  }
}
</style>