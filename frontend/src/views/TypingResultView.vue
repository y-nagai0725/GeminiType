<template>
  <div class="result-view">
    <h1 class="result-view__title">
      <span class="en" aria-hidden="true">TYPING RESULT</span>
      <span class="ja">タイピング結果</span>
    </h1>

    <div class="result-view__contents-wrapper" ref="resultWrapperRef">
      <div v-if="resultData" class="result-view__top-wrapper">
        <div class="result-view__result-card-wrapper">
          <div class="result-view__result-card">
            <KpmIcon
              class="result-view__card-icon result-view__card-icon--kpm"
              aria-hidden="true"
            />
            <span class="result-view__card-title result-view__card-title--en"
              >KPM</span
            >
            <span class="result-view__card-value result-view__card-value--kpm">
              {{ Math.round(resultData.stats.kpm) }}
            </span>
          </div>
          <div class="result-view__result-card">
            <AccuracyIcon
              class="result-view__card-icon result-view__card-icon--accuracy"
              aria-hidden="true"
            />
            <span class="result-view__card-title">正確率</span>
            <span
              class="result-view__card-value result-view__card-value--accuracy"
            >
              {{ Math.round(resultData.stats.accuracy) }}%
            </span>
          </div>
          <div class="result-view__result-card">
            <TotalMissCountIcon
              class="result-view__card-icon result-view__card-icon--total-miss-count"
              aria-hidden="true"
            />
            <span class="result-view__card-title">ミス回数</span>
            <span
              class="result-view__card-value result-view__card-value--total-miss-count"
            >
              {{ resultData.stats.total_miss_count }}
              <span class="small">/ {{ resultData.stats.total_types }}</span>
            </span>
          </div>
          <div class="result-view__result-card">
            <WorstKeyIcon
              class="result-view__card-icon result-view__card-icon--worst-key"
              aria-hidden="true"
            />
            <span class="result-view__card-title">苦手キー</span>
            <span
              class="result-view__card-value result-view__card-value--worst-key"
            >
              {{
                !resultData.stats.most_missed_key
                  ? "NONE"
                  : resultData.stats.most_missed_key
              }}
            </span>
          </div>
        </div>

        <div class="result-view__score-card">
          <div class="result-view__score-item">
            <ScoreIcon
              class="result-view__card-icon result-view__card-icon--score"
              aria-hidden="true"
            />
            <span class="result-view__card-title">スコア</span>
            <span
              class="result-view__card-value result-view__card-value--score"
            >
              {{ score }}
            </span>
          </div>

          <ScoreRankCircle ref="scoreRankCircleRef" :score="score" />
        </div>

        <div class="result-view__ai-area">
          <div class="result-view__ai-image-wrapper">
            <Transition name="icon-fade" mode="out-in">
              <img
                :key="currentAiIcon"
                class="result-view__ai-image"
                :src="currentAiIcon"
                alt="AIアイコン画像"
              />
            </Transition>
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
            type="button"
            class="result-view__button result-view__button--retry"
            @click="handleRetry"
          >
            もう一度やる！
            <ArrowIcon class="result-view__arrow-icon" aria-hidden="true" />
          </button>
          <RouterLink
            to="/menu"
            class="result-view__button result-view__button--menu"
          >
            メインメニューに戻る
            <ArrowIcon class="result-view__arrow-icon" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>

      <div v-if="resultData" class="result-view__details">
        <h2 class="result-view__details-title">詳細結果</h2>
        <div class="result-view__table-container">
          <ScrollHint :show="!isTableHidden" />

          <Simplebar
            class="result-view__table-wrapper"
            ref="tableScrollRef"
            @scroll="handleTableScroll"
            :auto-hide="false"
          >
            <table class="result-view__table">
              <thead>
                <tr>
                  <th class="col-problem">問題文</th>
                  <th class="col-romaji">ローマ字</th>
                  <th class="col-kpm">KPM</th>
                  <th class="col-acc">正確率</th>
                  <th class="col-miss-keys">ミスしたキー</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(problem, index) in resultData.results" :key="index">
                  <td class="col-problem">{{ problem.problem_text }}</td>
                  <td class="col-romaji">{{ problem.romaji_text || "-" }}</td>
                  <td class="col-kpm">
                    {{
                      Math.round(problem.kpm) === 0
                        ? "-"
                        : Math.round(problem.kpm)
                    }}
                  </td>
                  <td class="col-acc">{{ Math.round(problem.accuracy) }}%</td>
                  <td
                    class="col-miss-keys"
                    :class="{
                      'is-none':
                        formatMissedKeys(problem.missed_keys) === 'NONE',
                    }"
                  >
                    {{ formatMissedKeys(problem.missed_keys) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </Simplebar>
        </div>
      </div>

      <div v-if="authStore.isLoggedIn" class="result-view__link-wrapper">
        <RouterLink
          to="/mypage"
          class="result-view__button result-view__button--mypage"
        >
          マイページへ
          <ArrowIcon class="result-view__arrow-icon" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRouter, RouterLink } from "vue-router";
import gsap from "gsap";

// --- Services & Utilities ---
import api from "../services/api";
import { formatMissedKeys } from "../utils/formatters";

// --- Stores ---
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../stores/authStore";

// --- Composables ---
import { useScrollHint } from "../composables/useScrollHint";

// --- Components ---
import ScoreRankCircle from "@/components/ScoreRankCircle.vue";
import Loading from "@/components/Loading.vue";
import ScrollHint from "@/components/ScrollHint.vue";
import Simplebar from "simplebar-vue";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalMissCountIcon from "@/components/icons/TotalMissCountIcon.vue";
import WorstKeyIcon from "@/components/icons/WorstKeyIcon.vue";
import ScoreIcon from "@/components/icons/ScoreIcon.vue";

// --- Images (AI Icons) ---
import iconLoading from "@/assets/images/typing-result/ai-icon-loading.webp";
import iconError from "@/assets/images/typing-result/ai-icon-error.webp";
import iconRankC from "@/assets/images/typing-result/ai-icon-rank-c.webp";
import iconRankB from "@/assets/images/typing-result/ai-icon-rank-b.webp";
import iconRankA from "@/assets/images/typing-result/ai-icon-rank-a.webp";
import iconRankS from "@/assets/images/typing-result/ai-icon-rank-s.webp";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ローディングの最低表示時間 (ミリ秒)
 * .env.local から取得し、設定されていなければ300msをデフォルトにします
 * @type {number}
 */
const MIN_LOADING_MS = Number(import.meta.env.VITE_MIN_LOADING_MS) || 300;

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * routerインスタンス
 * @type {import('vue-router').Router}
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * タイピング結果データ
 * @type {import('vue').Ref<Object|null>}
 */
const resultData = ref(null);

/**
 * 結果に対してのAIのコメント
 * @type {import('vue').Ref<string>}
 */
const aiComment = ref("");

/**
 * AIコメント生成時のローディング
 * @type {import('vue').Ref<boolean>}
 */
const isCommentLoading = ref(false);

/**
 * 現在表示するAIアイコン画像
 * @type {import('vue').Ref<string>}
 */
const currentAiIcon = ref(iconLoading);

// =========================================================================
// DOM / コンポーネント参照 (Refs)
// =========================================================================

/**
 * GSAPアニメーションのスコープ（範囲）用
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const resultWrapperRef = ref(null);

/**
 * ScoreRankCircleコンポーネントのメソッド呼び出し用
 * @type {import('vue').Ref<any>}
 */
const scoreRankCircleRef = ref(null);

// =========================================================================
// Composables 呼び出し
// =========================================================================

/**
 * テーブル用横スクロールヒント管理
 */
const {
  isHidden: isTableHidden,
  scrollRef: tableScrollRef,
  handleScroll: handleTableScroll,
  resetScroll: resetTableScroll,
} = useScrollHint();

// =========================================================================
// Computed (計算プロパティ)
// =========================================================================

/**
 * スコア値の算出 (KPM * (正確率 / 100)^3)
 * @type {import('vue').ComputedRef<number|string>}
 */
const score = computed(() => {
  if (!resultData.value) return "-";
  const kpm = resultData.value.stats.kpm;
  const acc = resultData.value.stats.accuracy;
  return Math.round(kpm * (acc / 100) ** 3);
});

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * AIコメント取得処理
 * @returns {Promise<void>}
 */
const fetchAiComment = async () => {
  if (!resultData.value) return;
  isCommentLoading.value = true;
  currentAiIcon.value = iconLoading; // 取得開始時はローディング用AIアイコン

  try {
    const totalMissedKeys = {};
    resultData.value.results.forEach((result) => {
      const keys = result.missed_keys || {};
      for (const [key, count] of Object.entries(keys)) {
        totalMissedKeys[key] = (totalMissedKeys[key] || 0) + count;
      }
    });

    const [response] = await Promise.all([
      api.post("/api/typing/ai-comment", {
        kpm: Math.round(resultData.value.stats.kpm),
        accuracy: Math.round(resultData.value.stats.accuracy),
        missedKeys: totalMissedKeys,
        specialModeInfo: resultData.value.specialModeInfo,
      }),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

    aiComment.value = response.data.comment;

    // ランクを取得
    let finalRank = "C";
    if (scoreRankCircleRef.value) {
      finalRank = scoreRankCircleRef.value.getFinalRank();
    }

    // 取得したランクに合わせてAIアイコンを切り替える
    if (finalRank === "S") {
      currentAiIcon.value = iconRankS;
    } else if (finalRank === "A") {
      currentAiIcon.value = iconRankA;
    } else if (finalRank === "B") {
      currentAiIcon.value = iconRankB;
    } else {
      currentAiIcon.value = iconRankC;
    }
  } catch (error) {
    console.error("AIコメント取得エラー:", error);
    aiComment.value =
      "お疲れ様！ (AIコメントの取得に失敗しちゃったけど、応援してるよ！)";
    currentAiIcon.value = iconError; // エラー時はエラー用AIアイコン
  } finally {
    isCommentLoading.value = false;
  }
};

/**
 * リトライ処理 (同じ設定でプレイ画面へ遷移)
 * @returns {void}
 */
const handleRetry = () => {
  const savedConfig = localStorage.getItem("last_session_config");

  if (!savedConfig) {
    // 前回の設定がない場合はメニューへ戻す
    notificationStore.addNotification(
      "前回の設定が読み込めませんでした。メニューから選び直してね！",
      "error"
    );
    router.push("/menu");
    return;
  }

  try {
    const config = JSON.parse(savedConfig);

    router.push({
      path: "/typing/play",
      query: {
        mode: config.mode,
        genreId: config.genreId,
        prompt: config.prompt,
      },
    });
  } catch (error) {
    console.error("Config Parse Error:", error);
    notificationStore.addNotification(
      "前回の設定が読み込めませんでした。メニューから選び直してね！",
      "error"
    );
    router.push("/menu");
  }
};

// =========================================================================
// GSAP アニメーション制御
// =========================================================================

/**
 * GSAPコンテキスト (アンマウント時のクリーンアップ用)
 * @type {import('gsap').Context}
 */
let gsapContext;

/**
 * 結果表示アニメーション設定
 * @returns {void}
 */
const setResultCardAnimation = () => {
  // アニメーション共通設定：開始状態
  const fromAnimationSettings = { autoAlpha: 0, y: 20 };

  // アニメーション共通設定：終了状態
  const toAnimationSettings = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
  };

  // アニメーション設定の「ずらす間隔」
  const staggerTime = 0.2;

  gsapContext = gsap.context(() => {
    const resultCards = gsap.utils.toArray(".result-view__result-card");
    const scoreCard = ".result-view__score-card";
    const aiArea = ".result-view__ai-area";
    const actions = ".result-view__actions";
    const details = ".result-view__details";

    // timelineを作成
    const tl = gsap.timeline();

    // 各カードの順次表示
    tl.fromTo(
      resultCards,
      { ...fromAnimationSettings },
      { ...toAnimationSettings, stagger: staggerTime }
    );
    tl.fromTo(
      scoreCard,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );

    // スコアランクプログレスバーのアニメーション発火
    tl.add(() => {
      if (scoreRankCircleRef.value) {
        scoreRankCircleRef.value.playAnimation();
      }
    }, "-=0.6");

    // その他のエリア表示
    tl.fromTo(
      aiArea,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
    tl.fromTo(
      actions,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
    tl.fromTo(
      details,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
  }, resultWrapperRef.value);
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(async () => {
  const savedResult = localStorage.getItem("last_session_result");

  if (!savedResult) {
    // 結果データがない場合はメニューへ戻す
    notificationStore.addNotification(
      "結果データの読み込みに失敗しました。",
      "error"
    );
    router.push("/menu");
    return;
  }

  try {
    resultData.value = JSON.parse(savedResult);

    // データ反映後にスクロール位置リセット
    resetTableScroll();

    await nextTick();
    setResultCardAnimation();
    fetchAiComment();
  } catch (error) {
    console.error("Result Data Parse Error:", error);
    notificationStore.addNotification(
      "結果データの読み込みに失敗しました。",
      "error"
    );
    router.push("/menu");
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  if (gsapContext) {
    gsapContext.revert();
  }
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * 結果画面 全体レイアウト
 * ========================================================================= */
.result-view {
  @include contents-width;

  @include pc {
    max-width: 100rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include contents-padding;

    display: flex;
    flex-direction: column;
    gap: 3.2rem;
  }

  /* =========================================================================
   * 上部エリア
   * ========================================================================= */
  &__top-wrapper {
    display: grid;
    gap: 3.2rem;
    width: 100%;
    max-width: 40rem;
    margin-inline: auto;

    @include pc {
      grid-template-columns: 65.6rem 31.2rem;
      gap: 3.2rem;
      max-width: none;
      margin-inline: 0;
    }
  }

  /* --- 結果カード群 --- */
  &__result-card-wrapper {
    @include fluid-style(gap, 24, 40);

    display: grid;
    grid-template-columns: repeat(2, 1fr);
    min-width: 0;

    @include pc {
      grid-template-columns: repeat(4, 1fr);
      gap: 3.2rem;
    }
  }

  &__result-card {
    display: flex;
    visibility: hidden; // GSAPアニメーション用
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    aspect-ratio: 1;
    padding: 1.6rem 0;
    background-color: $gray;
    border-radius: $radius-lg;

    @include tab {
      padding: 2.4rem 0;
    }

    @include pc {
      padding: 1.6rem 0;
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

    &--worst-key {
      fill: $light-black;
    }

    &--score {
      stroke: $orange;
    }
  }

  &__card-title {
    font-size: 1.6rem;
    font-weight: $bold;
    line-height: 1;
    letter-spacing: 0.1em;

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

    & > .small {
      font-size: 0.66em;
      color: $light-black;
    }

    &--kpm {
      color: $blue;
    }

    &--accuracy {
      color: $green;
    }

    &--total-miss-count {
      color: $red;
    }

    &--worst-key {
      color: $light-black;
    }

    &--score {
      color: $orange;
    }
  }

  /* --- スコアカード --- */
  &__score-card {
    position: relative;
    z-index: $z-toast;
    display: flex;
    visibility: hidden; // GSAPアニメーション用
    gap: 4rem;
    justify-content: center;
    width: 100%;
    padding: 1.6rem 0;
    background-color: $gray;
    border-radius: $radius-lg;
  }

  &__score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  /* --- AIコメントエリア --- */
  &__ai-area {
    display: flex;
    visibility: hidden; // GSAPアニメーション用
    flex-direction: column;
    gap: 3.2rem;
    align-items: center;

    @include pc {
      flex-direction: row;
    }
  }

  &__ai-image-wrapper {
    @include fluid-style(width, 120, 140);

    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background-color: $gray;
    border-radius: 100vmax;
  }

  &__ai-image {
    width: 80%;
  }

  &__ai-comment-wrapper {
    @include fluid-style(padding, 16, 24);

    position: relative;
    width: 100%;
    min-height: 23.4rem;
    background-color: $light-yellow;
    border-radius: $radius-lg;

    &::after {
      position: absolute;
      top: 0;
      left: 50%;
      width: 2rem;
      aspect-ratio: 1;
      content: "";
      background-color: $light-yellow;
      clip-path: polygon(0 100%, 100% 100%, 50% 0);
      transform: translate(-50%, calc(-100% + 1px));
    }

    @include pc {
      min-height: 22rem;

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

  /* --- アクションボタン群 --- */
  &__actions {
    display: flex;
    visibility: hidden; // GSAPアニメーション用
    flex-direction: column;
    gap: 2.4rem;

    @include pc {
      gap: 0;
      justify-content: space-around;
    }
  }

  &__button {
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;

    &--retry {
      @include button-style-fill($blue);
    }

    &--menu {
      @include button-style-border($green);
    }

    &--mypage {
      @include button-style-fill($green);
    }

    @include pc {
      width: 100%;

      &--mypage {
        width: 35rem;
      }
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  /* =========================================================================
   * 詳細結果エリア (テーブル)
   * ========================================================================= */
  &__details {
    @include fluid-style(gap, 8, 16);

    display: flex;
    visibility: hidden; // GSAPアニメーション用
    flex-direction: column;
  }

  &__details-title {
    @include fluid-text(16, 18);

    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__table-container {
    position: relative;
    width: 100%;
  }

  &__table-wrapper {
    /* スクロールバーと中身が被らないように少し下余白を入れる */
    padding-bottom: 1.6rem;

    &::v-deep(.simplebar-track.simplebar-horizontal) {
      @include fluid-style(height, 9, 11);

      .simplebar-scrollbar::before {
        background-color: $blue;
        opacity: 1;
      }
    }

    /* PC表示ではスクロールバーが非表示な為、余白は0 */
    @include pc {
      padding-bottom: 0;
    }
  }

  &__table {
    @include table-style;

    /* --- 列ごとの幅やテキスト寄せの共通設定 --- */
    .col-problem,
    .col-romaji {
      width: 30%;
    }

    .col-kpm {
      width: 10%;
      font-family: $roboto-mono;
      text-align: right;
    }

    .col-acc {
      width: 10%;
      text-align: right;
    }

    .col-miss-keys {
      width: 20%;
      text-align: center;
    }

    /* --- 各要素の個別装飾 --- */
    th {
      &.col-kpm {
        letter-spacing: 0.05em;
      }
    }

    td {
      &.col-romaji {
        font-family: $roboto-mono;
      }

      &.col-kpm {
        color: $blue;
      }

      &.col-acc {
        font-family: $roboto-mono;
        color: $green;
      }

      &.col-miss-keys {
        font-family: $roboto-mono;
        color: $red;

        /* NONEの場合は黒文字にする */
        &.is-none {
          color: $black;
        }
      }
    }
  }
}

/* =========================================================================
 * @keyframes / Transitions
 * ========================================================================= */

/* AIアイコン切り替えアニメーション */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}
</style>