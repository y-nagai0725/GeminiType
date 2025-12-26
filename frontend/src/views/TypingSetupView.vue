<template>
  <div class="setup-view">
    <h1 class="setup-view__title">
      <span class="en">TYPING SETUP</span>
      <span class="ja">タイピング設定</span>
    </h1>

    <div class="setup-view__contents-wrapper">
      <div class="setup-view__info">
        <template v-if="mode === 'gemini'">
          <p class="setup-view__info-heading">AI問題生成モード</p>
          <p class="setup-view__info-theme">お題: {{ prompt }}</p>
        </template>
        <template v-else-if="mode === 'db'">
          <p class="setup-view__info-heading">登録問題モード</p>
          <p class="setup-view__info-theme">ジャンル名: {{ genreId }}</p>
        </template>
      </div>

      <form class="setup-view__form" @submit.prevent="handleStart">
        <div class="setup-view__group">
          <p class="setup-view__heading">問題数</p>
          <div class="setup-view__radios">
            <label
              v-for="count in problemCounts"
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
                value="normal"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              通常
            </label>
            <label class="setup-view__radio-label">
              <input
                type="radio"
                value="time_limit"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              時間制限
            </label>
            <label class="setup-view__radio-label">
              <input
                type="radio"
                value="sudden_death"
                v-model="settingsStore.gameMode"
                class="setup-view__radio"
              />
              サドンデス
            </label>
          </div>

          <div
            v-if="settingsStore.gameMode === 'time_limit'"
            class="setup-view__sub-settings"
          >
            <label class="setup-view__selectbox-label">制限時間:</label>
            <div class="setup-view__selectbox-wrapper">
              <select
                v-model.number="settingsStore.timeLimit"
                class="setup-view__selectbox"
              >
                <option :value="30">30秒</option>
                <option :value="60">60秒</option>
                <option :value="90">90秒</option>
                <option :value="120">120秒</option>
              </select>
            </div>
          </div>

          <div
            v-if="settingsStore.gameMode === 'sudden_death'"
            class="setup-view__sub-settings"
          >
            <label class="setup-view__selectbox-label">許容ミス数:</label>
            <div class="setup-view__selectbox-wrapper">
              <select
                v-model.number="settingsStore.missLimit"
                class="setup-view__selectbox"
              >
                <option :value="0">0回（即終了！）</option>
                <option :value="1">1回</option>
                <option :value="3">3回</option>
                <option :value="5">5回</option>
                <option :value="10">10回</option>
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
        </div>

        <button type="submit" class="setup-view__start-button">
          タイピング開始！<ArrowIcon class="setup-view__arrow-icon" />
        </button>
      </form>

      <RouterLink to="/menu" class="setup-view__back-button"
        >メインメニューに戻る<ArrowIcon class="setup-view__arrow-icon"
      /></RouterLink>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useSettingsStore } from "../stores/settingsStore";
import { useNotificationStore } from "../stores/notificationStore";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

/**
 * route
 */
const route = useRoute();

/**
 * router
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

/**
 * 選択可能な問題数リスト
 */
const problemCounts = [5, 10, 20, 30];

/**
 * URLクエリから取得: モード ('db' or 'gemini')
 */
const mode = computed(() => route.query.mode);

/**
 * URLクエリから取得: AIお題
 */
const prompt = computed(() => route.query.prompt);

/**
 * URLクエリから取得: ジャンルID
 */
const genreId = computed(() => route.query.genreId);

/**
 * 画面表示時のチェック処理
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

  // Geminiモードなのにお題がない場合
  if (mode.value === "gemini" && !prompt.value) {
    notificationStore.addNotification("お題が入力されていません。", "error");
    router.push("/menu");
    return;
  }
});

/**
 * タイピング開始処理
 */
const handleStart = () => {
  // 設定をlocalStorageに保存
  settingsStore.saveSettings();

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
</script>
<style lang="scss" scoped>
.setup-view {
  @include contents-width;

  @include pc {
    max-width: 800px;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 32, 48);
    max-width: 500px;
    margin-inline: auto;
    @include contents-padding;

    @include pc {
      max-width: none;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;
    @include fluid-style(padding, 16, 24);
    border-radius: $radius-md $radius-md 0 0;
    background-color: $green;

    @include pc {
      flex-direction: row;
      justify-content: center;
    }
  }

  &__info-heading,
  &__info-theme {
    @include fluid-text(14, 16);
    font-weight: $bold;
    letter-spacing: 0.1em;
    color: $white;
  }

  &__info-theme {
    color: $yellow;
  }

  &__form {
    display: grid;
    @include fluid-style(gap, 24, 40);
    width: 100%;
  }

  &__group {
    display: grid;
    grid-template-columns: 1fr;
    @include fluid-style(gap, 24, 32);

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

  &__radios,
  &__checkboxes {
    display: flex;
    @include fluid-style(gap, 24, 40);
  }

  &__radio-label,
  &__checkbox-label {
    display: flex;
    align-items: center;
    @include fluid-text(14, 16);
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
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 60%;
      aspect-ratio: 1;
      background-color: $green;
      border-radius: 100vmax;
      transform: translate(-50%, -50%);
      opacity: 0;
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

  &__sub-settings {
    display: flex;
    align-items: center;
    @include fluid-style(gap, 14, 16);
    animation: fadeIn $transition-base;

    @include pc {
      grid-column: 2;
      margin-top: 4rem;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__selectbox-label {
    display: block;
    @include fluid-text(14, 16);
    line-height: 1;
  }

  &__selectbox-wrapper {
    position: relative;
    min-width: 100px;
    @include fluid-text(14, 16);

    &::after {
      content: "";
      position: absolute;
      top: 50%;
      right: 1em;
      width: 0.5em;
      aspect-ratio: 1;
      border-left: 2px solid $black;
      border-bottom: 2px solid $black;
      transform: translateY(-50%) rotate(-45deg);
      pointer-events: none;
    }
  }

  &__selectbox {
    width: 100%;
    padding: 1em 2em 1em 1em;
    border: 1px solid $black;
    border-radius: $radius-md;
    background-color: $gray;
    cursor: pointer;
  }

  &__start-button {
    @include button-style-fill($blue);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__back-button {
    @include button-style-border($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }
}
</style>