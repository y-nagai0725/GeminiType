<template>
  <div class="main-menu">
    <h1 class="main-menu__title">GeminiType メインメニュー</h1>

    <div class="main-menu__content">
      <section class="main-menu__section main-menu__section--ai">
        <h2>🤖 AI生成モード</h2>
        <p>好きなテーマを入力して、AIに問題を作ってもらおう！</p>

        <form
          @submit.prevent="handleStartAiMode"
          class="main-menu__form"
          novalidate
        >
          <input
            type="text"
            v-model.trim="aiPrompt"
            placeholder="例: 猫、プログラミング、元気が出る言葉..."
            class="main-menu__input"
            required
          />
          <button type="submit" class="main-menu__button">
            AIでスタート！
          </button>
        </form>
      </section>

      <div class="main-menu__divider">OR</div>

      <section class="main-menu__section main-menu__section--db">
        <h2>📚 登録問題モード</h2>
        <p>用意されたジャンルから選んで練習しよう！</p>

        <div v-if="isLoading">読み込み中...</div>
        <div v-else class="main-menu__genre-list">
          <button
            v-for="genre in genres"
            :key="genre.id"
            class="main-menu__genre-button"
            @click="handleStartDbMode(genre.id)"
          >
            {{ genre.name }}
          </button>
        </div>
      </section>
    </div>

    <div class="main-menu__links">
      <RouterLink to="/login">ログイン画面へ</RouterLink> |
      <RouterLink to="/admin">管理画面へ</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useNotificationStore } from "../stores/notificationStore";

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
 */
const handleStartDbMode = (genreId) => {
  // バリデーション: IDが空または数字ではない場合は止める
  if (!genreId || typeof genreId !== "number") {
    notificationStore.addNotification(
      "ジャンルが正しく選択されていません。",
      "error"
    );
    return;
  }

  // 設定画面へ遷移
  router.push({
    path: "/typing/setup",
    query: { mode: "db", genreId },
  });
};
</script>

<style lang="scss" scoped>
/* スタイルは変更なし！ */
.main-menu {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    margin-top: 2rem;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  &__section {
    flex: 1;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;

    &--ai {
      border-color: #b3d7ff;
      background: #e6f2ff;
    }
    &--db {
      border-color: #c3e6cb;
      background: #d4edda;
    }
  }

  &__divider {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #999;
  }

  &__input {
    width: 80%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  &__button {
    padding: 0.5rem 1.5rem;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: #0056b3;
    }
  }

  &__genre-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  &__genre-button {
    padding: 0.5rem 1rem;
    background-color: white;
    border: 1px solid #28a745;
    color: #28a745;
    border-radius: 20px;
    cursor: pointer;
    &:hover {
      background-color: #28a745;
      color: white;
    }
  }

  &__links {
    margin-top: 3rem;
    font-size: 0.9rem;
  }
}
</style>