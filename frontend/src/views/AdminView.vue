<template>
  <div class="admin-view">
    <h1 class="admin-view__title">管理画面 (画面9)</h1>

    <div v-if="authStore.user">
      <p>こんにちは、{{ authStore.user.name }} さん！</p>
      <p v-if="authStore.isAdmin">あなたは「管理者」さんです！♡</p>
      <p v-else style="color: red; font-weight: bold">
        （あなたは「管理者」さんじゃありません…！）
      </p>
    </div>

    <div v-if="authStore.isAdmin" class="admin-view__content">
      <section class="admin-view__section">
        <h2 class="admin-view__subtitle">ジャンル管理</h2>
        <ul class="admin-view__list">
          <li v-for="genre in adminStore.genres" :key="genre.id">
            ({{ genre.id }}) {{ genre.name }}
            <button
              class="admin-view__button--edit"
              @click="openEditModal(genre, 'genre')"
            >
              編集
            </button>
            <button
              class="admin-view__button--delete"
              @click="handleDeleteGenre(genre.id, genre.name)"
            >
              削除
            </button>
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
        <h2 class="admin-view__subtitle">問題文 検索</h2>
        <form class="admin-view__form" @submit.prevent="handleSearch">
          <select v-model="localFilterGenreId">
            <option value="">（すべてのジャンル）</option>
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
            placeholder="問題文（本文）で検索"
            v-model="localFilterSearchText"
          />
          <button type="submit">検索</button>
        </form>
      </section>

      <section class="admin-view__section">
        <h2 class="admin-view__subtitle">問題文管理</h2>

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

        <div class="admin-view__pagination">
          <button
            v-for="page in adminStore.totalPages"
            :key="page"
            :class="{
              'admin-view__page-button--active':
                page === adminStore.currentPage,
            }"
            @click="adminStore.setPage(page)"
          >
            {{ page }}
          </button>
        </div>

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
              <td class="admin-view__actions">
                <button
                  class="admin-view__button--try"
                  @click="openTryModal(problem)"
                >
                  試し打ち
                </button>
                <button
                  class="admin-view__button--edit"
                  @click="openEditModal(problem, 'problem')"
                >
                  編集
                </button>
                <button
                  class="admin-view__button--delete"
                  @click="handleDeleteProblem(problem.id, problem.problem_text)"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="admin-view__pagination">
          <button
            v-for="page in adminStore.totalPages"
            :key="page"
            :class="{
              'admin-view__page-button--active':
                page === adminStore.currentPage,
            }"
            @click="adminStore.setPage(page)"
          >
            {{ page }}
          </button>
        </div>
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

        <TypingCore
          v-if="problemToTry"
          :problems="[problemToTry]"
          :showDebug="true"
        />

        <button @click="closeTryModal" class="admin-view__modal-close">
          閉じる
        </button>
      </div>
    </div>
    <ConfirmModal
      :show="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirmDelete"
      @cancel="closeConfirmModal"
    />
    <Transition name="modal-fade">
      <div
        v-if="isEditModalOpen"
        class="admin-view__modal-overlay"
        @click.self="closeEditModal"
      >
        <div class="admin-view__modal-content" @click.stop>
          <h3 v-if="editType === 'genre'">ジャンル の編集</h3>
          <h3 v-else>問題文 の編集</h3>

          <form @submit.prevent="handleUpdateItem">
            <div v-if="editType === 'genre'" class="admin-view__form-group">
              <label for="edit-genre-name">ジャンル名</label>
              <input
                id="edit-genre-name"
                type="text"
                v-model="editForm.name"
                required
              />
            </div>

            <template v-else>
              <div class="admin-view__form-group">
                <label for="edit-problem-genre">ジャンル</label>
                <select
                  id="edit-problem-genre"
                  v-model="editForm.genre_id"
                  required
                >
                  <option
                    v-for="genre in adminStore.genres"
                    :key="genre.id"
                    :value="genre.id"
                  >
                    {{ genre.name }}
                  </option>
                </select>
              </div>
              <div class="admin-view__form-group">
                <label for="edit-problem-text">問題文</label>
                <input
                  id="edit-problem-text"
                  type="text"
                  v-model="editForm.problem_text"
                  required
                />
              </div>
            </template>

            <div class="admin-view__modal-actions">
              <button
                type="button"
                class="admin-view__button--cancel"
                @click="closeEditModal"
              >
                キャンセル
              </button>
              <button type="submit" class="admin-view__button--confirm">
                更新する
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useAdminStore } from "../stores/adminStore";
import { useNotificationStore } from "../stores/notificationStore";
import TypingCore from "../components/TypingCore.vue";
import ConfirmModal from "../components/ConfirmModal.vue";

const authStore = useAuthStore();
const adminStore = useAdminStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const newGenreName = ref("");
const newProblemGenreId = ref("");
const newProblemText = ref("");

const localFilterGenreId = ref("");
const localFilterSearchText = ref("");

const isModalOpen = ref(false);
const problemToTry = ref(null);

const isConfirmOpen = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const onConfirmAction = ref(null);

const isEditModalOpen = ref(false);
const editType = ref("genre"); // 'genre' と 'problem' を切り替えるよ！
const editForm = reactive({
  id: null,
  name: "", // (ジャンル 用)
  genre_id: "", // (問題文 用)
  problem_text: "", // (問題文 用)
});

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
    // ジャンルを取得
    await adminStore.fetchGenres();

    // 問題文（1ページ目）を取得
    await adminStore.fetchProblems();
  }
});

/**
 * 「ジャンル追加」ボタンが押された時の処理
 */
const handleAddGenre = async () => {
  if (!newGenreName.value) {
    notificationStore.addNotification("ジャンル名を入力して下さい。", "error");
    return;
  }

  try {
    await adminStore.addGenre(newGenreName.value);
    newGenreName.value = "";
  } catch (error) {}
};

/**
 * 「問題文追加」ボタンが押された時の処理
 */
const handleAddProblem = async () => {
  if (!newProblemGenreId.value || !newProblemText.value) {
    notificationStore.addNotification(
      "ジャンルを選択して、問題文を入力して下さい。",
      "error"
    );
    return;
  }

  try {
    await adminStore.addProblem(newProblemGenreId.value, newProblemText.value);
    newProblemGenreId.value = "";
    newProblemText.value = "";
  } catch (error) {}
};

/**
 * 「検索」ボタンが押された時の処理
 */
const handleSearch = () => {
  // 入力されてる検索条件をセットする
  adminStore.filterGenreId = localFilterGenreId.value;
  adminStore.filterSearchText = localFilterSearchText.value;

  // 検索実行
  adminStore.applyFilters();
};

/**
 * 「ジャンル削除」ボタンが押された時
 */
const handleDeleteGenre = (id, name) => {
  // 確認モーダルのタイトル
  confirmTitle.value = "ジャンルの削除";

  // 確認モーダルのメッセージ
  confirmMessage.value = `本当に「${name}」を削除しますか？\n（※問題文 が残ってると削除できません）`;

  // 確認OK時の処理をセット
  onConfirmAction.value = () => adminStore.deleteGenre(id);

  // 確認モーダルを開く
  isConfirmOpen.value = true;
};

/**
 * 「問題文削除」ボタンが押された時
 */
const handleDeleteProblem = (id, text) => {
  // 確認モーダルのタイトル
  confirmTitle.value = "問題文の削除";

  // 確認モーダルのメッセージ
  confirmMessage.value = `本当に「${text}」を削除しますか？`;

  // 確認OK時の処理をセット
  onConfirmAction.value = () => adminStore.deleteProblem(id);

  // 確認モーダルを開く
  isConfirmOpen.value = true;
};

/**
 * 確認モーダルで「削除する」を押したときの処理
 */
const handleConfirmDelete = () => {
  // セットされている処理を実行
  if (onConfirmAction.value) {
    onConfirmAction.value();
  }

  // 確認モーダルを閉じる
  closeConfirmModal();
};

/**
 * 確認モーダルを閉じる
 */
const closeConfirmModal = () => {
  // モーダルを閉じる
  isConfirmOpen.value = false;

  // 処理、タイトル、メッセージを空にする
  onConfirmAction.value = null;
  confirmTitle.value = "";
  confirmMessage.value = "";
};

/**
 * (★) 「編集」 ボタンが押された時
 */
const openEditModal = (item, type) => {
  editType.value = type; // (★) 'genre' か 'problem' かを「覚える」

  // (★) 「編集フォーム」 に「今のデータ」をぜんぶ「コピー」する
  editForm.id = item.id;
  if (type === "genre") {
    editForm.name = item.name;
  } else {
    editForm.genre_id = item.genre_id;
    editForm.problem_text = item.problem_text;
  }

  isEditModalOpen.value = true; // (★) モーダル を「開く」！
};

/**
 * (★) 「編集モーダル」 を「閉じる」時
 */
const closeEditModal = () => {
  isEditModalOpen.value = false;
  // (★) フォームの中身を「お片付け」
  editForm.id = null;
  editForm.name = "";
  editForm.genre_id = "";
  editForm.problem_text = "";
};

/**
 * (★) 「編集モーダル」 の「更新」 ボタンが押された時
 */
const handleUpdateItem = async () => {
  try {
    if (editType.value === "genre") {
      // (★) 「ジャンル更新」 の「魔法」 を呼ぶ！
      if (!editForm.name) return; // (カラっぽはダメ♡)
      await adminStore.updateGenre(editForm.id, editForm.name);
    } else {
      // (★) 「問題文更新」 の「魔法」 を呼ぶ！
      if (!editForm.genre_id || !editForm.problem_text) return;
      await adminStore.updateProblem(
        editForm.id,
        editForm.genre_id,
        editForm.problem_text
      );
    }

    // (★) 成功したら、モーダル を「閉じる」！
    closeEditModal();
  } catch (error) {
    // (★) もし「重複エラー」 とかで失敗したら、
    // store が「エラーを投げて」 くれるから、
    // 「モーダル」 は「閉じない」！（賢い！）
    console.error("更新に失敗…", error);
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

  /* 「ページネーション」 のスタイル（仮） */
  &__pagination {
    margin: 1rem 0;
    display: flex;
    gap: 5px;

    button {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      background-color: #fff;
      cursor: pointer;

      &:hover {
        background-color: #f4f4f4;
      }
    }

    /* (★) 「今いるページ」 のボタンは「色を変える」！ */
    &--active {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
      font-weight: bold;
    }
  }

  /* (★) テーブルの「操作」セル */
  &__actions {
    display: flex;
    gap: 5px; /* ボタン同士をちょっと離す */
  }

  /* (★) 削除ボタン（仮） */
  &__button--delete {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background-color: #dc3545; // (仮の赤色)
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: #c82333;
    }
  }

  /* (★) ジャンル一覧 の「削除ボタン」 用 */
  &__list {
    list-style: disc;
    padding-left: 20px;

    li {
      margin-bottom: 5px;
      button {
        margin-left: 10px; /* 文字とボタンをちょっと離す */
      }
    }
  }

  &__button--edit {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background-color: #ffc107; // (仮の黄色)
    color: #212529;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: #e0a800;
    }
  }

  /* (★) 編集モーダル の「フォーム」の中身 */
  &__form-group {
    margin-bottom: 1.5rem;
    text-align: left;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
    }

    input[type="text"],
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box; /* (★) これ、大事！ */
    }
  }

  /* (★) 編集モーダル の「ボタン置き場」 */
  &__modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;

    button {
      flex-grow: 1; /* (★) 2つのボタンが「同じ幅」になるように */
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
    }
  }

  /* (★) キャンセルボタン（確認モーダル と「おそろい」♡） */
  &__button--cancel {
    background-color: #eee;
    color: #333;
    &:hover {
      background-color: #ddd;
    }
  }
  /* (★) 更新 ボタン（「OK」ボタンと「おそろい」の色 にしとくね！） */
  &__button--confirm {
    background-color: #007bff; // (仮の青色)
    color: white;
    &:hover {
      background-color: #0056b3;
    }
  }
}
</style>