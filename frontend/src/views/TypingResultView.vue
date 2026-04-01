<template>
  <div class="result-view">
    <h1 class="result-view__title">
      <span class="en">TYPING RESULT</span>
      <span class="ja">タイピング結果</span>
    </h1>

    <div class="result-view__contents-wrapper" ref="resultWrapperRef">
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
                  :class="scoreRankClass"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="progressCircleDashoffset"
                />
              </svg>
            </div>
            <div class="result-view__rank-wrapper">
              <span class="result-view__rank-text" :class="scoreRankClass">{{
                rank
              }}</span>
              <span class="result-view__rank-title">Rank</span>
            </div>
          </div>
        </div>
        <div class="result-view__ai-area">
          <div class="result-view__ai-image-wrapper">
            <AiIcon class="result-view__ai-icon" />
          </div>
          <div class="result-view__ai-comment-wrapper">
            <p v-if="isCommentLoading" class="result-view__ai-comment">
              <Loading
                class="result-view__loading"
                :text="'AIがコメントを考えています…'"
                :bgColor="'white'"
              />
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
            メインメニューに戻る
            <ArrowIcon class="result-view__arrow-icon" />
          </RouterLink>
        </div>
      </div>
      <div v-if="resultData" class="result-view__details">
        <h2 class="result-view__details-title">詳細結果</h2>
        <div class="result-view__table-container">
          <ScrollHint :show="!scrollStates.table" />
          <div
            class="result-view__table-wrapper"
            @scroll="handleScroll($event, 'table')"
          >
            <table class="result-view__table">
              <thead>
                <tr class="result-view__tr">
                  <th class="result-view__th result-view__th--problem">
                    問題文
                  </th>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
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
import Loading from "@/components/Loading.vue";
import ScrollHint from "@/components/ScrollHint.vue";
import gsap from "gsap";

/**
 * router
 */
const router = useRouter();

/**
 * GSAPアニメーションのスコープ（範囲）用
 */
const resultWrapperRef = ref(null);

/**
 * スクロールヒントの非表示状態を管理するオブジェクト
 */
const scrollStates = ref({
  table: false,
});

/**
 * タイピング結果データ
 */
const resultData = ref(null);

/**
 * 結果に対してのAIのコメント
 */
const aiComment = ref("");

/**
 * AIコメント生成時のローディング
 */
const isCommentLoading = ref(false);

/**
 * スコアランククラス名
 */
const scoreRankClass = ref("rank-c");

/**
 * ランクテキスト
 */
const rank = ref("C");

/**
 * 円の半径
 */
const radius = 45;

/**
 * 円周の長さ（2 * π * r）
 */
const circumference = 2 * Math.PI * radius;

/**
 * スコアの最大値
 */
const maxScore = 350;

/**
 * スコアランクプログレスバー（円）のstroke-dashoffset
 */
const progressCircleDashoffset = ref(circumference);

/**
 * 結果ランクのstroke-dashoffset
 */
const resultDashoffset = computed(() => {
  const validPercent = Math.min(100, Math.max(0, scorePercent.value));

  // 計算式：円周 - (進捗割合 * 円周)
  return circumference - (validPercent / 100) * circumference;
});

/**
 * スコア値
 */
const score = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;
  return Math.round(kpm * (acc / 100));
});

/**
 * スコアの割合
 */
const scorePercent = computed(() => {
  if (!score.value || score.value === "-") {
    return "-";
  }

  return Math.round((score.value / maxScore) * 100);
});

/**
 * GSAPコンテキスト
 */
let gsapContext;

/**
 * マウント時処理
 */
onMounted(async () => {
  const savedResult = localStorage.getItem("last_session_result");
  if (savedResult) {
    resultData.value = JSON.parse(savedResult);
    await nextTick();
    setResultCardAnimation();
    fetchAiComment();
  } else {
    router.push("/");
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  // コンポーネントが破棄される時にアニメーションをリセットする
  if (gsapContext) {
    gsapContext.revert();
  }
});

/**
 * スクロールイベントハンドラ
 */
const handleScroll = (e, targetKey) => {
  // すでにヒントが消えているなら何もしない
  if (scrollStates.value[targetKey]) return;

  // 5px以上スクロールされたらヒントを消す
  if (e.target.scrollLeft > 5) {
    scrollStates.value[targetKey] = true;
  }
};

/**
 * AIコメント取得
 */
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

/**
 * リトライ処理
 */
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

/**
 * 結果表示アニメーション設定
 */
const setResultCardAnimation = () => {
  // アニメーション共通設定：開始状態
  const fromAnimationSettings = {
    autoAlpha: 0,
    y: 20,
  };

  // アニメーション共通設定：終了状態
  const toAnimationSettings = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8, // 0.8秒かけて表示
    ease: "power2.out",
  };

  // アニメーション設定の「ずらす間隔」
  const staggerTime = 0.2;

  // アニメーション設定
  gsapContext = gsap.context(() => {
    // 各結果要素
    const resultCards = gsap.utils.toArray(".result-view__result-card");

    // スコア
    const scoreCard = ".result-view__score-card";

    // AIコメント
    const aiArea = ".result-view__ai-area";

    // アクション要素（リンクボタン部分）
    const actions = ".result-view__actions";

    // 詳細結果
    const details = ".result-view__details";

    // timelineを作成
    const tl = gsap.timeline();

    // 各結果要素のアニメーション設定
    tl.fromTo(
      resultCards,
      { ...fromAnimationSettings },
      { ...toAnimationSettings, stagger: staggerTime }
    );

    // スコアのアニメーション設定
    tl.fromTo(
      scoreCard,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );

    // ランクのプログレスバーのアニメーション設定
    tl.fromTo(
      progressCircleDashoffset,
      {
        value: circumference,
      },
      {
        value: resultDashoffset.value,
        duration: 1.5,
        ease: "power3.out", // 最初は早く、最後はゆっくり
      },
      "-=0.6"
    );

    // AIコメントのアニメーション設定
    tl.fromTo(
      aiArea,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );

    // アクション要素のアニメーション設定
    tl.fromTo(
      actions,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );

    // 詳細結果のアニメーション設定
    tl.fromTo(
      details,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
  }, resultWrapperRef.value);
};

/**
 * スコアランクプログレスバー値を監視
 */
watch(progressCircleDashoffset, (newValue) => {
  // プログレスバー割合
  const percent = (1 - newValue / circumference) * 100;

  // 割合でランク付け
  if (percent >= 95) {
    // 95%以上でSランク
    scoreRankClass.value = "rank-s";
    rank.value = "S";
  } else if (percent >= 75) {
    // 75%以上でAランク
    scoreRankClass.value = "rank-a";
    rank.value = "A";
  } else if (percent >= 60) {
    // 60%以上でBランク
    scoreRankClass.value = "rank-b";
    rank.value = "B";
  } else {
    // 60%未満でCランク
    scoreRankClass.value = "rank-c";
    rank.value = "C";
  }
});
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
    width: 100%;
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
    @include fluid-style(gap, 16, 30);
    min-width: 0;

    @include pc {
      grid-template-columns: repeat(4, 1fr);
      row-gap: 0;
      column-gap: 3.2rem;
    }
  }

  &__result-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    aspect-ratio: 1;
    padding: 1.6rem 0;
    border-radius: $radius-lg;
    background-color: $gray;
    visibility: hidden; // GSAPアニメーション用
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
    visibility: hidden; // GSAPアニメーション用
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
    transition: stroke $transition-base;

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
    transition: color $transition-base;

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
    visibility: hidden; // GSAPアニメーション用

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
    visibility: hidden; // GSAPアニメーション用

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
    gap: 2.4rem;
    visibility: hidden; // GSAPアニメーション用
  }

  &__details-title {
    @include fluid-text(16, 20);
    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__table-container {
    position: relative;
    width: 100%;
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