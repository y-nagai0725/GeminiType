<template>
  <div class="main-menu">
    <h1 class="main-menu__title">
      <span class="en">MAIN MENU</span>
      <span class="ja">メインメニュー</span>
    </h1>

    <div class="main-menu__contents-wrapper">
      <section class="main-menu__section">
        <div class="main-menu__section-top">
          <h2 class="main-menu__subtitle">
            <span class="main-menu__highlight main-menu__highlight--ai"
              >AI問題生成</span
            >モード
          </h2>
          <p class="main-menu__text">
            好きなテーマで、<br
              class="main-menu__br"
            />AIに問題を作ってもらおう！
          </p>
        </div>

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
            :maxlength="MAX_GEMINI_PROMPT_LENGTH"
            required
          />
          <button type="submit" class="main-menu__button">
            AIモードでスタート！<ArrowIcon class="main-menu__arrow-icon" />
          </button>
        </form>
      </section>

      <section class="main-menu__section">
        <div class="main-menu__section-top">
          <h2 class="main-menu__subtitle">
            <span class="main-menu__highlight main-menu__highlight--db"
              >登録問題</span
            >モード
          </h2>
          <p class="main-menu__text">
            用意されたジャンルから<br class="main-menu__br" />選んで練習しよう！
          </p>
        </div>

        <div class="main-menu__list-outer-wrapper">
          <Simplebar class="main-menu__genre-list-wrapper" :auto-hide="false">
            <Loading
              v-if="isGenreLoading"
              class="main-menu__loading"
              :text="'ジャンル読み込み中です…'"
              :bgColor="'white'"
              :lineColor="'blue'"
            />

            <div v-else-if="genreErrorMessage" class="main-menu__error">
              <p class="main-menu__error-message">{{ genreErrorMessage }}</p>
            </div>

            <template v-else>
              <div v-if="genres.length <= 0" class="main-menu__no-data">
                <p class="main-menu__no-data-message">
                  {{ NO_GENRES_MESSAGE }}
                </p>
              </div>

              <div v-else class="main-menu__genre-list">
                <button
                  v-for="genre in genres"
                  :key="genre.id"
                  class="main-menu__genre-button"
                  @click="handleStartDbMode(genre.id, genre.name)"
                >
                  {{ genre.name }}
                </button>
              </div>
            </template>
          </Simplebar>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useNotificationStore } from "../stores/notificationStore";
import Simplebar from "simplebar-vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import Loading from "@/components/Loading.vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ジャンル名が無い場合のメッセージ
 */
const NO_GENRES_MESSAGE = "ジャンルデータがありません。";

/**
 * ローディングの最低表示時間 (ミリ秒)
 */
const MIN_LOADING_MS = 300;

/**
 * Geminiの問題生成プロンプトの最大文字数
 */
const MAX_GEMINI_PROMPT_LENGTH = 20;

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * router
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * ジャンル一覧のローディング状態
 */
const isGenreLoading = ref(false);

/**
 * ジャンル取得時のエラーメッセージ
 */
const genreErrorMessage = ref("");

/**
 * ジャンル一覧データ
 */
const genres = ref([]);

/**
 * AI生成モードのお題 (v-model)
 */
const aiPrompt = ref("");

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * AIモードで次へ（設定画面へ）進む処理
 */
const handleStartAiMode = () => {
  // バリデーション: 空チェック
  if (aiPrompt.value === "") {
    notificationStore.addNotification("お題を入力して下さい。", "error");
    return;
  }

  // お題の文字数チェック
  if (aiPrompt.value.length > MAX_GEMINI_PROMPT_LENGTH) {
    notificationStore.addNotification(
      `お題は${MAX_GEMINI_PROMPT_LENGTH}文字以内にして下さい。`,
      "error"
    );
    return;
  }

  // 設定画面へ遷移 (Geminiモードとしてパラメータを渡す)
  router.push({
    path: "/typing/setup",
    query: { mode: "gemini", prompt: aiPrompt.value },
  });
};

/**
 * DBモードで次へ（設定画面へ）進む処理
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

  // 設定画面へ遷移 (DBモードとしてパラメータを渡す)
  router.push({
    path: "/typing/setup",
    query: { mode: "db", genreId, genreName },
  });
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理 (画面を開いた時にジャンル一覧を取得)
 */
onMounted(async () => {
  // 初期化とローディング開始
  isGenreLoading.value = true;
  genreErrorMessage.value = "";

  try {
    // ジャンルを取得しつつ、最低待ち時間を並行して消化する (FOUC防止)
    const [response] = await Promise.all([
      api.get("/api/genres"),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    genres.value = response.data;
  } catch (error) {
    genreErrorMessage.value = "ジャンルの取得に失敗しました。";
    notificationStore.addNotification(
      error.response?.data?.message || "ジャンルの読み込みに失敗しました。",
      "error"
    );
  } finally {
    isGenreLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * メインメニュー 全体レイアウト
 * ========================================================================= */
.main-menu {
  @include contents-width;

  display: flex;
  flex-direction: column;
  max-width: 50rem;
  margin-inline: auto;

  @include pc {
    max-width: 100rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include contents-padding;
    @include fluid-style(gap, 40, 64);

    display: grid;
    grid-template-columns: 1fr;

    @include pc {
      grid-template-columns: 1fr 1fr;
    }
  }

  /* =======================================================================
   * 各モードのセクション (AI / DB 共通)
   * ======================================================================= */
  &__section {
    @include fluid-style(height, 330, 480);
    @include fluid-style(padding, 24, 40);

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    background-color: $gray;
    border-radius: $radius-lg;

    @include pc {
      height: 44rem;
    }
  }

  &__section-top {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
  }

  &__subtitle {
    @include fluid-text(20, 24);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__highlight {
    &--ai {
      color: $green;
    }

    &--db {
      color: $blue;
    }
  }

  &__text {
    @include fluid-text(12, 16);

    line-height: 1.8;
    letter-spacing: 0.1em;

    @include pc {
      line-height: 1;
    }
  }

  &__br {
    @include pc {
      display: none;
    }
  }

  /* =======================================================================
   * AI問題生成モード固有のフォームスタイル
   * ======================================================================= */
  &__form {
    width: 100%;
  }

  &__label {
    @include fluid-text(12, 16);

    display: block;
    margin-bottom: 0.75em;
    font-weight: $bold;
    letter-spacing: 0.1em;
  }

  &__input {
    @include input-style($white);
    @include fluid-style(margin-bottom, 32, 56);
  }

  &__button {
    @include button-style-fill($green);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    width: 100%;
    margin-inline: auto;

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

  /* =======================================================================
   * 登録問題 (DB) モード固有のリストスタイル
   * ======================================================================= */
  &__list-outer-wrapper {
    @include fluid-style(margin-top, 16, 48);

    position: relative;
    flex: 1;
    width: 100%;
    min-height: 0;
  }

  &__genre-list-wrapper {
    height: 100%;

    /* simplebarのカスタマイズ設定 */
    &::v-deep(.simplebar-track.simplebar-vertical) {
      /* スクロールバー幅 */
      @include fluid-style(width, 9, 11);

      /* スクロールバー位置 */
      @include fluid-style(--scrollbar-position-right, 14, 22);

      right: calc(var(--scrollbar-position-right) * -1);

      .simplebar-scrollbar::before {
        /* スクロールバーの色 */
        background-color: $blue;
        opacity: 1;
      }
    }
  }

  /* --- リスト取得中の各種ステータス表示 --- */
  &__loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &__error,
  &__no-data {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    transform: translate(-50%, -50%);
  }

  &__error-message,
  &__no-data-message {
    @include fluid-text(12, 16);

    font-weight: $bold;
    color: $red;
    text-align: center;
  }

  /* --- ジャンルボタンのリスト --- */
  &__genre-list {
    @include fluid-style(gap, 12, 16);

    display: flex;
    flex-direction: column;

    @include pc {
      /* 先頭のボタン要素がhover時に上に浮いた際、見切れないようにするための余白 */
      padding-top: 2px;
    }
  }

  &__genre-button {
    @include fluid-text(12, 16);

    position: relative;
    padding: 1em;
    font-weight: $bold;
    cursor: pointer;
    background-color: $white;
    border-radius: $radius-md;
    transition: color $transition-base, box-shadow $transition-base,
      transform $transition-base;

    /* ボタン右側の装飾 (小さな矢印アイコン的な三角形) */
    &::after {
      position: absolute;
      top: 50%;
      right: 1em;
      width: 0.8em;
      aspect-ratio: 1;
      content: "";
      background-color: rgba($black, 0.25);
      clip-path: polygon(0 0, 0% 100%, 100% 50%);
      transform: translateY(-50%);
      transition: background-color $transition-base, transform $transition-base;
    }

    @include hover {
      color: $orange;
      box-shadow: $hovered-box-shadow;
      transform: translateY(-2px);

      &::after {
        background-color: $orange;
        transform: translate(
          4px,
          -50%
        ); /* ホバー時に三角形が右に少しスライドする */
      }
    }
  }
}
</style>