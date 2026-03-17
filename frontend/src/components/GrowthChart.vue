<template>
  <div class="growth-chart">
    <Line
      v-if="chartData.labels.length > 0"
      :data="chartData"
      :options="chartOptions"
    />
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

// Chart.jsを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Props
 */
const props = defineProps({
  // 履歴データ (新しい順に入ってる想定)
  sessions: { type: Array, required: true },
});

/**
 * グラフデータ
 */
const chartData = computed(() => {
  // グラフは「古い順（左→右）」で見たいから、配列を逆順にする
  const reversedSessions = props.sessions.slice().reverse();

  // 日付ラベル
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
        label: "KPM",
        borderColor: "#3490d1", // 青
        backgroundColor: "#3490d1",
        data: kpmData,
        yAxisID: "y-left", // 左の軸を使う
        tension: 0.3, // 線をちょっと滑らかにする
      },
      {
        label: "正確率 (%)",
        borderColor: "#41a9a5", // 緑
        backgroundColor: "#41a9a5",
        data: accData,
        yAxisID: "y-right", // 右の軸を使う
        tension: 0.3,
      },
    ],
  };
});

/**
 * オプション設定
 */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 高さをCSSで自由に決めるため
  interaction: {
    mode: "index",
    intersect: false,
  },
  scales: {
    "y-left": {
      type: "linear",
      display: true,
      position: "left",
      title: { display: true, text: "KPM" }, //TODO 文字色やフォントの指定はできるのか？
    },
    "y-right": {
      type: "linear",
      display: true,
      position: "right",
      min: 0,
      max: 100,
      title: { display: true, text: "正確率 (%)" }, //TODO 文字色やフォントの指定はできるのか？
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
  height: 350px; // グラフの高さ

  @include tab {
    height: 450px;
  }
}
</style>