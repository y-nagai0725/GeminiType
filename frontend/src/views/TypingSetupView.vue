<template>
  <div class="setup-view">
    <h1 class="setup-view__title">タイピング設定</h1>

    <div class="setup-view__content">
      <div class="setup-view__info">
        <p v-if="mode === 'gemini'">🤖 AI生成モード (お題: {{ prompt }})</p>
        <p v-else-if="mode === 'db'">
          📚 登録問題モード (ジャンルID: {{ genreId }})
        </p>
      </div>

      <form class="setup-view__form" @submit.prevent="handleStart">
        <div class="setup-view__group">
          <label class="setup-view__label">問題数</label>
          <div class="setup-view__radios">
            <label
              v-for="count in problemCounts"
              :key="count"
              class="setup-view__radio"
            >
              <input
                type="radio"
                :value="count"
                v-model="settingsStore.problemCount"
              />
              {{ count }}問
            </label>
          </div>
        </div>

        <div class="setup-view__group">
          <label class="setup-view__label">サウンド</label>
          <div class="setup-view__checkboxes">
            <label class="setup-view__checkbox">
              <input type="checkbox" v-model="settingsStore.soundEnabled" />
              タイプ音 🎵
            </label>
            <label class="setup-view__checkbox">
              <input type="checkbox" v-model="settingsStore.missSoundEnabled" />
              ミス音 💥
            </label>
          </div>
        </div>

        <button type="submit" class="setup-view__button">
          タイピング開始！
        </button>
      </form>

      <div class="setup-view__back">
        <RouterLink to="/menu">メニューに戻る</RouterLink>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useSettingsStore } from "../stores/settingsStore";
import { useNotificationStore } from "../stores/notificationStore";

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
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #eee;
  border-radius: 8px;
  text-align: center;

  &__title {
    margin-bottom: 2rem;
    color: #333;
  }

  &__info {
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: #e9ecef;
    border-radius: 4px;
    font-weight: bold;
  }

  &__group {
    margin-bottom: 2rem;
    text-align: left;
  }

  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    font-size: 1.1rem;
  }

  &__radios,
  &__checkboxes {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
  }

  &__radio,
  &__checkbox {
    cursor: pointer;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;

    input {
      transform: scale(1.2); /* チェックボックスをちょっと大きく */
    }
  }

  &__button {
    width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: bold;
    color: white;
    background-color: #28a745;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #218838;
    }
  }

  &__back {
    margin-top: 1.5rem;

    a {
      color: #6c757d;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>