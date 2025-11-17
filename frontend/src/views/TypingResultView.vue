<template>
  <div class="result-view">
    <h1 class="result-view__title">Result</h1>

    <div v-if="resultData" class="result-view__content">
      <div class="result-view__score-board">
        <div class="result-view__score-item">
          <span class="label">WPM</span>
          <span class="value">{{ Math.round(resultData.stats.wpm) }}</span>
        </div>
        <div class="result-view__score-item">
          <span class="label">Accuracy</span>
          <span class="value"
            >{{ Math.round(resultData.stats.accuracy) }}%</span
          >
        </div>
        <div class="result-view__rank">
          Rank: <span :class="`rank-${rank}`">{{ rank }}</span>
        </div>
      </div>

      <div class="result-view__actions">
        <button class="result-view__button --retry" @click="handleRetry">
          もう一度やる！
        </button>
        <RouterLink to="/" class="result-view__button --menu">
          メニューに戻る
        </RouterLink>
      </div>

      <div class="result-view__details">
        <h3>詳細</h3>
        <table class="result-view__table">
          <thead>
            <tr>
              <th>問題</th>
              <th>WPM</th>
              <th>Acc.</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(problem, index) in resultData.results" :key="index">
              <td class="text-left">{{ problem.problem_text }}</td>
              <td>{{ Math.round(problem.wpm) }}</td>
              <td>{{ Math.round(problem.accuracy) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="result-view__error">
      <p>結果データが見つかりません…</p>
      <RouterLink to="/">トップへ戻る</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const resultData = ref(null);

// (★) 簡易ランク判定ロジック
const rank = computed(() => {
  if (!resultData.value) return "-";
  const wpm = resultData.value.stats.wpm;
  const acc = resultData.value.stats.accuracy;

  if (acc < 80) return "C"; // 正確率が低いとランクダウン
  if (wpm >= 200) return "S";
  if (wpm >= 150) return "A";
  if (wpm >= 100) return "B";
  return "C";
});

onMounted(() => {
  // 1. localStorageから結果を読み込む
  const savedResult = localStorage.getItem("last_session_result");
  if (savedResult) {
    resultData.value = JSON.parse(savedResult);
  } else {
    // データがない（直接アクセスとか）なら戻す
    router.push("/");
  }
});

/**
 * 「もう一度やる！」ボタン
 */
const handleRetry = () => {
  // 1. 保存しておいた設定を読み込む
  const savedConfig = localStorage.getItem("last_session_config");

  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    // 2. 設定を持ってゲーム画面へワープ！
    router.push({
      path: "/typing/play",
      query: {
        mode: config.mode,
        genreId: config.genreId,
        prompt: config.prompt,
      },
    });
  } else {
    // 設定がなければメニューへ
    router.push("/");
  }
};
</script>

<style lang="scss" scoped>
.result-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  text-align: center;
  font-family: sans-serif;

  &__title {
    font-size: 2rem;
    color: #333;
    margin-bottom: 2rem;
  }

  &__score-board {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-bottom: 2rem;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 12px;
  }

  &__score-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 1rem;
      color: #666;
    }
    .value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #007bff;
    }
  }

  &__rank {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;

    .rank-S {
      color: #ffc107;
      font-size: 3rem;
    }
    .rank-A {
      color: #fd7e14;
      font-size: 3rem;
    }
    .rank-B {
      color: #007bff;
      font-size: 3rem;
    }
    .rank-C {
      color: #6c757d;
      font-size: 3rem;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;
  }

  &__button {
    padding: 0.8rem 2rem;
    border-radius: 30px;
    text-decoration: none;
    font-weight: bold;
    cursor: pointer;
    border: none;
    transition: transform 0.1s;

    &:active {
      transform: scale(0.95);
    }

    &.--retry {
      background-color: #28a745;
      color: white;
      font-size: 1.2rem;
      &:hover {
        background-color: #218838;
      }
    }

    &.--menu {
      background-color: #6c757d;
      color: white;
      display: flex;
      align-items: center;
      &:hover {
        background-color: #5a6268;
      }
    }
  }

  &__details {
    text-align: left;
    h3 {
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;

    th {
      background: #eee;
      padding: 0.5rem;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
      text-align: center;
    }
    .text-left {
      text-align: left;
    }
  }
}
</style>