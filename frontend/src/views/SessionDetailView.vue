<template>
  <div class="session-detail">
    <h1 class="session-detail__title">
      <span class="en">SESSION DETAIL</span>
      <span class="ja">セッション詳細</span>
    </h1>

    <div class="session-detail__contents-wrapper" ref="sessionDetailWrapperRef">
      <Loading
        v-if="isContentsLoading"
        class="session-detail__loading"
        :text="'データ読み込み中です…'"
      />

      <div v-else-if="errorMessage" class="session-detail__error">
        <p class="session-detail__error-message">{{ errorMessage }}</p>
        <RouterLink to="/mypage" class="session-detail__back-button">
          マイページに戻る<ArrowIcon class="session-detail__arrow-icon" />
        </RouterLink>
      </div>

      <div v-else-if="session" class="session-detail__content">
        <div class="session-detail__information">
          <span class="session-detail__information-label">実施日時</span>
          <span
            class="session-detail__information-value session-detail__information-value--number"
          >
            {{ formatDate(session.created_at) }}
          </span>
          <span class="session-detail__information-label">モード</span>
          <span class="session-detail__information-value">
            <span v-if="session.session_type === 'db'">
              DB: {{ session.genre ? session.genre.name : "削除済" }}
            </span>
            <span v-else>
              AI: {{ truncateText(session.gemini_prompt, 20) }}
            </span>
          </span>
        </div>

        <div class="session-detail__score-board">
          <div class="session-detail__score-item">
            <KpmIcon
              class="session-detail__score-icon session-detail__score-icon--kpm"
            />
            <span class="session-detail__score-label">平均 KPM</span>
            <span
              class="session-detail__score-value session-detail__score-value--kpm"
            >
              {{ Math.round(session.average_kpm) }}
            </span>
          </div>
          <div class="session-detail__score-item">
            <AccuracyIcon
              class="session-detail__score-icon session-detail__score-icon--acc"
            />
            <span class="session-detail__score-label">平均 正確率</span>
            <span
              class="session-detail__score-value session-detail__score-value--acc"
            >
              {{ Math.round(session.average_accuracy) }}%
            </span>
          </div>
          <div class="session-detail__score-item">
            <TotalTypeCountIcon
              class="session-detail__score-icon session-detail__score-icon--total-type-count"
            />
            <span class="session-detail__score-label">総タイプ数</span>
            <span
              class="session-detail__score-value session-detail__score-value--total-type-count"
            >
              {{ session.total_types }}
            </span>
          </div>
          <div class="session-detail__score-item">
            <TotalMissCountIcon
              class="session-detail__score-icon session-detail__score-icon--total-miss-count"
            />
            <span class="session-detail__score-label">総ミス数</span>
            <span
              class="session-detail__score-value session-detail__score-value--total-miss-count"
            >
              {{ session.total_miss_count }}
            </span>
          </div>
          <div class="session-detail__score-item">
            <WorstKeyIcon
              class="session-detail__score-icon session-detail__score-icon--worst-key"
            />
            <span class="session-detail__score-label">苦手キー</span>
            <span
              class="session-detail__score-value session-detail__score-value--worst-key"
            >
              {{
                !session.most_missed_key
                  ? "NONE"
                  : session.most_missed_key.toUpperCase()
              }}
            </span>
          </div>
        </div>

        <div class="session-detail__history">
          <h2 class="session-detail__subtitle">問題別スコア</h2>
          <div class="session-detail__table-container">
            <ScrollHint :show="!isTableHidden" />

            <Simplebar
              class="session-detail__table-wrapper"
              ref="tableScrollRef"
              @scroll="handleTableScroll"
              :auto-hide="false"
            >
              <table class="session-detail__table">
                <thead>
                  <tr>
                    <th class="col-problem">問題文</th>
                    <th class="col-romaji">ローマ字</th>
                    <th class="col-kpm">KPM</th>
                    <th class="col-acc">正確率</th>
                    <th class="col-miss-keys">ミスしたキー</th>
                    <th class="col-action">練習</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="problem in session.session_problems"
                    :key="problem.id"
                  >
                    <td class="col-problem">{{ problem.problem_text }}</td>
                    <td class="col-romaji">{{ problem.romaji_text || "-" }}</td>
                    <td class="col-kpm">{{ Math.round(problem.kpm) }}</td>
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
                    <td class="col-action">
                      <button
                        class="session-detail__button session-detail__button--try"
                        @click="handleTryClick(problem)"
                      >
                        <TotalTypeCountIcon
                          class="session-detail__button-icon session-detail__button-icon--keyboard"
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Simplebar>
          </div>
        </div>

        <div class="session-detail__back">
          <RouterLink to="/mypage" class="session-detail__back-button">
            マイページに戻る<ArrowIcon class="session-detail__arrow-icon" />
          </RouterLink>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="isTryModalOpen"
        class="session-detail__modal-overlay"
        @click.self="closeTryModal"
      >
        <div class="session-detail__modal-content">
          <button @click="closeTryModal" class="session-detail__modal-close">
            <PlusIcon class="session-detail__modal-close-icon" />
          </button>

          <p class="session-detail__modal-title">試し打ち</p>

          <div class="session-detail__sound-settings">
            <label class="session-detail__sound-label">
              <input
                type="checkbox"
                class="session-detail__sound-checkbox"
                v-model="settingsStore.soundEnabled"
                @change="settingsStore.saveSettings"
              />
              タイプ音
            </label>
            <label class="session-detail__sound-label">
              <input
                type="checkbox"
                class="session-detail__sound-checkbox"
                v-model="settingsStore.missSoundEnabled"
                @change="settingsStore.saveSettings"
              />
              ミス音
            </label>
          </div>

          <TypingCore
            v-if="problemToTry"
            :problems="[problemToTry]"
            :isTryMode="true"
          />
        </div>
      </div>
    </Transition>

    <DeviceWarningModal
      :show="showWarningModal"
      @cancel="showWarningModal = false"
      @play="handleProceedToPlay"
    />
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import gsap from "gsap";

// --- Services & Utilities ---
import api from "../services/api";
import {
  formatDate,
  truncateText,
  formatMissedKeys,
} from "../utils/formatters";

// --- Stores ---
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";

// --- Composables ---
import { useScrollHint } from "../composables/useScrollHint";
import { useDeviceEnvironment } from "../composables/useDeviceEnvironment";

// --- Components ---
import TypingCore from "../components/TypingCore.vue";
import DeviceWarningModal from "@/components/DeviceWarningModal.vue";
import Loading from "@/components/Loading.vue";
import ScrollHint from "@/components/ScrollHint.vue";
import Simplebar from "simplebar-vue";

// --- Icons ---
import PlusIcon from "@/components/icons/PlusIcon.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import TotalMissCountIcon from "@/components/icons/TotalMissCountIcon.vue";
import WorstKeyIcon from "@/components/icons/WorstKeyIcon.vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ローディングの最低表示時間 (ミリ秒)
 */
const MIN_LOADING_MS = 300;

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * 現在のルート情報
 */
const route = useRoute();

/**
 * router
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * 設定store
 */
const settingsStore = useSettingsStore();

/**
 * ローディング状態
 */
const isContentsLoading = ref(false);

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * セッション詳細データ
 */
const session = ref(null);

/**
 * 試し打ちモーダルの表示・非表示
 */
const isTryModalOpen = ref(false);

/**
 * 試し打ちの問題データ
 */
const problemToTry = ref(null);

/**
 * 警告モーダルの表示・非表示
 */
const showWarningModal = ref(false);

/**
 * 警告が出た際に、一時的に「どの問題を試し打ちしようとしたか」を保存する
 */
const pendingProblem = ref(null);

// =========================================================================
// DOM / コンポーネント参照 (Refs)
// =========================================================================

/**
 * GSAPアニメーションのスコープ（範囲）用
 */
const sessionDetailWrapperRef = ref(null);

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

/**
 * デバイスのプレイ環境を判定する
 */
const { checkNeedsWarning } = useDeviceEnvironment();

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * 「試し打ちモーダル」を開く時の処理
 * @param {Object} problem 問題オブジェクト
 */
const openTryModal = (problem) => {
  problemToTry.value = problem;
  isTryModalOpen.value = true;
  window.addEventListener("keydown", handleEscClose);
};

/**
 * 「試し打ちモーダル」を閉じる時の処理
 */
const closeTryModal = () => {
  isTryModalOpen.value = false;
  problemToTry.value = null;
  window.removeEventListener("keydown", handleEscClose);
};

/**
 * ESCキーが押された時にモーダルを閉じる処理
 * @param {KeyboardEvent} e キーボードイベントオブジェクト
 */
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    closeTryModal();
  }
};

/**
 * 「試し打ち」ボタンが押された時の最初の処理
 */
const handleTryClick = (problem) => {
  if (checkNeedsWarning()) {
    // 警告が必要な環境なら、問題を一時保存してモーダルを出す
    pendingProblem.value = problem;
    showWarningModal.value = true;
  } else {
    // 問題なければそのまま開く
    openTryModal(problem);
  }
};

/**
 * 警告モーダルで「そのままプレイ」が押された時の処理
 */
const handleProceedToPlay = () => {
  // 警告モーダルを閉じる
  showWarningModal.value = false;
  if (pendingProblem.value) {
    // 試し打ちモーダルを開く
    openTryModal(pendingProblem.value);

    // 一時保存をリセット
    pendingProblem.value = null;
  }
};

// =========================================================================
// GSAP アニメーション制御
// =========================================================================

/**
 * GSAPコンテキスト (アンマウント時のクリーンアップ用)
 */
let gsapContext;

/**
 * アニメーション設定
 */
const setAnimation = () => {
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
    // informationセクション
    const information = ".session-detail__information";

    // 各score要素
    const scoreItems = gsap.utils.toArray(".session-detail__score-item");

    // 問題別スコアセクション
    const history = ".session-detail__history";

    // backボタンラッパー要素
    const back = ".session-detail__back";

    // timelineを作成
    const tl = gsap.timeline();

    // アニメーション設定
    tl.fromTo(
      information,
      { ...fromAnimationSettings },
      { ...toAnimationSettings }
    );
    tl.fromTo(
      scoreItems,
      { ...fromAnimationSettings },
      { ...toAnimationSettings, stagger: staggerTime },
      "-=0.6"
    );
    tl.fromTo(
      history,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
    tl.fromTo(
      back,
      { ...fromAnimationSettings },
      { ...toAnimationSettings },
      "-=0.6"
    );
  }, sessionDetailWrapperRef.value);
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  const sessionId = route.params.id;

  if (!sessionId) {
    router.push("/mypage");
    return;
  }

  isContentsLoading.value = true;

  try {
    const [response] = await Promise.all([
      api.get(`/api/mypage/sessions/${sessionId}`),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    session.value = response.data;

    // データ取得完了後にスクロール位置をリセット
    resetTableScroll();
  } catch (error) {
    console.error("詳細取得エラー:", error);
    errorMessage.value =
      error.response?.data?.message || "データの取得に失敗しました";
    notificationStore.addNotification("データの取得に失敗しました", "error");
  } finally {
    isContentsLoading.value = false;

    if (!errorMessage.value && session.value) {
      await nextTick();
      setAnimation();
    }
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
 * セッション詳細画面
 * ========================================================================= */
.session-detail {
  @include contents-width;

  @include pc {
    max-width: 100rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include fluid-style(gap, 24, 32);
    @include contents-padding;

    display: flex;
    flex-direction: column;
    max-width: 60rem;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  /* --- 共通ステータス表示 --- */
  &__error {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    text-align: center;
  }

  &__error-message {
    @include fluid-text(12, 16);

    color: $red;
  }

  &__content {
    @include fluid-style(gap, 24, 32);

    display: flex;
    flex-direction: column;
  }

  /* =========================================================================
   * 基本情報
   * ========================================================================= */
  &__information {
    @include fluid-text(14, 18);

    display: grid;
    visibility: hidden; /* GSAPアニメーション用 */
    grid-template-columns: 1fr 2.5fr;
    row-gap: 1em;
    width: 100%;
    max-width: 50rem;

    @include pc {
      margin-inline: auto;
    }
  }

  &__information-label {
    font-weight: $bold;
  }

  &__information-value {
    &--number {
      font-family: $roboto-mono;
    }
  }

  /* =========================================================================
   * スコアボード
   * ========================================================================= */
  &__score-board {
    @include fluid-style(gap, 16, 32);

    display: grid;
    grid-template-columns: repeat(2, 1fr);

    @include tab {
      grid-template-columns: repeat(3, 1fr);
    }

    @include pc {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &__score-item {
    @include fluid-style(padding, 16, 24);

    display: flex;
    visibility: hidden; /* GSAPアニメーション用 */
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    aspect-ratio: 1;
    background-color: $gray;
    border-radius: $radius-lg;
  }

  &__score-label {
    @include fluid-text(14, 16);

    font-weight: $bold;
  }

  &__score-value {
    @include fluid-text(18, 22);

    font-family: $roboto-mono;
    font-weight: $bold;

    &--kpm {
      color: $blue;
    }

    &--acc {
      color: $green;
    }

    &--total-type-count {
      color: $light-black;
    }

    &--total-miss-count {
      color: $red;
    }

    &--worst-key {
      color: $black;
    }
  }

  &__score-icon {
    @include fluid-style(width, 34, 40);

    &--kpm {
      fill: $blue;
    }

    &--acc {
      fill: $green;
    }

    &--total-type-count {
      fill: $light-black;
    }

    &--total-miss-count {
      fill: $red;
    }

    &--worst-key {
      fill: $black;
    }
  }

  /* =========================================================================
   * 問題別スコア履歴
   * ========================================================================= */
  &__history {
    @include fluid-style(gap, 8, 16);

    display: flex;
    visibility: hidden; /* GSAPアニメーション用 */
    flex-direction: column;
  }

  &__subtitle {
    @include fluid-text(14, 16);

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
        background-color: $green;
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
    .col-problem {
      width: 30%;
    }

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
      width: 15%;
      text-align: center;
    }

    .col-action {
      width: 5%;
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

        &.is-none {
          color: $black;
        }
      }
    }
  }

  /* =========================================================================
   * アクションボタン群
   * ========================================================================= */
  &__back {
    visibility: hidden; /* GSAPアニメーション用 */
  }

  &__back-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__button {
    @include fluid-text(11, 13);

    width: 4rem;
    aspect-ratio: 1;

    &--try {
      @include button-style-fill($blue, $hover-action: "none");
    }
  }

  &__button-icon {
    width: 1.4em;

    &--keyboard {
      fill: currentcolor;
    }
  }

  /* =========================================================================
   * 試し打ちモーダル
   * ========================================================================= */
  &__modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: $z-modal-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $modal-overlay-color;
  }

  &__modal-content {
    @include fluid-style(padding, 16, 24);

    position: relative;
    z-index: $z-modal-content;
    width: 90rem;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
  }

  &__modal-close {
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);

    position: absolute;
    color: $black;
    cursor: pointer;
    transform: rotate(45deg);
    transition: color $transition-base;

    @include hover {
      color: $red;
    }
  }

  &__modal-close-icon {
    width: 100%;
    fill: currentcolor;
  }

  &__modal-title {
    @include fluid-style(margin-bottom, 10, 16);
    @include fluid-text(16, 18);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__sound-settings {
    @include fluid-style(gap, 16, 24);
    @include fluid-style(margin-bottom, 10, 16);

    display: flex;
    justify-content: flex-end;
  }

  &__sound-label {
    @include fluid-text(12, 14);

    display: flex;
    align-items: center;
    font-weight: $bold;
    cursor: pointer;
    user-select: none;
    transition: opacity $transition-base;

    @include hover {
      opacity: 0.7;
    }
  }

  &__sound-checkbox {
    position: relative;
    display: inline-block;
    width: 1em;
    aspect-ratio: 1;
    margin-right: 1em;
    background-color: $gray;
    border: 1px solid $black;
    border-radius: $radius-sm;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 40%;
      content: "";
      border-bottom: 2px solid $green;
      border-left: 2px solid $green;
      opacity: 0;
      transform: translate(-50%, calc(-50% - 1px)) rotate(-45deg);
      transition: opacity $transition-base;
    }

    &:checked::after {
      opacity: 1;
    }
  }
}

/* モーダル用アニメーション */
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  /* stylelint-disable-next-line selector-class-pattern */
  .session-detail__modal-content {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  /* stylelint-disable-next-line selector-class-pattern */
  .session-detail__modal-content {
    transition: transform $transition-base;
  }
}
</style>