<template>
  <div class="result-view">
    <h1 class="result-view__title">
      <span class="en">TYPING RESULT</span>
      <span class="ja">タイピング結果</span>
    </h1>

    <div class="result-view__contents-wrapper">
      <div v-if="resultData" class="result-view__top-wrapper">
        <div class="result-view__result-card-wrapper">
          <div class="result-view__result-card">
            <KpmIcon
              class="result-view__card-icon result-view__card-icon--kpm"
            />
            <span class="result-view__card-title result-view__card-title--en"
              >KPM</span
            >
            <span
              class="result-view__card-value result-view__card-value--kpm"
              >{{ Math.round(resultData.stats.kpm) }}</span
            >
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
            <div class="result-view__rank-circle-wrapper">
              <svg class="result-view__progress-ring" viewBox="0 0 100 100">
                <circle
                  class="result-view__progress-ring-background"
                  stroke-width="10"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <circle
                  class="result-view__progress-ring-circle"
                  stroke-width="10"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  :class="{
                    'rank-s': rank === 'S',
                    'rank-a': rank === 'A',
                    'rank-b': rank === 'B',
                    'rank-c': rank === 'C',
                  }"
                  :stroke-dasharray="circumference"
                  :style="{ strokeDashoffset: currentOffset }"
                />
              </svg>
            </div>
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
          <div class="result-view__ai-image-wrapper">
            <AiIcon class="result-view__ai-icon" />
          </div>
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
        <div class="result-view__actions">
          <button
            class="result-view__button result-view__button--retry"
            @click="handleRetry"
          >
            もう一度やる！
            <ArrowIcon class="result-view__arrow-icon" />
          </button>
          <RouterLink
            to="/menu"
            class="result-view__button result-view__button--menu"
          >
            メニューに戻る
            <ArrowIcon class="result-view__arrow-icon" />
          </RouterLink>
        </div>
      </div>
      <div v-if="resultData" class="result-view__details">
        <h2 class="result-view__details-title">詳細結果</h2>
        <div class="result-view__table-wrapper">
          <table class="result-view__table">
            <thead>
              <tr class="result-view__tr">
                <th class="result-view__th result-view__th--problem">問題文</th>
                <th class="result-view__th result-view__th--romaji">
                  ローマ字
                </th>
                <th class="result-view__th result-view__th--kpm">KPM</th>
                <th class="result-view__th result-view__th--acc">正確率</th>
                <th class="result-view__th result-view__th--miss-keys">
                  ミスしたキー
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(problem, index) in resultData.results"
                class="result-view__tr"
                :key="index"
              >
                <td class="result-view__td result-view__td--problem">
                  {{ problem.problem_text }}
                </td>
                <td class="result-view__td result-view__td--romaji">
                  {{ problem.romaji_text || "-" }}
                </td>
                <td class="result-view__td result-view__td--kpm">
                  {{ Math.round(problem.kpm) }}
                </td>
                <td class="result-view__td result-view__td--acc">
                  {{ Math.round(problem.accuracy) }}%
                </td>
                <td class="result-view__td result-view__td--miss-keys">
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
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalMissCountIcon from "@/components/icons/TotalMissCountIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import ScoreIcon from "@/components/icons/ScoreIcon.vue";
import AiIcon from "@/components/icons/AiIcon.vue";

const router = useRouter();
const resultData = ref(null);
const aiComment = ref("");
const isCommentLoading = ref(false);
/**
 * 円の半径
 */
const radius = 45;

/**
 * 円周の長さ（2 * π * r）
 */
const circumference = 2 * Math.PI * radius;

const maxScore = 350;

const currentOffset = computed(() => {
  const validPercent = Math.min(100, Math.max(0, percent.value));

  // 計算式：円周 - (進捗割合 * 円周)
  return circumference - (validPercent / 100) * circumference;
});

const score = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;
  return Math.round(kpm * (acc / 100));
});

const percent = computed(() => {
  if (!score.value || score.value === "-") {
    return "-";
  }

  return Math.round((score.value / maxScore) * 100);
});

// --- ランク判定 ---
const rank = computed(() => {
  if (!percent.value) return "-";

  if (percent.value >= 95) return "S";
  if (percent.value >= 75) return "A";
  if (percent.value >= 60) return "B";
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

  &__contents-wrapper {
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
    @include contents-padding;
  }

  &__top-wrapper {
    display: grid;
    gap: 3.2rem;
    max-width: 400px;
    margin-inline: auto;

    @include pc {
      justify-content: space-between;
      grid-template-columns: 656px 312px;
      row-gap: 3.2rem;
      column-gap: 0;
      max-width: none;
      margin-inline: 0;
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
    position: relative;
    display: grid;
    place-content: center;
    width: 10.8rem;
    height: 10.8rem;
  }

  &__rank-circle-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  &__progress-ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__progress-ring-background {
    stroke: $light-black;
  }

  &__progress-ring-circle {
    stroke-dasharray: 283;
    stroke-dashoffset: 283;
    transition: stroke-dashoffset 0.4s linear, stroke $transition-base;

    &.rank-c {
      stroke: $blue;
    }

    &.rank-b {
      stroke: $green;
    }

    &.rank-a {
      stroke: $orange;
    }

    &.rank-s {
      stroke: $yellow;
    }
  }

  &__rank-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__rank-text {
    font-family: $roboto-mono;
    font-size: 5rem;
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
    flex-shrink: 0;
    display: grid;
    place-content: center;
    width: 8rem;
    aspect-ratio: 1;
    border-radius: 100vmax;
    background-color: $gray;
  }

  &__ai-icon {
    width: 6.4rem;
    aspect-ratio: 1;
  }

  &__ai-comment-wrapper {
    position: relative;
    width: 100%;
    min-height: 200px;
    @include fluid-style(padding, 16, 24);
    background-color: $light-yellow;
    border-radius: $radius-lg;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      width: 20px;
      aspect-ratio: 1;
      background-color: $light-yellow;
      clip-path: polygon(0 100%, 100% 100%, 50% 0);
      transform: translate(-50%, calc(-100% + 1px));
    }

    @include pc {
      &::after {
        top: 50%;
        left: 0;
        clip-path: polygon(100% 0, 100% 100%, 0 50%);
        transform: translate(calc(-100% + 1px), -50%);
      }
    }
  }

  &__ai-comment {
    @include fluid-text(14, 16);
    font-weight: $bold;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    @include pc {
      justify-content: space-around;
      gap: 0;
    }
  }

  &__button {
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);

    &--retry {
      @include button-style-fill($blue);
    }

    &--menu {
      @include button-style-border($green);
    }

    @include pc {
      width: 100%;
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
  }

  &__details-title {
    text-align: center;
    @include fluid-text(16, 20);
    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__table-wrapper {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    min-width: 1000px;
  }

  &__tr {
    &:nth-of-type(odd) {
      background-color: $gray;
    }
  }

  &__th {
    padding: 1em;
    font-size: 1.4rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
    color: $white;
    background-color: $green;

    &--problem,
    &--romaji {
      width: 30%;
      text-align: left;
    }

    &--kpm {
      width: 10%;
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
      text-align: right;
    }

    &--acc {
      width: 10%;
      text-align: right;
    }

    &--miss-keys {
      width: 20%;
      text-align: left;
    }
  }

  &__td {
    padding: 1em;
    font-size: 1.4rem;
    line-height: 1;

    &--problem,
    &--romaji {
      text-align: left;
    }

    &--kpm {
      font-family: $roboto-mono;
      color: $blue;
      text-align: right;
    }

    &--acc {
      color: $green;
      text-align: right;
    }

    &--miss-keys {
      color: $red;
      text-align: left;
    }
  }
}
</style>