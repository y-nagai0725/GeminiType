<template>
  <div class="result-view">
    <h1 class="result-view__title">
      <span class="en">TYPING RESULT</span>
      <span class="ja">タイピング結果</span>
    </h1>

    <div v-if="resultData" class="result-view__content-wrapper">
      <div class="result-view__result-card-wrapper">
        <div class="result-view__result-card">
          <KpmIcon class="result-view__card-icon result-view__card-icon--kpm" />
          <span class="result-view__card-title result-view__card-title--en"
            >KPM</span
          >
          <span class="result-view__card-value result-view__card-value--kpm">{{
            Math.round(resultData.stats.kpm)
          }}</span>
        </div>
        <div class="result-view__result-card">
          <AccuracyIcon
            class="result-view__card-icon result-view__card-icon--accuracy"
          />
          <span class="result-view__card-title">正確率</span>
          <span
            class="result-view__card-value result-view__card-value--accuracy"
            >{{ Math.round(resultData.stats.accuracy) }}%</span
          >
        </div>
        <div class="result-view__result-card">
          <TotalMissCountIcon
            class="result-view__card-icon result-view__card-icon--total-miss-count"
          />
          <span class="result-view__card-title">ミス回数</span>
          <span
            class="result-view__card-value result-view__card-value--total-miss-count"
            >{{ resultData.stats.total_miss_count }}</span
          >
        </div>
        <div class="result-view__result-card">
          <TotalTypeCountIcon
            class="result-view__card-icon result-view__card-icon--total-type-count"
          />
          <span class="result-view__card-title">総タイプ数</span>
          <span
            class="result-view__card-value result-view__card-value--total-type-count"
            >{{ resultData.stats.total_types }}</span
          >
        </div>
      </div>
      <div class="result-view__score-card">
        <div class="result-view__score-item">
          <ScoreIcon
            class="result-view__card-icon result-view__card-icon--score"
          />
          <span class="result-view__card-title">スコア</span>
          <span
            class="result-view__card-value result-view__card-value--score"
            >{{ score }}</span
          >
        </div>
        <div class="result-view__rank-item">
          <div class="result-view__rank-circle-wrapper"></div>
          <div class="result-view__rank-wrapper">
            <span
              class="result-view__rank-text"
              :class="{
                'rank-s': rank === 'S',
                'rank-a': rank === 'A',
                'rank-b': rank === 'B',
                'rank-c': rank === 'C',
              }"
              >{{ rank }}</span
            >
            <span class="result-view__rank-title">Rank</span>
          </div>
        </div>
      </div>
      <div class="result-view__ai-area">
        <div class="result-view__ai-image-wrapper"></div>
        <div class="result-view__ai-comment-wrapper">
          <p
            v-if="isCommentLoading"
            class="result-view__ai-comment result-view__ai-comment--loading"
          >
            AIがコメントを考えています...
          </p>
          <p v-else class="result-view__ai-comment">
            {{ aiComment }}
          </p>
        </div>
      </div>
      <div class="result-view__actions-wrapper"></div>
    </div>

    <div v-if="resultData" class="result-view__content">
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
                <td class="text-miss-keys">
                  {{ formatMissedKeys(problem.missed_keys) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { formatMissedKeys } from "../utils/formatters";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalMissCountIcon from "@/components/icons/TotalMissCountIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import ScoreIcon from "@/components/icons/ScoreIcon.vue";

const router = useRouter();
const resultData = ref(null);
const aiComment = ref("");
const isCommentLoading = ref(false);

const score = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;
  return Math.round(kpm * (acc / 100));
});

// --- ランク判定 ---
const rank = computed(() => {
  if (!resultData.value) return "-";

  if (score.value >= 300) return "S";
  if (score.value >= 250) return "A";
  if (score.value >= 200) return "B";
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
      specialModeInfo: resultData.value.specialModeInfo,
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
  @include contents-width;

  @include pc {
    max-width: 1000px;
  }

  &__title {
    @include page-title;
  }

  &__content-wrapper {
    display: grid;
    gap: 3.2rem;
    max-width: 400px;
    margin-inline: auto;
    @include contents-padding;

    @include pc {
      justify-content: space-between;
      grid-template-columns: 656px 312px;
      row-gap: 3.2rem;
      column-gap: 0;
      max-width: none;
    }
  }

  &__result-card-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    row-gap: 2.4rem;

    @include pc {
      grid-template-columns: repeat(4, 1fr);
      row-gap: 0;
      column-gap: 3.2rem;
    }
  }

  &__result-card {
    justify-self: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 14rem;
    aspect-ratio: 1;
    padding: 1.6rem 0;
    border-radius: $radius-lg;
    background-color: $gray;

    @include pc {
      justify-self: auto;
    }
  }

  &__card-icon {
    width: 4rem;
    line-height: 1;

    &--kpm {
      fill: $blue;
    }

    &--accuracy {
      fill: $green;
    }

    &--total-miss-count {
      fill: $red;
    }

    &--total-type-count {
      fill: $light-black;
    }

    &--score {
      stroke: $orange;
    }
  }

  &__card-title {
    font-size: 1.6rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;

    &--en {
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
    }
  }

  &__card-value {
    font-family: $roboto-mono;
    font-size: 2.2rem;
    font-weight: $bold;
    line-height: 1;

    &--kpm {
      color: $blue;
    }

    &--accuracy {
      color: $green;
    }

    &--total-miss-count {
      color: $red;
    }

    &--total-type-count {
      color: $light-black;
    }

    &--score {
      color: $orange;
    }
  }

  &__score-card {
    display: flex;
    justify-content: center;
    gap: 4rem;
    width: 100%;
    height: 14rem;
    padding: 1.6rem 0;
    border-radius: $radius-lg;
    background-color: $gray;
  }

  &__score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  &__rank-item {
    display: grid;
    place-content: center;
    width: 10.8rem;
    aspect-ratio: 1;
  }

  &__rank-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__rank-text {
    font-family: $roboto-mono;
    font-size: 5.4rem;
    font-weight: $bold;
    line-height: 1;

    &.rank-s {
      color: $yellow;
    }

    &.rank-a {
      color: $orange;
    }

    &.rank-b {
      color: $green;
    }

    &.rank-c {
      color: $blue;
    }
  }

  &__rank-title {
    font-family: $roboto-mono;
    font-size: 1.6rem;
    font-weight: $bold;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  &__ai-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3.2rem;

    @include pc {
      flex-direction: row;
    }
  }

  &__ai-image-wrapper {
    width: 8rem;
    aspect-ratio: 1;
    border-radius: 100vmax;
    background-color: $gray;
  }

  &__ai-comment-wrapper {
    min-height: 190px;
    @include fluid-style(padding, 16, 24);
    background-color: $light-yellow;
    border-radius: $radius-lg;

    @include pc {
      min-height: 190px;
    }
  }

  &__ai-comment {
    @include fluid-text(14, 16);
    font-weight: $bold;
    line-height: 1.8;
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