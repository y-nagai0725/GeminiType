<template>
  <div class="result-view">
    <h1 class="result-view__title">Result</h1>

    <div v-if="resultData" class="result-view__content">
      <div class="result-view__score-board">
        <div class="result-view__score-item">
          <span class="label">KPM</span>
          <span class="value">{{ Math.round(resultData.stats.kpm) }}</span>
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
        <button
          class="result-view__button result-view__button--retry"
          @click="handleRetry"
        >
          もう一度やる！
        </button>
        <RouterLink
          to="/"
          class="result-view__button result-view__button--menu"
        >
          メニューに戻る
        </RouterLink>
      </div>

      <div class="result-view__details">
        <h3>詳細結果</h3>
        <table class="result-view__table">
          <thead>
            <tr>
              <th class="col-problem">問題</th>
              <th class="col-kpm">KPM</th>
              <th class="col-acc">Acc.</th>
              <th class="col-miss">Missed Keys</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(problem, index) in resultData.results" :key="index">
              <td class="text-left">{{ problem.problem_text }}</td>
              <td>{{ Math.round(problem.kpm) }}</td>
              <td>{{ Math.round(problem.accuracy) }}%</td>
              <td class="text-miss">
                {{ formatMissedKeys(problem.missed_keys) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="result-view__error">
      <p>結果データが見つかりません…</p>
      <RouterLink to="/" class="result-view__link">トップへ戻る</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

/**
 * router
 */
const router = useRouter();

/**
 * 結果データ (localStorageから読み込む)
 */
const resultData = ref(null);

/**
 * ランク判定ロジック
 * (S, A, B, C)
 */
const rank = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;

  // 正確率が低いとランクダウン
  if (acc < 80) return "C";

  // TODO KPM基準 (仮)
  if (kpm >= 300) return "S";
  if (kpm >= 200) return "A";
  if (kpm >= 100) return "B";
  return "C";
});

/**
 * マウント時処理
 */
onMounted(() => {
  // 1. localStorageから結果を読み込む
  const savedResult = localStorage.getItem("last_session_result");
  if (savedResult) {
    resultData.value = JSON.parse(savedResult);
  } else {
    // データがない場合はトップへ戻す
    router.push("/");
  }
});

/**
 * 「もう一度やる！」ボタン処理
 */
const handleRetry = () => {
  // 1. 保存しておいた設定を読み込む
  const savedConfig = localStorage.getItem("last_session_config");

  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    // 2. 設定を持ってゲーム画面へ遷移
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

/**
 * ミスキーオブジェクトを文字列に変換する魔法
 * 例: { a: 2, k: 1 } -> "a(2), k(1)"
 * @param {Object} missedKeys
 * @returns {String}
 */
const formatMissedKeys = (missedKeys) => {
  if (!missedKeys || Object.keys(missedKeys).length === 0) {
    return "-"; // ミスなし！優秀！
  }

  // "キー(回数)" の形にして、カンマ区切りにするよ
  return Object.entries(missedKeys)
    .map(([key, count]) => `${key}(${count})`)
    .join(", ");
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
      text-shadow: 2px 2px 0 #fff, 0 0 5px #ffc107;
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

    &--retry {
      background-color: #28a745;
      color: white;
      font-size: 1.2rem;
      &:hover {
        background-color: #218838;
      }
    }

    &--menu {
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
      margin-bottom: 1rem;
      color: #555;
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: #f1f1f1;
      padding: 0.8rem;
      font-weight: bold;
      color: #555;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
      text-align: center;
    }
    .text-left {
      text-align: left;
    }

    /* (★) ミスキー列は赤文字で目立たせる？ */
    .text-miss {
      color: #dc3545;
      font-size: 0.9rem;
    }

    /* 列幅の調整 */
    .col-problem {
      width: 50%;
    }
    .col-kpm {
      width: 15%;
    }
    .col-acc {
      width: 15%;
    }
    .col-miss {
      width: 20%;
    }
  }

  &__error {
    margin-top: 3rem;
    font-size: 1.2rem;
    color: #666;
  }

  &__link {
    color: #007bff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>