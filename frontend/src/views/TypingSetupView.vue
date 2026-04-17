<template>
  <div class="setup-view">
    <h1 class="setup-view__title">
      <span class="en" aria-hidden="true">TYPING SETUP</span>
      <span class="ja">タイピング設定</span>
    </h1>

    <div class="setup-view__contents-wrapper">
      <div class="setup-view__info">
        <template v-if="mode === 'gemini'">
          <p class="setup-view__info-heading">AI問題生成モード</p>
          <p class="setup-view__info-theme">{{ prompt }}</p>
        </template>
        <template v-else-if="mode === 'db'">
          <p class="setup-view__info-heading">登録問題モード</p>
          <p class="setup-view__info-theme">{{ genreName }}</p>
        </template>
      </div>

      <form class="setup-view__form" @submit.prevent="handleStart">
        <div class="setup-view__group">
          <p class="setup-view__heading">問題数</p>
          <div class="setup-view__radios">
            <label
              v-for="count in settingsStore.PROBLEM_COUNTS"
              :key="count"
              class="setup-view__radio-label"
            >
              <input
                type="radio"
                :value="count"
                v-model="settingsStore.problemCount"
                class="setup-view__radio"
              />
              {{ count }}問
            </label>
          </div>
        </div>

        <div class="setup-view__group">
          <p class="setup-view__heading">ゲームモード</p>
          <div class="setup-view__radios">
            <label class="setup-view__radio-label">
              <input
                type="radio"
                :value="settingsStore.GAME_MODES.NORMAL"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              通常
            </label>
            <label class="setup-view__radio-label">
              <input
                type="radio"
                :value="settingsStore.GAME_MODES.TIME_LIMIT"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              <TimerIcon
                class="setup-view__timer-icon"
                aria-hidden="true"
              />時間制限
            </label>
            <label class="setup-view__radio-label">
              <input
                type="radio"
                :value="settingsStore.GAME_MODES.SUDDEN_DEATH"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              <SuddenDeathIcon
                class="setup-view__sudden-death-icon"
                aria-hidden="true"
              />サドンデス
            </label>
          </div>

          <div
            v-if="settingsStore.gameMode === 'time_limit'"
            class="setup-view__sub-settings"
          >
            <label for="time-limit" class="setup-view__selectbox-label"
              >制限時間:</label
            >
            <div class="setup-view__selectbox-wrapper">
              <select
                v-model.number="settingsStore.timeLimit"
                class="setup-view__selectbox"
                id="time-limit"
              >
                <option
                  v-for="time in settingsStore.TIME_LIMIT_OPTIONS"
                  :key="time"
                  :value="time"
                >
                  {{ time }}秒
                </option>
              </select>
            </div>
          </div>

          <div
            v-if="settingsStore.gameMode === 'sudden_death'"
            class="setup-view__sub-settings"
          >
            <label for="sudden-death" class="setup-view__selectbox-label"
              >許容ミス数:</label
            >
            <div class="setup-view__selectbox-wrapper">
              <select
                v-model.number="settingsStore.missLimit"
                class="setup-view__selectbox"
                id="sudden-death"
              >
                <option
                  v-for="miss in settingsStore.MISS_LIMIT_OPTIONS"
                  :key="miss"
                  :value="miss"
                >
                  {{ miss === 0 ? "0回（即終了！）" : miss + "回" }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="setup-view__group">
          <p class="setup-view__heading">ローマ字ガイド</p>
          <div class="setup-view__radios">
            <label class="setup-view__radio-label">
              <input
                type="radio"
                :value="true"
                v-model="settingsStore.showRomaji"
                class="setup-view__radio"
              />
              常に表示
            </label>
            <label class="setup-view__radio-label">
              <input
                type="radio"
                :value="false"
                v-model="settingsStore.showRomaji"
                class="setup-view__radio"
              />
              隠す（ミス時のみ表示）
            </label>
          </div>
        </div>

        <div class="setup-view__group">
          <p class="setup-view__heading">サウンド</p>
          <div class="setup-view__checkboxes">
            <label class="setup-view__checkbox-label">
              <input
                type="checkbox"
                v-model="settingsStore.soundEnabled"
                class="setup-view__checkbox"
              />
              タイプ音
            </label>
            <label class="setup-view__checkbox-label">
              <input
                type="checkbox"
                v-model="settingsStore.missSoundEnabled"
                class="setup-view__checkbox"
              />
              ミス音
            </label>
          </div>
          <p class="setup-view__credit">
            使用した音素材<br />OtoLogic(https://otologic.jp) 様
          </p>
        </div>

        <div class="setup-view__button-wrapper">
          <button type="submit" class="setup-view__start-button">
            タイピング開始！<ArrowIcon
              class="setup-view__arrow-icon"
              aria-hidden="true"
            />
          </button>
          <RouterLink to="/menu" class="setup-view__back-button">
            メインメニューに戻る<ArrowIcon
              class="setup-view__arrow-icon"
              aria-hidden="true"
            />
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { computed, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";

// --- Stores ---
import { useSettingsStore } from "../stores/settingsStore";
import { useNotificationStore } from "../stores/notificationStore";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import TimerIcon from "@/components/icons/TimerIcon.vue";
import SuddenDeathIcon from "@/components/icons/SuddenDeathIcon.vue";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * route情報
 * @type {import('vue-router').RouteLocationNormalizedLoaded}
 */
const route = useRoute();

/**
 * routerインスタンス
 * @type {import('vue-router').Router}
 */
const router = useRouter();

/**
 * 設定store
 */
const settingsStore = useSettingsStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

// --- URLクエリからのデータ取得 (Computed) ---

/**
 * URLクエリから取得: モード ('db' or 'gemini')
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const mode = computed(() => route.query.mode);

/**
 * URLクエリから取得: AIお題
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const prompt = computed(() => route.query.prompt);

/**
 * URLクエリから取得: ジャンルID
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const genreId = computed(() => route.query.genreId);

/**
 * URLクエリから取得: ジャンル名
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const genreName = computed(() => route.query.genreName);

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * タイピング開始処理
 * @returns {void}
 */
const handleStart = () => {
  // タイピング実行画面へ遷移
  router.push({
    path: "/typing/play",
    query: {
      mode: mode.value,
      prompt: prompt.value,
      genreId: genreId.value,
    },
  });
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * 画面表示時のチェック処理 (不正アクセスのブロック)
 */
onMounted(() => {
  // モードがない、または不正な場合
  if (!mode.value || (mode.value !== "db" && mode.value !== "gemini")) {
    notificationStore.addNotification(
      "不正なアクセスです。メインメニューから操作してください。",
      "error"
    );
    router.push("/menu");
    return;
  }

  // DBモードなのにジャンルIDがない場合
  if (mode.value === "db" && !genreId.value) {
    notificationStore.addNotification(
      "ジャンルが選択されていません。",
      "error"
    );
    router.push("/menu");
    return;
  }

  // DBモードなのにジャンル名がない場合
  if (mode.value === "db" && !genreName.value) {
    notificationStore.addNotification(
      "ジャンルが選択されていません。",
      "error"
    );
    router.push("/menu");
    return;
  }

  // Geminiモードなのにお題がない場合
  if (mode.value === "gemini" && !prompt.value) {
    notificationStore.addNotification("お題が入力されていません。", "error");
    router.push("/menu");
    return;
  }
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * タイピング設定画面スタイル
 * ========================================================================= */
.setup-view {
  @include contents-width;

  @include pc {
    max-width: 80rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include fluid-style(gap, 32, 48);
    @include contents-padding;

    display: flex;
    flex-direction: column;
    max-width: 50rem;
    margin-inline: auto;

    @include pc {
      max-width: none;
    }
  }

  /* --- 選択されたモード情報の表示エリア --- */
  &__info {
    @include fluid-style(gap, 10, 16);
    @include fluid-style(padding, 10, 16);

    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: $blue;
    border-radius: $radius-md $radius-md 0 0;
  }

  &__info-heading,
  &__info-theme {
    @include fluid-text(14, 16);

    font-weight: $bold;
    color: $white;
    letter-spacing: 0.1em;
  }

  &__info-theme {
    color: $yellow;
  }

  /* --- 設定フォーム本体 --- */
  &__form {
    @include fluid-style(gap, 24, 32);

    display: grid;
    width: 100%;
  }

  &__group {
    @include fluid-style(gap, 16, 24);

    display: grid;
    grid-template-columns: 1fr;

    @include pc {
      grid-template-columns: 1fr 3fr;
      gap: 0;
    }
  }

  &__heading {
    @include fluid-text(14, 16);

    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  /* --- ラジオボタン & チェックボックス --- */
  &__radios,
  &__checkboxes {
    @include fluid-style(gap, 24, 40);

    display: flex;
  }

  &__radio-label,
  &__checkbox-label {
    @include fluid-text(14, 16);

    display: flex;
    align-items: center;
    line-height: 1;
    cursor: pointer;
  }

  &__radio {
    position: relative;
    display: inline-block;
    width: 1em;
    aspect-ratio: 1;
    margin-right: 1em;
    background-color: $gray;
    border: 1px solid $black;
    border-radius: 100vmax;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60%;
      aspect-ratio: 1;
      content: "";
      background-color: $green;
      border-radius: 100vmax;
      opacity: 0;
      transform: translate(-50%, -50%);
      transition: opacity $transition-base;
    }

    &:checked::after {
      opacity: 1;
    }
  }

  &__checkbox {
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

  &__credit {
    @include fluid-text(11, 12);

    color: $light-black;
  }

  /* --- アイコン --- */
  &__timer-icon,
  &__sudden-death-icon {
    height: 1em;
    margin-right: 0.3em;
    fill: $black;
  }

  /* --- サブ設定 (セレクトボックス群) --- */
  &__sub-settings {
    @include fluid-style(gap, 14, 16);

    display: flex;
    align-items: center;
    animation: fade-in $transition-base;

    @include pc {
      grid-column: 2;
      margin-top: 3.2rem;
    }
  }

  &__selectbox-label {
    @include fluid-text(14, 16);

    display: block;
    line-height: 1;
  }

  &__selectbox-wrapper {
    @include select-wrapper-style;
  }

  &__selectbox {
    @include select-style;

    border: 1px solid $black;
  }

  /* --- アクションボタン --- */
  &__button-wrapper {
    @include fluid-style(gap, 24, 32);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @include pc {
      /* PCの時はメインの「開始」ボタンを右側に持ってくる */
      flex-direction: row-reverse;
    }
  }

  &__start-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);
  }

  &__back-button {
    @include button-style-border($blue);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }
}

/* =========================================================================
 * Animations
 * ========================================================================= */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>