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
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
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

// =========================================================================
// Props & Emits
// =========================================================================
const props = defineProps({
  // 履歴データ (新しい順に入ってる想定)
  sessions: { type: Array, required: true },
});

// =========================================================================
// Helpers (便利ツール)
// =========================================================================
/**
 * :rootに定義されたCSS変数（カスタムプロパティ）の値を取得する
 * @param {string} varName - CSS変数名 (例: '--color-blue')
 */
const getCssVar = (varName) => {
  if (typeof document === "undefined") return ""; // 安全対策
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
};

// =========================================================================
// Getters (算出状態)
// =========================================================================

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

  // KPMデータと正確率データ
  const kpmData = reversedSessions.map((s) => Math.round(s.average_kpm));
  const accData = reversedSessions.map((s) => Math.round(s.average_accuracy));

  // CSS変数を取得（予備色も設定）
  const colorBlue = getCssVar("--color-blue") || "#3490d1";
  const colorGreen = getCssVar("--color-green") || "#41a9a5";

  return {
    labels,
    datasets: [
      {
        label: "KPM",
        borderColor: colorBlue,
        backgroundColor: colorBlue,
        data: kpmData,
        yAxisID: "y-left", // 左の軸を使う
        tension: 0.3, // 線をちょっと滑らかにする
      },
      {
        label: "正確率 (%)",
        borderColor: colorGreen,
        backgroundColor: colorGreen,
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
const chartOptions = computed(() => {
  // CSS変数を取得
  const colorBlack = getCssVar("--color-black") || "#444444";
  const colorBlue = getCssVar("--color-blue") || "#3490d1";
  const colorGreen = getCssVar("--color-green") || "#41a9a5";
  const fontNoto = getCssVar("--font-noto") || "'Noto Sans JP', sans-serif";
  const fontRoboto = getCssVar("--font-roboto") || "'Roboto Mono', monospace";

  return {
    responsive: true,
    maintainAspectRatio: false, // 高さをCSSで自由に決めるため
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        // 上に出る凡例の設定
        labels: {
          color: colorBlack,
          font: {
            family: fontNoto,
            weight: "bold",
          },
        },
      },
    },
    scales: {
      x: {
        // 横軸（日付）の設定
        ticks: {
          color: colorBlack,
          font: {
            family: fontRoboto,
            weight: "bold",
          },
        },
      },
      "y-left": {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "KPM",
          color: colorBlue,
          font: {
            family: fontNoto,
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          color: colorBlue,
          font: {
            family: fontRoboto,
          },
        },
      },
      "y-right": {
        type: "linear",
        display: true,
        position: "right",
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "正確率 (%)",
          color: colorGreen,
          font: {
            family: fontNoto,
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          color: colorGreen,
          font: {
            family: fontRoboto,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
});
</script>

<style lang="scss" scoped>
.growth-chart {
  width: 100%;

  /* グラフの高さ */
  height: 35rem;

  @include tab {
    height: 45rem;
  }
}
</style>