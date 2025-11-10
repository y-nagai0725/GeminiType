<template>
  <div class="admin-view">
    <h1 class="admin-view__title">管理画面 (画面9)</h1>

    <div v-if="authStore.user">
      <p>こんにちは、{{ authStore.user.name }} さん！</p>
      <p v-if="authStore.isAdmin">あなたは「管理者」さんです！♡</p>
      <p v-else>（あなたは「管理者」さんじゃありません…！）</p>
    </div>
    <p v-else>（ユーザー情報を読み込み中…）</p>

    <div v-if="authStore.isAdmin" class="admin-view__content">
      <section class="admin-view__section">
        <h2 class="admin-view__subtitle">ジャンル管理</h2>

        <ul class="admin-view__list">
          <li v-for="genre in adminStore.genres" :key="genre.id">
            ({{ genre.id }}) {{ genre.name }}
          </li>
        </ul>

        <form class="admin-view__form" @submit.prevent="handleAddGenre">
          <input
            type="text"
            placeholder="新しいジャンル名"
            v-model="newGenreName"
            required
          />
          <button type="submit">ジャンル追加</button>
        </form>
      </section>

      <hr class="admin-view__divider" />

      <section class="admin-view__section">
        <h2 class="admin-view__subtitle">問題文管理</h2>

        <table class="admin-view__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ジャンル</th>
              <th>問題文</th>
              <th>(操作)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="problem in adminStore.problems" :key="problem.id">
              <td>{{ problem.id }}</td>
              <td>{{ problem.genre.name }}</td>
              <td>{{ problem.problem_text }}</td>
              <td>
                <button
                  class="admin-view__button--try"
                  @click="openTryModal(problem)"
                >
                  試し打ち♡
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <form class="admin-view__form" @submit.prevent="handleAddProblem">
          <select v-model="newProblemGenreId" required>
            <option value="" disabled>（ジャンルを選択）</option>
            <option
              v-for="genre in adminStore.genres"
              :key="genre.id"
              :value="genre.id"
            >
              {{ genre.name }}
            </option>
          </select>
          <input
            type="text"
            placeholder="新しい問題文"
            v-model="newProblemText"
            required
          />
          <button type="submit">問題文追加</button>
        </form>
      </section>
    </div>
    <div
      v-if="isModalOpen"
      class="admin-view__modal-overlay"
      @click="closeTryModal"
    >
      <div class="admin-view__modal-content" @click.stop>
        <h3>試し打ち♡</h3>
        <p>（ESCキーでも閉じれるよ！）</p>

        <TypingCore v-if="problemToTry" :problems="[problemToTry]" />

        <button @click="closeTryModal" class="admin-view__modal-close">
          閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useAdminStore } from "../stores/adminStore";
import { useNotificationStore } from "../stores/notificationStore";
import TypingCore from "../components/TypingCore.vue";

const authStore = useAuthStore();
const adminStore = useAdminStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const newGenreName = ref("");
const newProblemGenreId = ref("");
const newProblemText = ref("");

const isModalOpen = ref(false);
const problemToTry = ref(null);

/**
 *
 */
onMounted(async () => {
  // ログインしていない場合
  if (!authStore.isLoggedIn) {
    // ログイン画面へ強制遷移
    router.push("/login");
    return;
  }

  // ユーザー情報がない場合
  if (!authStore.user) {
    // ユーザー情報を取得
    await authStore.fetchUser();
  }

  // 管理権限がある場合
  if (authStore.isAdmin) {
    // ジャンル全取得
    adminStore.fetchGenres();
    // 問題全取得
    adminStore.fetchProblems();
  }
});

/**
 * 「ジャンル追加」ボタンが押された時の処理
 */
const handleAddGenre = async () => {
  try {
    await adminStore.addGenre(newGenreName.value);
    notificationStore.addNotification("ジャンルを追加したよ！", "success");
    newGenreName.value = "";
  } catch (error) {
    notificationStore.addNotification("ジャンルの追加に失敗…", "error");
  }
};

/**
 * 「問題文追加」ボタンが押された時の処理
 */
const handleAddProblem = async () => {
  try {
    await adminStore.addProblem(newProblemGenreId.value, newProblemText.value);
    notificationStore.addNotification("問題文を追加したよ！", "success");
    newProblemGenreId.value = "";
    newProblemText.value = "";
  } catch (error) {
    notificationStore.addNotification("問題文の追加に失敗…", "error");
  }
};

/**
 * 「試し打ち」ボタンが押された時の処理
 */
const openTryModal = (problem) => {
  // 「試し打ち」の問題をセット
  problemToTry.value = problem;

  // モーダルを開く
  isModalOpen.value = true;

  // ESCキーで閉じられるようにイベントをセット
  window.addEventListener("keydown", handleEscClose);
};

/**
 * 「モーダル」を閉じる時の処理
 */
const closeTryModal = () => {
  // モーダルを閉じる
  isModalOpen.value = false;

  // 「試し打ち」してた問題をリセット
  problemToTry.value = null;

  // イベント削除
  window.removeEventListener("keydown", handleEscClose);
};

/**
 * ESCキーが押された時の処理
 */
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    // モーダルを閉じる処理
    closeTryModal();
  }
};
</script>

<style lang="scss" scoped>
/* (BEM) ブロック: .admin-view */
.admin-view {
  width: 100%;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;

  &__title {
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 0.5rem;
  }

  &__content {
    margin-top: 2rem;
  }

  &__section {
    margin-bottom: 2rem;
  }

  &__subtitle {
    color: #555;
    margin-bottom: 1rem;
  }

  &__divider {
    border: 0;
    border-top: 1px solid #eee;
    margin: 2rem 0;
  }

  &__form {
    display: flex;
    gap: 10px;
    margin-top: 1rem;

    input[type="text"],
    select {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      flex-grow: 1; /* (★) フォームが横に広がるように（仮） */
    }

    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background-color: #007bff;
      color: white;
      cursor: pointer;
    }
  }

  /* (★) リスト（仮） */
  &__list {
    list-style: disc;
    padding-left: 20px;
  }

  /* (★) テーブル（仮） */
  &__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;

    th,
    td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background-color: #f4f4f4;
    }
  }

  /* (★) 試し打ちボタン（仮） */
  &__button--try {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background-color: #28a745; // (仮の緑色)
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: #218838;
    }
  }

  /* (★) モーダルの「背景（黒いモヤ）」 */
  &__modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  /* (★) モーダルの「本体（白い箱）」 */
  &__modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    min-width: 600px; /* (★) タイピングしやすいように、横幅を広く（仮） */
    position: relative;
  }

  /* (★) モーダルの「閉じる」ボタン（仮） */
  &__modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem;
    border: none;
    background: #eee;
    cursor: pointer;
  }
}
</style>