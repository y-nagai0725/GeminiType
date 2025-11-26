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

      <div class="result-view__ai-comment">
        <div class="ai-icon">🤖</div>
        <div class="ai-bubble">
          <p v-if="isCommentLoading" class="ai-loading">
            コーチがコメントを考えています...
          </p>
          <p v-else class="ai-text">
            {{ aiComment }}
          </p>
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
          to="/menu"
          class="result-view__button result-view__button--menu"
        >
          メニューに戻る
        </RouterLink>
      </div>

      <div class="result-view__details">
        <h3>詳細結果</h3>
        <div class="result-view__table-wrapper">
          <table class="result-view__table">
            <thead>
              <tr>
                <th class="col-problem">問題</th>
                <th class="col-romaji">ローマ字</th>
                <th class="col-kpm">KPM</th>
                <th class="col-acc">Acc.</th>
                <th class="col-miss-count">Miss</th>
                <th class="col-miss-keys">Missed Keys</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(problem, index) in resultData.results" :key="index">
                <td class="text-left">{{ problem.problem_text }}</td>
                <td class="text-left text-romaji">
                  {{ problem.romaji_text || "-" }}
                </td>
                <td class="text-bold">{{ Math.round(problem.kpm) }}</td>
                <td class="text-bold">{{ Math.round(problem.accuracy) }}%</td>
                <td class="text-miss">{{ problem.miss_count }}</td>
                <td class="text-miss-keys">
                  {{ formatMissedKeys(problem.missed_keys) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
import api from "../services/api";
import { formatMissedKeys } from "../utils/formatters";

const router = useRouter();
const resultData = ref(null);
const aiComment = ref("");
const isCommentLoading = ref(false);

// --- ランク判定 ---
const rank = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;

  if (acc < 80) return "C";
  if (kpm >= 300) return "S";
  if (kpm >= 200) return "A";
  if (kpm >= 100) return "B";
  return "C";
});

// --- マウント時処理 ---
onMounted(async () => {
  const savedResult = localStorage.getItem("last_session_result");
  if (savedResult) {
    resultData.value = JSON.parse(savedResult);
    await fetchAiComment();
  } else {
    router.push("/");
  }
});

// --- AIコメント取得 ---
const fetchAiComment = async () => {
  if (!resultData.value) return;
  isCommentLoading.value = true;
  try {
    const totalMissedKeys = {};
    resultData.value.results.forEach((result) => {
      const keys = result.missed_keys || {};
      for (const [key, count] of Object.entries(keys)) {
        totalMissedKeys[key] = (totalMissedKeys[key] || 0) + count;
      }
    });

    const response = await api.post("/api/typing/ai-comment", {
      kpm: Math.round(resultData.value.stats.kpm),
      accuracy: Math.round(resultData.value.stats.accuracy),
      missedKeys: totalMissedKeys,
    });

    aiComment.value = response.data.comment;
  } catch (error) {
    console.error("AIコメント取得エラー:", error);
    aiComment.value =
      "お疲れ様！ (AIコメントの取得に失敗しちゃったけど、応援してるよ！)";
  } finally {
    isCommentLoading.value = false;
  }
};

// --- リトライ処理 ---
const handleRetry = () => {
  const savedConfig = localStorage.getItem("last_session_config");
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    router.push({
      path: "/typing/play",
      query: {
        mode: config.mode,
        genreId: config.genreId,
        prompt: config.prompt,
      },
    });
  } else {
    router.push("/");
  }
};
</script>

<style lang="scss" scoped>
.result-view {
  max-width: 1000px; /* (★) 幅を広げたよ！ */
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

  /* AIコメントエリア */
  &__ai-comment {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;

    .ai-icon {
      font-size: 3rem;
      background: #e6f2ff;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-bubble {
      background: #e6f2ff;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      border-top-left-radius: 0;
      text-align: left;
      color: #333;
      position: relative;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      min-height: 60px;
      display: flex;
      align-items: center;
      flex: 1;

      .ai-loading {
        color: #666;
        font-style: italic;
      }
      .ai-text {
        line-height: 1.5;
        font-weight: bold;
      }
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

  /* (★) テーブルラッパー追加 */
  &__table-wrapper {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: #f1f1f1;
      padding: 0.8rem;
      font-weight: bold;
      color: #555;
      white-space: nowrap;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
      text-align: center;
    }
    .text-left {
      text-align: left;
    }
    .text-bold {
      font-weight: bold;
      color: #333;
    }

    /* (★) スタイル追加 */
    .text-romaji {
      font-family: "Courier New", monospace;
      color: #666;
      font-size: 0.9rem;
    }
    .text-miss {
      color: #dc3545;
      font-weight: bold;
    }
    .text-miss-keys {
      color: #dc3545;
      font-size: 0.85rem;
    }

    /* (★) 列幅調整 (SessionDetailViewと合わせたよ！) */
    .col-problem {
      min-width: 150px;
    }
    .col-romaji {
      min-width: 150px;
    }
    .col-kpm,
    .col-acc,
    .col-miss-count {
      width: 80px;
    }
    .col-miss-keys {
      min-width: 120px;
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