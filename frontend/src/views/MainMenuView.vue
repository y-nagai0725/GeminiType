<template>
  <div class="main-menu">
    <h1 class="main-menu__title">
      <span class="en">MAIN MENU</span>
      <span class="ja">メインメニュー</span>
    </h1>

    <div class="main-menu__contents-wrapper">
      <section class="main-menu__section main-menu__section--ai">
        <h2 class="main-menu__subtitle">AI問題生成モード</h2>
        <p class="main-menu__text">
          好きなテーマで、<br class="main-menu__br" />AIに問題を作ってもらおう！
        </p>

        <form
          @submit.prevent="handleStartAiMode"
          class="main-menu__form"
          novalidate
        >
          <label for="ai-prompt" class="main-menu__label"
            >問題生成のテーマ</label
          >
          <input
            type="text"
            v-model.trim="aiPrompt"
            placeholder="例: 料理、動物、元気が出る言葉..."
            class="main-menu__input"
            id="ai-prompt"
            required
          />
          <button type="submit" class="main-menu__button">
            AIモードでスタート！<ArrowIcon class="main-menu__arrow-icon" />
          </button>
        </form>
      </section>

      <section class="main-menu__section main-menu__section--db">
        <h2 class="main-menu__subtitle">登録問題モード</h2>
        <p class="main-menu__text">
          用意されたジャンルから<br class="main-menu__br" />選んで練習しよう！
        </p>
        <div class="main-menu__list-outer-wrapper">
          <Simplebar class="main-menu__genre-list-wrapper" :auto-hide="false">
            <div v-if="isLoading" class="main-menu__loader"></div>
            <p
              v-if="!isLoading && genres.length === 0"
              class="main-menu__no-data"
            >
              {{ NO_GENRES_MESSAGE }}
            </p>
            <div
              v-if="!isLoading && genres.length > 0"
              class="main-menu__genre-list"
            >
              <button
                v-for="genre in genres"
                :key="genre.id"
                class="main-menu__genre-button"
                @click="handleStartDbMode(genre.id, genre.name)"
              >
                {{ genre.name }}
                <ArrowIcon class="main-menu__arrow-icon" />
              </button>
            </div>
          </Simplebar>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useNotificationStore } from "../stores/notificationStore";
import Simplebar from "simplebar-vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

/**
 * ジャンル名が無い場合のメッセージ
 */
const NO_GENRES_MESSAGE = "ジャンルデータがありません。";

/**
 * router
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * ジャンル一覧
 */
const genres = ref([]);

/**
 * ローディング中かどうか
 */
const isLoading = ref(false);

/**
 * AI生成モードのお題
 */
const aiPrompt = ref("");

/**
 * 画面を開いた時にジャンル一覧を取得
 */
onMounted(async () => {
  isLoading.value = true;
  try {
    // ジャンルを取得
    const response = await api.get("/api/genres");
    genres.value = response.data;
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "ジャンルの読み込みに失敗しました。",
      "error"
    );
  } finally {
    isLoading.value = false;
  }
});

/**
 * AIモードで次へ（設定画面へ）
 */
const handleStartAiMode = () => {
  // バリデーション: 空チェック
  if (aiPrompt.value === "") {
    notificationStore.addNotification("お題を入力して下さい。", "error");
    return;
  }

  // 設定画面へ遷移
  router.push({
    path: "/typing/setup",
    query: { mode: "gemini", prompt: aiPrompt.value },
  });
};

/**
 * DBモードで次へ（設定画面へ）
 * @param {Number} genreId 選択されたジャンルID
 * @param {String} genreName 選択されたジャンル名
 */
const handleStartDbMode = (genreId, genreName) => {
  // ジャンルIDバリデーション: IDが空または数字ではない場合は止める
  if (!genreId || typeof genreId !== "number") {
    notificationStore.addNotification(
      "ジャンルが正しく選択されていません。",
      "error"
    );
    return;
  }

  // ジャンル名バリデーション: ジャンル名が空の場合は止める
  if (!genreName) {
    notificationStore.addNotification(
      "ジャンルが正しく選択されていません。",
      "error"
    );
    return;
  }

  // 設定画面へ遷移
  router.push({
    path: "/typing/setup",
    query: { mode: "db", genreId, genreName },
  });
};
</script>

<style lang="scss" scoped>
.main-menu {
  @include contents-width;

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    display: grid;
    grid-template-columns: 1fr;
    @include fluid-style(gap, 40, 80);
    max-width: 500px;
    margin-inline: auto;
    @include contents-padding;

    @include pc {
      grid-template-columns: 1fr 1fr;
      max-width: none;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 24, 32);
    min-width: 0;
    @include fluid-style(padding, 24, 40);
    border-radius: $radius-lg;

    &--ai {
      background-color: $light-blue;
    }

    &--db {
      background-color: $light-green;
    }
  }

  &__subtitle {
    @include fluid-text(20, 24);
    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__text {
    text-align: center;
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1.8;

    @include pc {
      line-height: 1;
    }
  }

  &__br {
    @include pc {
      display: none;
    }
  }

  &__form {
    width: 100%;
  }

  &__label {
    display: block;
    @include fluid-style(margin-bottom, 8, 16);
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__input {
    width: 100%;
    padding: 1em;
    @include fluid-style(margin-bottom, 24, 32);
    @include fluid-text(14, 18);
    font-weight: $bold;
    background-color: $white;
    border-radius: $radius-md;
    transition: box-shadow $transition-base;

    &:focus {
      box-shadow: $text-box-shadow;
    }

    &::placeholder {
      color: $light-black;
    }
  }

  &__button {
    @include button-style-fill($blue);
    width: 100%;
    margin-inline: auto;
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    @include pc {
      width: auto;
      padding: 2.4rem 3.2rem;
    }

    @include hover {
      background-color: $white;
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__list-outer-wrapper {
    position: relative;
    width: 100%;
  }

  &__genre-list-wrapper {
    @include fluid-style(height, 150, 240);

    &::v-deep(.simplebar-scrollbar::before) {
      // スクロールバー色
      background-color: $green;

      // スクロールバー不透明度（デフォルト0.5）
      opacity: 1;
    }

    &::v-deep(.simplebar-track.simplebar-vertical) {
      // スクロールバー幅
      @include fluid-style(width, 9, 11);

      // スクロールバー位置
      @include fluid-style(--scrollbar-position-right, 12, 20);
      right: calc(var(--scrollbar-position-right) * -1);
    }
  }

  &__loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border: 4px solid $white;
    border-top-color: $green;
    border-radius: 100vmax;
    animation: spin 1s linear infinite;
    z-index: 10;
  }

  @keyframes spin {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  &__no-data {
    text-align: center;
    @include fluid-text(14, 18);
    font-weight: $bold;
    color: $red;
  }

  &__genre-list {
    display: flex;
    flex-wrap: wrap;
    @include fluid-style(gap, 16, 24);
  }

  &__genre-button {
    @include button-style-border($green);
    @include fluid-style(padding-block, 12, 20);
    @include fluid-style(padding-inline, 16, 24);
    @include fluid-text(12, 16);
    background-color: $white;
  }
}
</style>