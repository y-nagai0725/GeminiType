<template>
  <div class="admin-view">
    <h1 class="admin-view__title">
      <span class="en">ADMIN</span>
      <span class="ja">管理</span>
    </h1>

    <div class="admin-view__contents-wrapper">
      <div v-if="authStore.user" class="admin-view__welcome">
        <p
          class="admin-view__welcome-message admin-view__welcome-message--blue"
        >
          こんにちは、{{ authStore.user.name }} さん
        </p>
        <template v-if="authStore.isAdmin">
          <p class="admin-view__welcome-message">あなたは「管理者」です！</p>
        </template>
        <template v-else>
          <p class="admin-view__welcome-message">
            あなたは「管理者」ではありませんので、<br />このページでの管理操作が許可されていません。
          </p>
          <RouterLink to="/menu" class="admin-view__welcome-link">
            メインメニューへ
            <ArrowIcon class="admin-view__arrow-icon" />
          </RouterLink>
        </template>
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
          <form
            class="admin-view__form"
            @submit.prevent="handleAddGenre"
            novalidate
          >
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
          <form
            class="admin-view__form"
            @submit.prevent="handleSearch"
            novalidate
          >
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
              placeholder="（問題文）と（ひらがな）で検索"
              v-model="localFilterSearchText"
            />
            <button type="submit">検索</button>
          </form>
        </section>

        <section class="admin-view__section">
          <h2 class="admin-view__subtitle">問題文管理</h2>

          <form
            class="admin-view__form"
            @submit.prevent="handleAddProblem"
            novalidate
          >
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
            <input
              type="text"
              placeholder="ひらがな"
              v-model="newProblemHiragana"
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
              @click="handleSetPage(page)"
            >
              {{ page }}
            </button>
          </div>

          <div class="admin-view__table-wrapper">
            <table class="admin-view__problem-table">
              <thead>
                <tr class="admin-view__problem-table-tr">
                  <th
                    class="admin-view__problem-table-th admin-view__problem-table-th--genre"
                  >
                    ジャンル
                  </th>
                  <th
                    class="admin-view__problem-table-th admin-view__problem-table-th--problem"
                  >
                    問題文
                  </th>
                  <th
                    class="admin-view__problem-table-th admin-view__problem-table-th--hiragana"
                  >
                    ひらがな
                  </th>
                  <th
                    class="admin-view__problem-table-th admin-view__problem-table-th--action"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="problem in adminStore.problems"
                  :key="problem.id"
                  class="admin-view__problem-table-tr"
                >
                  <td
                    class="admin-view__problem-table-td admin-view__problem-table-td--genre"
                  >
                    {{ problem.genre.name }}
                  </td>
                  <td
                    class="admin-view__problem-table-td admin-view__problem-table-td--problem"
                  >
                    {{ problem.problem_text }}
                  </td>
                  <td
                    class="admin-view__problem-table-td admin-view__problem-table-td--hiragana"
                  >
                    {{ problem.problem_hiragana }}
                  </td>
                  <td
                    class="admin-view__problem-table-td admin-view__problem-table-td--action"
                  >
                    <button
                      class="admin-view__problem-table-button admin-view__problem-table-button--try"
                      @click="openTryModal(problem)"
                    >
                      試し打ち
                    </button>
                    <button
                      class="admin-view__problem-table-button admin-view__problem-table-button--edit"
                      @click="openEditModal(problem, 'problem')"
                    >
                      編集
                    </button>
                    <button
                      class="admin-view__problem-table-button admin-view__problem-table-button--delete"
                      @click="
                        handleDeleteProblem(problem.id, problem.problem_text)
                      "
                    >
                      削除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="admin-view__pagination">
            <button
              v-for="page in adminStore.totalPages"
              :key="page"
              :class="{
                'admin-view__page-button--active':
                  page === adminStore.currentPage,
              }"
              @click="handleSetPage(page)"
            >
              {{ page }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="isTryModalOpen"
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
    </Transition>
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

          <form @submit.prevent="handleUpdateItem" novalidate>
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
              <div class="admin-view__form-group">
                <label for="edit-problem-hiragana">ひらがな</label>
                <input
                  id="edit-problem-hiragana"
                  type="text"
                  v-model="editForm.problem_hiragana"
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
import romaMapData from "@/data/romanTypingParseDictionary.json";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * 管理store
 */
const adminStore = useAdminStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * router
 */
const router = useRouter();

/**
 * (登録用)新しいジャンル名
 */
const newGenreName = ref("");

/**
 * (登録用)新しい問題のジャンルid
 */
const newProblemGenreId = ref("");

/**
 * (登録用)新しい問題文
 */
const newProblemText = ref("");

/**
 * (登録用)新しい問題文のひらがな
 */
const newProblemHiragana = ref("");

/**
 * 検索用設定: ジャンルid
 */
const localFilterGenreId = ref("");

/**
 * 検索用設定: 検索キーワード
 */
const localFilterSearchText = ref("");

/**
 * 試し打ちモーダルの表示・非表示
 */
const isTryModalOpen = ref(false);

/**
 * 試し打ちの問題
 */
const problemToTry = ref(null);

/**
 * 確認モーダルの表示・非表示
 */
const isConfirmOpen = ref(false);

/**
 * 確認モーダルのタイトル
 */
const confirmTitle = ref("");

/**
 * 確認モーダルのメッセージ
 */
const confirmMessage = ref("");

/**
 * 確認了承時の処理
 */
const onConfirmAction = ref(null);

/**
 * 編集モーダルの表示・非表示
 */
const isEditModalOpen = ref(false);

/**
 * 編集の種類('genre' と 'problem' を切り替える)
 */
const editType = ref("genre");

/**
 * 編集フォーム
 */
const editForm = reactive({
  id: null, // 対象のid
  name: "", // (ジャンル用)ジャンル名
  genre_id: "", // (問題用)ジャンルid
  problem_text: "", // (問題用)問題文
  problem_hiragana: "", // (問題用)ひらがな
});

/**
 * マウント時処理
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
    try {
      // ジャンルを取得
      await adminStore.fetchGenres();
    } catch (error) {
      notificationStore.addNotification(
        error.response?.data?.message || "ジャンルの取得に失敗しました。",
        "error"
      );
    }

    try {
      // 問題文（1ページ目）を取得
      await adminStore.fetchProblems();
    } catch (error) {
      notificationStore.addNotification(
        error.response?.data?.message || "問題文の取得に失敗しました。",
        "error"
      );
    }
  }
});

/**
 * 入力された文字列が、タイピング辞書にある文字だけで構成されているかチェック
 * @param {String} text チェック対象の文字列
 * @returns {Boolean} OKならtrue
 */
const isValidReading = (text) => {
  // 辞書にある「Pattern（文字）」をSetにして検索を爆速にする
  const allowedChars = new Set(romaMapData.map((item) => item.Pattern));

  // 1文字ずつチェックして、辞書にない文字があれば false
  for (const char of text) {
    if (!allowedChars.has(char)) {
      return false;
    }
  }
  return true;
};

/**
 * 「ジャンル追加」ボタンが押された時の処理
 */
const handleAddGenre = async () => {
  // バリデーション
  if (!newGenreName.value || newGenreName.value.trim() === "") {
    notificationStore.addNotification("ジャンル名を入力して下さい。", "error");
    return;
  }

  try {
    // ジャンル登録
    await adminStore.addGenre(newGenreName.value);

    // 成功通知
    notificationStore.addNotification("ジャンルを追加しました。", "success");

    // ジャンル名を空にする
    newGenreName.value = "";
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "ジャンルの追加に失敗しました。",
      "error"
    );
  }
};

/**
 * 「問題文追加」ボタンが押された時の処理
 */
const handleAddProblem = async () => {
  // バリデーション
  if (
    !newProblemGenreId.value ||
    !newProblemText.value ||
    newProblemText.value.trim() === "" ||
    !newProblemHiragana.value ||
    newProblemHiragana.value.trim() === ""
  ) {
    notificationStore.addNotification(
      "ジャンル、問題文、ひらがなを全て入力して下さい。",
      "error"
    );
    return;
  }

  // ひらがなチェック
  if (!isValidReading(newProblemHiragana.value)) {
    notificationStore.addNotification(
      "ひらがなに「未対応の文字」が含まれています！辞書にある文字（ひらがな、半角英数、一部記号）だけで入力して下さい。",
      "error"
    );
    return;
  }

  try {
    // 問題文登録
    await adminStore.addProblem(
      newProblemGenreId.value,
      newProblemText.value,
      newProblemHiragana.value
    );

    // 成功通知
    notificationStore.addNotification("問題文を追加しました。", "success");

    // フォームを空にする
    newProblemGenreId.value = "";
    newProblemText.value = "";
    newProblemHiragana.value = "";
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "問題文の追加に失敗しました。",
      "error"
    );
  }
};

/**
 * 「検索」ボタンが押された時の処理
 */
const handleSearch = async () => {
  try {
    // 入力されてる検索条件をセットする
    adminStore.filterGenreId = localFilterGenreId.value;
    adminStore.filterSearchText = localFilterSearchText.value;

    // 検索実行
    await adminStore.applyFilters();
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "検索に失敗しました。",
      "error"
    );
  }
};

/**
 * 「ページネーション」ボタンが押された時の処理
 * @param {Number} newPage 表示するページ番号
 */
const handleSetPage = async (newPage) => {
  try {
    // newPageのページを表示する
    await adminStore.setPage(newPage);
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "ページの取得に失敗しました。",
      "error"
    );
  }
};

/**
 * 「ジャンル削除」ボタンが押された時の処理
 * @param {Number} id 削除対象id
 * @param {String} name ジャンル名
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
 * 「問題文削除」ボタンが押された時の処理
 * @param {Number} id 削除対象id
 * @param {String} text 問題文
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
const handleConfirmDelete = async () => {
  // セットされている処理を実行
  if (onConfirmAction.value) {
    try {
      // 処理実行
      await onConfirmAction.value();

      // 成功通知
      notificationStore.addNotification("削除しました。", "success");
    } catch (error) {
      // エラー通知
      notificationStore.addNotification(
        error.response?.data?.message || "削除に失敗しました。",
        "error"
      );
    }
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
 * 「編集」ボタンが押された時の処理
 * @param {*} item 問題オブジェクト
 * @param {String} type 'genre' か 'problem'
 */
const openEditModal = (item, type) => {
  // 'genre' か 'problem'をセットする
  editType.value = type;

  // 編集モーダルのフォームに選択したデータの値をコピーする
  editForm.id = item.id;
  if (type === "genre") {
    // ---ジャンル編集の場合---
    // ジャンル名
    editForm.name = item.name;
  } else {
    // ---問題文編集の場合---
    // ジャンルID
    editForm.genre_id = item.genre_id;

    // 問題文
    editForm.problem_text = item.problem_text;

    // ひらがな
    editForm.problem_hiragana = item.problem_hiragana;
  }

  // モーダルを開く
  isEditModalOpen.value = true;
};

/**
 * 編集モーダルを閉じる
 */
const closeEditModal = () => {
  // モーダルを閉じる
  isEditModalOpen.value = false;

  // フォームの中身を空にする
  editForm.id = null;
  editForm.name = "";
  editForm.genre_id = "";
  editForm.problem_text = "";
  editForm.problem_hiragana = "";
};

/**
 * 編集モーダルの「更新」ボタンが押された時の処理
 */
const handleUpdateItem = async () => {
  try {
    if (editType.value === "genre") {
      // ---ジャンル編集の場合---
      // ジャンル名のバリデーション
      if (!editForm.name || editForm.name.trim() === "") {
        notificationStore.addNotification(
          "ジャンル名を入力して下さい。",
          "error"
        );
        return;
      }

      // ジャンル更新
      await adminStore.updateGenre(editForm.id, editForm.name);
    } else {
      // ---問題文編集の場合---
      // ジャンルと問題文とひらがなのバリデーション
      if (
        !editForm.genre_id ||
        !editForm.problem_text ||
        editForm.problem_text.trim() === "" ||
        !editForm.problem_hiragana ||
        editForm.problem_hiragana.trim() === ""
      ) {
        notificationStore.addNotification(
          "ジャンル、問題文、ひらがなを全て入力して下さい。",
          "error"
        );
        return;
      }

      // ひらがなチェック
      if (!isValidReading(editForm.problem_hiragana)) {
        notificationStore.addNotification(
          "ひらがなに「未対応の文字」が含まれています！辞書にある文字（ひらがな、半角英数、一部記号）だけで入力して下さい。",
          "error"
        );
        return;
      }

      // 問題文更新
      await adminStore.updateProblem(
        editForm.id,
        editForm.genre_id,
        editForm.problem_text,
        editForm.problem_hiragana
      );
    }

    // 成功通知
    notificationStore.addNotification("更新しました。", "success");

    // モーダルを閉じる
    closeEditModal();
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "更新に失敗しました。",
      "error"
    );
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
</script>

<style lang="scss" scoped>
.admin-view {
  @include contents-width;

  @include pc {
    max-width: 1100px;
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

  &__welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 16, 24);
  }

  &__welcome-message {
    font-weight: $bold;
    @include fluid-text(14, 20);
    text-align: center;

    &--blue {
      color: $blue;
    }
  }

  &__welcome-link {
    @include button-style-border($green);
    @include fluid-style(width, 276, 432);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__content {
  }

  &__section {
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

  &__table-wrapper {
    overflow-x: auto;
  }

  &__problem-table {
    width: 100%;
    min-width: 1100px;
  }

  &__problem-table-tr {
    &:nth-of-type(odd) {
      background-color: $gray;
    }
  }

  &__problem-table-th {
    padding: 1em;
    font-size: 1.4rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
    color: $white;
    background-color: $green;

    &--genre {
      width: 15%;
      text-align: left;
    }

    &--problem {
      width: 30%;
      text-align: left;
    }

    &--hiragana {
      width: 30%;
      text-align: left;
    }

    &--action {
      width: 25%;
      text-align: center;
    }
  }

  &__problem-table-td {
    padding: 1em;
    font-size: 1.4rem;
    line-height: 1;

    &--genre {
      text-align: left;
    }

    &--problem {
      text-align: left;
    }

    &--hiragana {
      text-align: left;
    }

    &--action {
      display: flex;
      justify-content: center;
      gap: 1.6rem;
    }
  }

  &__problem-table-button {
    @include fluid-text(11, 13);
    padding: 1em;

    &--try {
      @include button-style-fill($blue);
    }

    &--edit {
      @include button-style-fill($green);
    }

    &--delete {
      @include button-style-fill($red);
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

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .admin-view__modal-content {
    transform: translateY(-20px);
  }
}

/* (★) 「入ってる『間』」と「出ていってる『間』」の「アニメーション」の「設定」 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;

  .admin-view__modal-content {
    transition: transform 0.2s ease;
  }
}
</style>