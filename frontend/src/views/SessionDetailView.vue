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
        <RouterLink to="/mypage" class="session-detail__back-button"
          >マイページに戻る<ArrowIcon class="session-detail__arrow-icon"
        /></RouterLink>
      </div>

      <div v-else-if="session" class="session-detail__content">
        <div class="session-detail__information">
          <span class="session-detail__information-label">実施日時</span>
          <span
            class="session-detail__information-value session-detail__information-value--number"
            >{{ formatDate(session.created_at) }}</span
          >
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
              >{{ Math.round(session.average_kpm) }}</span
            >
          </div>
          <div class="session-detail__score-item">
            <AccuracyIcon
              class="session-detail__score-icon session-detail__score-icon--acc"
            />
            <span class="session-detail__score-label">平均 正確率</span>
            <span
              class="session-detail__score-value session-detail__score-value--acc"
              >{{ Math.round(session.average_accuracy) }}%</span
            >
          </div>
          <div class="session-detail__score-item">
            <TotalTypeCountIcon
              class="session-detail__score-icon session-detail__score-icon--total-type-count"
            />
            <span class="session-detail__score-label">総タイプ数</span>
            <span
              class="session-detail__score-value session-detail__score-value--total-type-count"
              >{{ session.total_types }}</span
            >
          </div>
          <div class="session-detail__score-item">
            <TotalMissCountIcon
              class="session-detail__score-icon session-detail__score-icon--total-miss-count"
            />
            <span class="session-detail__score-label">総ミス数</span>
            <span
              class="session-detail__score-value session-detail__score-value--total-miss-count"
              >{{ session.total_miss_count }}</span
            >
          </div>
          <div
            class="session-detail__score-item"
            v-if="session.most_missed_key"
          >
            <WorstKeyIcon
              class="session-detail__score-icon session-detail__score-icon--worst-key"
            />
            <span class="session-detail__score-label">苦手キー</span>
            <span
              class="session-detail__score-value session-detail__score-value--worst-key"
              >{{ session.most_missed_key.toUpperCase() }}</span
            >
          </div>
        </div>

        <div class="session-detail__history">
          <h2 class="session-detail__subtitle">問題別スコア</h2>
          <div class="session-detail__table-container">
            <ScrollHint :show="!scrollStates.table" />
            <div
              class="session-detail__table-wrapper"
              @scroll="handleScroll($event, 'table')"
            >
              <table class="session-detail__table">
                <thead>
                  <tr class="session-detail__tr">
                    <th class="session-detail__th session-detail__th--problem">
                      問題文
                    </th>
                    <th class="session-detail__th session-detail__th--romaji">
                      ローマ字
                    </th>
                    <th class="session-detail__th session-detail__th--kpm">
                      KPM
                    </th>
                    <th class="session-detail__th session-detail__th--acc">
                      正確率
                    </th>
                    <th
                      class="session-detail__th session-detail__th--miss-keys"
                    >
                      ミスしたキー
                    </th>
                    <th class="session-detail__th session-detail__th--action">
                      練習
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="problem in session.session_problems"
                    :key="problem.id"
                    class="session-detail__tr"
                  >
                    <td class="session-detail__td session-detail__td--problem">
                      {{ problem.problem_text }}
                    </td>
                    <td class="session-detail__td session-detail__td--romaji">
                      {{ problem.romaji_text || "-" }}
                    </td>
                    <td class="session-detail__td session-detail__td--kpm">
                      {{ Math.round(problem.kpm) }}
                    </td>
                    <td class="session-detail__td session-detail__td--acc">
                      {{ Math.round(problem.accuracy) }}%
                    </td>
                    <td
                      class="session-detail__td session-detail__td--miss-keys"
                    >
                      {{ formatMissedKeys(problem.missed_keys) }}
                    </td>
                    <td class="session-detail__td session-detail__td--action">
                      <button
                        class="session-detail__button session-detail__button--try"
                        @click="openTryModal(problem)"
                      >
                        <TotalTypeCountIcon
                          class="session-detail__button-icon session-detail__button-icon--keyboard"
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="session-detail__back">
          <RouterLink to="/mypage" class="session-detail__back-button"
            >マイページに戻る<ArrowIcon class="session-detail__arrow-icon"
          /></RouterLink>
        </div>
      </div>
    </div>
    <Transition name="modal-fade">
      <div
        v-if="isTryModalOpen"
        class="session-detail__modal-overlay"
        @click.self="closeTryModal"
      >
        <div
          class="session-detail__modal-content"
        >
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
            :showDebug="true"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";
import {
  formatDate,
  truncateText,
  formatMissedKeys,
} from "../utils/formatters";
import TypingCore from "../components/TypingCore.vue";
import PlusIcon from "@/components/icons/PlusIcon.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import TotalMissCountIcon from "@/components/icons/TotalMissCountIcon.vue";
import WorstKeyIcon from "@/components/icons/WorstKeyIcon.vue";
import Loading from "@/components/Loading.vue";
import ScrollHint from "@/components/ScrollHint.vue";
import gsap from "gsap";

/**
 * route
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
 * ローディングの最低表示時間 (ミリ秒)
 */
const MIN_LOADING_MS = 300;

/**
 * スクロールヒントの非表示状態を管理するオブジェクト
 */
const scrollStates = ref({
  table: false,
});

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * セッション詳細データ
 */
const session = ref(null);

/**
 * GSAPアニメーションのスコープ（範囲）用
 */
const sessionDetailWrapperRef = ref(null);

/**
 * 試し打ちモーダルの表示・非表示
 */
const isTryModalOpen = ref(false);

/**
 * 試し打ちの問題
 */
const problemToTry = ref(null);

/**
 * GSAPコンテキスト
 */
let gsapContext;

/**
 * アニメーション設定
 */
const setAnimation = () => {
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
 * 「試し打ち」ボタンが押された時の処理
 * @param {*} problem 問題オブジェクト
 */
const openTryModal = (problem) => {
  // 「試し打ち」の問題をセット
  problemToTry.value = problem;

  // モーダルを開く
  isTryModalOpen.value = true;

  // ESCキーで閉じられるようにイベントをセット
  window.addEventListener("keydown", handleEscClose);
};

/**
 * 「モーダル」を閉じる時の処理
 */
const closeTryModal = () => {
  // モーダルを閉じる
  isTryModalOpen.value = false;

  // 「試し打ち」してた問題をリセット
  problemToTry.value = null;

  // イベント削除
  window.removeEventListener("keydown", handleEscClose);
};

/**
 * ESCキーが押された時の処理
 * @param {KeyboardEvent} e キーボードイベントオブジェクト
 */
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    // モーダルを閉じる処理
    closeTryModal();
  }
};

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  const sessionId = route.params.id;

  // IDがない場合は戻す
  if (!sessionId) {
    router.push("/mypage");
    return;
  }

  // ローディング表示
  isContentsLoading.value = true;

  try {
    // 詳細APIと最低時間の待機（ローディング表示用）
    const [response] = await Promise.all([
      api.get(`/api/mypage/sessions/${sessionId}`),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    session.value = response.data;
  } catch (error) {
    console.error("詳細取得エラー:", error);

    // エラーテキスト表示
    errorMessage.value =
      error.response?.data?.message || "データの取得に失敗しました";

    // エラー通知表示
    notificationStore.addNotification("データの取得に失敗しました", "error");
  } finally {
    // ローディング終了
    isContentsLoading.value = false;

    // 正常にデータ取得時のみgsapアニメーション設定
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
  // コンポーネントが破棄される時にアニメーションをリセットする
  if (gsapContext) {
    gsapContext.revert();
  }
});
</script>

<style lang="scss" scoped>
.session-detail {
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
    @include fluid-style(gap, 24, 32);
    @include contents-padding;
    max-width: 600px;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  &__error {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 16, 24);
    text-align: center;
  }

  &__error-message {
    @include fluid-text(12, 16);
    color: $red;
  }

  &__content {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
  }

  &__information {
    display: grid;
    grid-template-columns: 1fr 2.5fr;
    row-gap: 1em;
    width: 100%;
    max-width: 500px;
    @include fluid-text(14, 18);
    visibility: hidden; // GSAPアニメーション用

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

  &__score-board {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    @include fluid-style(gap, 16, 32);

    @include tab {
      grid-template-columns: repeat(3, 1fr);
    }

    @include pc {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &__score-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    @include fluid-style(padding, 16, 24);
    aspect-ratio: 1;
    background-color: $gray;
    border-radius: $radius-lg;
    visibility: hidden; // GSAPアニメーション用
  }

  &__score-label {
    font-weight: $bold;
    @include fluid-text(14, 16);
  }

  &__score-value {
    font-family: $roboto-mono;
    font-weight: $bold;
    @include fluid-text(18, 22);

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
    @include fluid-style(width, 32, 40);

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

  &__history {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 8, 16);
    visibility: hidden; // GSAPアニメーション用
  }

  &__subtitle {
    font-weight: $bold;
    @include fluid-text(14, 16);
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

    &--problem {
      width: 30%;
      text-align: left;
    }

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
      width: 15%;
      text-align: center;
    }

    &--action {
      width: 5%;
      text-align: center;
    }
  }

  &__td {
    padding: 1em;
    font-size: 1.4rem;

    &--problem {
      text-align: left;
    }

    &--romaji {
      font-family: $roboto-mono;
      text-align: left;
    }

    &--kpm {
      font-family: $roboto-mono;
      color: $blue;
      text-align: right;
    }

    &--acc {
      font-family: $roboto-mono;
      color: $green;
      text-align: right;
    }

    &--miss-keys {
      font-family: $roboto-mono;
      color: $red;
    }
  }

  &__back {
    visibility: hidden; // GSAPアニメーション用
  }

  &__back-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__button {
    width: 4rem;
    aspect-ratio: 1;
    @include fluid-text(11, 13);

    &--try {
      @include button-style-fill($blue, $hover-action: "none");
    }
  }

  &__button-icon {
    width: 1.4em;

    &--keyboard {
      fill: currentColor;
    }
  }

  &__modal-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.33);
  }

  &__modal-content {
    position: relative;
    width: 90rem;
    @include fluid-style(padding, 16, 24);
    border-radius: $radius-md;
    background-color: $white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
  }

  &__modal-close {
    position: absolute;
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);
    cursor: pointer;
    color: $black;
    transform: rotate(45deg);
    transition: color $transition-base;

    @include hover {
      color: $red;
    }
  }

  &__modal-close-icon {
    width: 100%;
    fill: currentColor;
  }

  &__modal-title {
    @include fluid-style(margin-bottom, 10, 16);
    font-weight: $bold;
    @include fluid-text(16, 18);
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__sound-settings {
    display: flex;
    justify-content: flex-end;
    @include fluid-style(gap, 16, 24);
    @include fluid-style(margin-bottom, 10, 16);
  }

  &__sound-label {
    display: flex;
    align-items: center;
    font-weight: $bold;
    @include fluid-text(12, 14);
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
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 40%;
      border-left: 2px solid $green;
      border-bottom: 2px solid $green;
      transform: translate(-50%, calc(-50% - 1px)) rotate(-45deg);
      opacity: 0;
      transition: opacity $transition-base;
    }

    &:checked::after {
      opacity: 1;
    }
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .session-detail__modal-content {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  .session-detail__modal-content {
    transition: transform $transition-base;
  }
}
</style>