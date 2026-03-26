<template>
  <div class="admin-view">
    <h1 class="admin-view__title">
      <span class="en">ADMIN</span>
      <span class="ja">管理ページ</span>
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
        <div class="admin-view__tab-control">
          <button
            class="admin-view__tab-button admin-view__tab-button--genre"
            :class="{ selected: currentTab === 'genre' }"
            @click="currentTab = 'genre'"
          >
            ジャンル管理
          </button>
          <button
            class="admin-view__tab-button admin-view__tab-button--problem"
            :class="{ selected: currentTab === 'problem' }"
            @click="currentTab = 'problem'"
          >
            問題管理
          </button>
        </div>
        <section v-if="currentTab === 'genre'" class="admin-view__section">
          <form
            class="admin-view__form"
            @submit.prevent="handleAddGenre"
            novalidate
          >
            <input
              type="text"
              class="admin-view__input"
              placeholder="追加するジャンル名を入力…"
              v-model="newGenreName"
              required
            />
            <button type="submit" class="admin-view__input-button">
              <PlusIcon class="admin-view__input-button-icon" />追加
            </button>
          </form>
          <div class="admin-view__table-wrapper">
            <div v-if="isTableLoading" class="admin-view__loading-overlay">
              <Loading />
            </div>
            <table class="admin-view__genre-table">
              <thead>
                <tr class="admin-view__genre-table-tr">
                  <th
                    class="admin-view__genre-table-th admin-view__genre-table-th--id"
                  >
                    ID
                  </th>
                  <th
                    class="admin-view__genre-table-th admin-view__genre-table-th--genre"
                  >
                    ジャンル名
                  </th>
                  <th
                    class="admin-view__genre-table-th admin-view__genre-table-th--count"
                  >
                    登録問題数
                  </th>
                  <th
                    class="admin-view__genre-table-th admin-view__genre-table-th--action"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="genre in adminStore.genres"
                  :key="genre.id"
                  class="admin-view__genre-table-tr"
                >
                  <td
                    class="admin-view__genre-table-td admin-view__genre-table-td--id"
                  >
                    {{ genre.id }}
                  </td>
                  <td
                    class="admin-view__genre-table-td admin-view__genre-table-td--genre"
                  >
                    {{ genre.name }}
                  </td>
                  <td
                    class="admin-view__genre-table-td admin-view__genre-table-td--count"
                  >
                    {{ genre._count.problems }}
                  </td>
                  <td
                    class="admin-view__genre-table-td admin-view__genre-table-td--action"
                  >
                    <button
                      class="admin-view__genre-table-button admin-view__genre-table-button--edit"
                      @click="openEditModal(genre, 'genre')"
                    >
                      <EditIcon
                        class="admin-view__table-button-icon admin-view__table-button-icon--edit"
                      />
                    </button>
                    <button
                      class="admin-view__genre-table-button admin-view__genre-table-button--delete"
                      @click="handleDeleteGenre(genre.id, genre.name)"
                    >
                      <DeleteIcon
                        class="admin-view__table-button-icon admin-view__table-button-icon--delete"
                      />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section
          v-else-if="currentTab === 'problem'"
          class="admin-view__section"
        >
          <form
            class="admin-view__form"
            @submit.prevent="handleAddProblem"
            novalidate
          >
            <div class="admin-view__select-wrapper">
              <select
                class="admin-view__select"
                v-model="newProblemGenreId"
                required
              >
                <option value="" disabled>（ジャンルを選択）</option>
                <option
                  v-for="genre in adminStore.genres"
                  :key="genre.id"
                  :value="genre.id"
                >
                  {{ genre.name }}
                </option>
              </select>
            </div>
            <input
              type="text"
              class="admin-view__input"
              placeholder="新しい問題文"
              v-model="newProblemText"
              required
            />
            <input
              type="text"
              class="admin-view__input"
              placeholder="ひらがな"
              v-model="newProblemHiragana"
              required
            />
            <button type="submit" class="admin-view__input-button">
              <PlusIcon class="admin-view__input-button-icon" />追加
            </button>
          </form>

          <form
            class="admin-view__form"
            @submit.prevent="handleSearch"
            novalidate
          >
            <div class="admin-view__select-wrapper">
              <select class="admin-view__select" v-model="localFilterGenreId">
                <option value="">（全てのジャンル）</option>
                <option
                  v-for="genre in adminStore.genres"
                  :key="genre.id"
                  :value="genre.id"
                >
                  {{ genre.name }}
                </option>
              </select>
            </div>
            <input
              type="text"
              class="admin-view__input"
              placeholder="（問題文）と（ひらがな）で検索"
              v-model="localFilterSearchText"
            />
            <button type="submit" class="admin-view__input-button">
              <SearchIcon class="admin-view__input-button-icon" />検索
            </button>
          </form>

          <div
            class="admin-view__pagination-container"
            v-if="adminStore.totalPages > 1"
          >
            <div class="admin-view__pagination">
              <button
                class="admin-view__page-button admin-view__page-button--prev"
                :class="{ 'is-disabled': adminStore.currentPage === 1 }"
                @click="handleSetPage(adminStore.currentPage - 1)"
                :disabled="adminStore.currentPage === 1"
              ></button>

              <template v-for="(item, index) in paginationItems">
                <button
                  v-if="item !== '...'"
                  :key="`num-${index}`"
                  class="admin-view__page-button admin-view__page-button--number"
                  :class="{
                    'is-active': item === adminStore.currentPage,
                  }"
                  @click="handleSetPage(item)"
                >
                  {{ item }}
                </button>

                <span
                  v-else
                  :key="`dots-${index}`"
                  class="admin-view__page-dots"
                >
                  …
                </span>
              </template>

              <button
                class="admin-view__page-button admin-view__page-button--next"
                :class="{
                  'is-disabled':
                    adminStore.currentPage === adminStore.totalPages,
                }"
                @click="handleSetPage(adminStore.currentPage + 1)"
                :disabled="adminStore.currentPage === adminStore.totalPages"
              ></button>
            </div>
          </div>

          <div class="admin-view__table-wrapper">
            <div v-if="isTableLoading" class="admin-view__loading-overlay">
              <Loading />
            </div>
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
                      <TotalTypeCountIcon
                        class="admin-view__table-button-icon admin-view__table-button-icon--keyboard"
                      />
                    </button>
                    <button
                      class="admin-view__problem-table-button admin-view__problem-table-button--edit"
                      @click="openEditModal(problem, 'problem')"
                    >
                      <EditIcon
                        class="admin-view__table-button-icon admin-view__table-button-icon--edit"
                      />
                    </button>
                    <button
                      class="admin-view__problem-table-button admin-view__problem-table-button--delete"
                      @click="
                        handleDeleteProblem(problem.id, problem.problem_text)
                      "
                    >
                      <DeleteIcon
                        class="admin-view__table-button-icon admin-view__table-button-icon--delete"
                      />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="admin-view__pagination-container"
            v-if="adminStore.totalPages > 1"
          >
            <div class="admin-view__pagination">
              <button
                class="admin-view__page-button admin-view__page-button--prev"
                :class="{ 'is-disabled': adminStore.currentPage === 1 }"
                @click="handleSetPage(adminStore.currentPage - 1)"
                :disabled="adminStore.currentPage === 1"
              ></button>

              <template v-for="(item, index) in paginationItems">
                <button
                  v-if="item !== '...'"
                  :key="`num-${index}`"
                  class="admin-view__page-button admin-view__page-button--number"
                  :class="{
                    'is-active': item === adminStore.currentPage,
                  }"
                  @click="handleSetPage(item)"
                >
                  {{ item }}
                </button>

                <span
                  v-else
                  :key="`dots-${index}`"
                  class="admin-view__page-dots"
                >
                  …
                </span>
              </template>

              <button
                class="admin-view__page-button admin-view__page-button--next"
                :class="{
                  'is-disabled':
                    adminStore.currentPage === adminStore.totalPages,
                }"
                @click="handleSetPage(adminStore.currentPage + 1)"
                :disabled="adminStore.currentPage === adminStore.totalPages"
              ></button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <Transition name="modal-fade">
      <div
        v-if="isTryModalOpen"
        class="admin-view__modal-overlay"
        @click.self="closeTryModal"
      >
        <div
          class="admin-view__modal-content admin-view__modal-content--typing-test"
        >
          <button @click="closeTryModal" class="admin-view__modal-close">
            <PlusIcon class="admin-view__modal-close-icon" />
          </button>
          <p class="admin-view__modal-title">試し打ち</p>
          <div class="admin-view__sound-settings">
            <label class="admin-view__sound-label">
              <input
                type="checkbox"
                class="admin-view__sound-checkbox"
                v-model="settingsStore.soundEnabled"
                @change="settingsStore.saveSettings"
              />
              タイプ音
            </label>
            <label class="admin-view__sound-label">
              <input
                type="checkbox"
                class="admin-view__sound-checkbox"
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
          <button @click="closeEditModal" class="admin-view__modal-close">
            <PlusIcon class="admin-view__modal-close-icon" />
          </button>
          <p v-if="editType === 'genre'" class="admin-view__modal-title">
            ジャンルの編集
          </p>
          <p v-else class="admin-view__modal-title">問題文の編集</p>

          <form
            class="admin-view__modal-form"
            @submit.prevent="handleUpdateItem"
            novalidate
          >
            <div v-if="editType === 'genre'" class="admin-view__form-group">
              <label class="admin-view__form-label" for="edit-genre-name"
                >ジャンル名</label
              >
              <input
                class="admin-view__form-input"
                id="edit-genre-name"
                type="text"
                v-model="editForm.name"
                required
              />
            </div>

            <template v-else>
              <div class="admin-view__form-group">
                <label class="admin-view__form-label" for="edit-problem-genre"
                  >ジャンル</label
                >
                <div class="admin-view__form-select-wrapper">
                  <select
                    class="admin-view__form-select"
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
              </div>
              <div class="admin-view__form-group">
                <label class="admin-view__form-label" for="edit-problem-text"
                  >問題文</label
                >
                <input
                  class="admin-view__form-input"
                  id="edit-problem-text"
                  type="text"
                  v-model="editForm.problem_text"
                  required
                />
              </div>
              <div class="admin-view__form-group">
                <label
                  class="admin-view__form-label"
                  for="edit-problem-hiragana"
                  >ひらがな</label
                >
                <input
                  class="admin-view__form-input"
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
                class="admin-view__modal-button admin-view__modal-button--cancel"
                @click="closeEditModal"
              >
                キャンセル
              </button>
              <button
                type="submit"
                class="admin-view__modal-button admin-view__modal-button--confirm"
              >
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
import { ref, onMounted, onUnmounted, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useAdminStore } from "../stores/adminStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";
import TypingCore from "../components/TypingCore.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import romaMapData from "@/data/romanTypingParseDictionary.json";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import PlusIcon from "@/components/icons/PlusIcon.vue";
import DeleteIcon from "@/components/icons/DeleteIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import Loading from "@/components/Loading.vue";

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
 * 設定store
 */
const settingsStore = useSettingsStore();

/**
 * router
 */
const router = useRouter();

/**
 * 表のローディング管理用
 */
const isTableLoading = ref(false);

/**
 * ローディングの最低表示時間 (ミリ秒)
 */
const MIN_LOADING_MS = 300;

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
 * タブ切り替え
 */
const currentTab = ref("genre");

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
 * ページネーションアイテム
 */
const paginationItems = computed(() => {
  const current = adminStore.currentPage;
  const total = adminStore.totalPages;

  // 必ず表示したいページ番号
  // (1ページ目、最後のページ、現在のページ、現在の前後のページ)
  const pages = new Set([1, total, current, current - 1, current + 1]);

  // 範囲外のページ（0以下や最大ページ超え）を除外、昇順に並べ替える
  const sortedPages = Array.from(pages)
    .filter((page) => page > 0 && page <= total)
    .sort((a, b) => a - b);

  const result = [];

  for (let i = 0; i < sortedPages.length; i++) {
    const page = sortedPages[i];

    if (i > 0) {
      const prevPage = sortedPages[i - 1];
      if (page - prevPage > 1) {
        if (page - prevPage === 2) {
          result.push(prevPage + 1); // 間の数字が1個だけなら数字を表示
        } else {
          result.push("..."); // 間の数字がいっぱいあるなら「...」を表示
        }
      }
    }

    result.push(page);
  }

  return result;
});

/**
 * マウント時処理
 */
onMounted(async () => {
  // ユーザー情報がない場合
  if (!authStore.user) {
    // ユーザー情報を取得
    await authStore.fetchUser();
  }

  // 管理権限がある場合
  if (authStore.isAdmin) {
    try {
      // ジャンルを取得
      await fetchGenresWithLoading();
    } catch (error) {
      notificationStore.addNotification(
        error.response?.data?.message || "ジャンルの取得に失敗しました。",
        "error"
      );
    }

    try {
      // 問題文（1ページ目）を取得
      await fetchProblemsWithLoading();
    } catch (error) {
      notificationStore.addNotification(
        error.response?.data?.message || "問題文の取得に失敗しました。",
        "error"
      );
    }
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  // 検索条件を初期化しておく
  adminStore.filterGenreId = "";
  adminStore.filterSearchText = "";
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
 * ジャンル一覧を取得する関数（初期表示で呼ぶ用）
 */
const fetchGenresWithLoading = async () => {
  // ローディング開始
  isTableLoading.value = true;

  try {
    // ジャンル一覧を取得、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.fetchGenres(),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    // エラー処理は呼び出し元へ
    throw error;
  } finally {
    // ローディング終了
    isTableLoading.value = false;
  }
};

/**
 * 問題一覧を取得する関数（初期表示とページネーションで呼ぶ用）
 */
const fetchProblemsWithLoading = async () => {
  // ローディング開始
  isTableLoading.value = true;

  try {
    // 問題一覧を取得、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.fetchProblems(),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    // エラー処理は呼び出し元へ
    throw error;
  } finally {
    // ローディング終了
    isTableLoading.value = false;
  }
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

  // ローディング表示
  isTableLoading.value = true;

  try {
    // ジャンル登録、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.addGenre(newGenreName.value),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

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
  } finally {
    // ローディング終了
    isTableLoading.value = false;
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

  // ローディング開始
  isTableLoading.value = true;

  try {
    // 問題文登録、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.addProblem(
        newProblemGenreId.value,
        newProblemText.value,
        newProblemHiragana.value
      ),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

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
  } finally {
    // ローディング終了
    isTableLoading.value = false;
  }
};

/**
 * 「検索」ボタンが押された時の処理
 */
const handleSearch = async () => {
  // ローディング開始
  isTableLoading.value = true;

  try {
    // 入力されてる検索条件をセットする
    adminStore.filterGenreId = localFilterGenreId.value;
    adminStore.filterSearchText = localFilterSearchText.value;

    // 検索実行、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.applyFilters(),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "検索に失敗しました。",
      "error"
    );
  } finally {
    // ローディング終了
    isTableLoading.value = false;
  }
};

/**
 * 「ページネーション」ボタンが押された時の処理
 * @param {Number} newPage 表示するページ番号
 */
const handleSetPage = async (newPage) => {
  // ローディング表示
  isTableLoading.value = true;

  try {
    // newPageのページを表示する、最低限の待ち時間を入れる（ローディング表示用）
    await Promise.all([
      adminStore.setPage(newPage),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    // エラー通知
    notificationStore.addNotification(
      error.response?.data?.message || "ページの取得に失敗しました。",
      "error"
    );
  } finally {
    // ローディング終了
    isTableLoading.value = false;
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
    // ローディング表示
    isTableLoading.value = true;

    try {
      // 処理実行、最低限の待ち時間を入れる（ローディング表示用）
      await Promise.all([
        onConfirmAction.value(),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);

      // 成功通知
      notificationStore.addNotification("削除しました。", "success");
    } catch (error) {
      // エラー通知
      notificationStore.addNotification(
        error.response?.data?.message || "削除に失敗しました。",
        "error"
      );
    } finally {
      // ローディング終了
      isTableLoading.value = false;
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
  // ローディング表示
  isTableLoading.value = true;

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

      // ジャンル更新、最低限の待ち時間を入れる（ローディング表示用）
      await Promise.all([
        adminStore.updateGenre(editForm.id, editForm.name),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
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

      // 問題文更新、最低限の待ち時間を入れる（ローディング表示用）
      await Promise.all([
        adminStore.updateProblem(
          editForm.id,
          editForm.genre_id,
          editForm.problem_text,
          editForm.problem_hiragana
        ),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
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
  } finally {
    // ローディング終了
    isTableLoading.value = false;
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
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
  }

  &__tab-control {
    display: flex;
    @include fluid-style(gap, 16, 24);
    border-bottom: 1px solid $light-black;
  }

  &__tab-button {
    position: relative;
    padding: 1em;
    font-weight: $bold;
    @include fluid-text(14, 16);
    opacity: 0.6;
    transition: opacity $transition-base;
    cursor: pointer;

    &::before {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 4px;
      border-radius: $radius-lg;
      background-color: $green;
      transform: scaleX(0);
      transform-origin: right;
      transition: transform $transition-base;
    }

    @include hover {
      opacity: 1;
      &::before {
        transform: scaleX(1);
        transform-origin: left;
      }
    }

    &.selected {
      opacity: 1;
      &::before {
        transform: scaleX(1);
        transform-origin: left;
      }
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 8, 16);
  }

  &__subtitle {
    font-weight: $bold;
    @include fluid-text(14, 16);
  }

  &__table-wrapper {
    position: relative;
    overflow-x: auto;
  }

  &__loading-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba($white, 0.7);
  }

  &__genre-table {
    width: 100%;
    min-width: 1100px;
  }

  &__genre-table-tr {
    &:nth-of-type(odd) {
      background-color: $gray;
    }
  }

  &__genre-table-th {
    padding: 1em;
    font-size: 1.4rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
    color: $white;
    background-color: $green;

    &--id {
      width: 15%;
      text-align: right;
    }

    &--genre {
      width: 40%;
      text-align: left;
    }

    &--count {
      width: 15%;
      text-align: right;
    }

    &--action {
      width: 30%;
      text-align: center;
    }
  }

  &__genre-table-td {
    padding: 1em;
    font-size: 1.4rem;
    line-height: 1;

    &--id {
      text-align: right;
    }

    &--genre {
      text-align: left;
    }

    &--count {
      text-align: right;
    }

    &--action {
      display: flex;
      justify-content: center;
      gap: 1.6rem;
    }
  }

  &__genre-table-button {
    @include fluid-text(11, 13);
    padding: 1em;

    &--edit {
      @include button-style-fill($green, $hover-action: "none");
    }

    &--delete {
      @include button-style-fill($red, $hover-action: "none");
    }
  }

  &__table-button-icon {
    width: 1.4em;

    &--edit {
      fill: currentColor;
    }

    &--delete {
      fill: none;
      stroke: currentColor;
    }

    &--keyboard {
      fill: currentColor;
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 8, 16);

    @include pc {
      flex-direction: row;
    }
  }

  &__input {
    @include input-style;

    @include pc {
      flex-grow: 1;
    }
  }

  &__select-wrapper {
    @include select-wrapper-style;
  }

  &__select {
    @include select-style;
  }

  &__input-button {
    @include button-style-fill($black, $hover-action: "none");
    width: 15rem;
    margin-inline: auto;
    padding-block: 1em;
    @include fluid-text(14, 16);
    cursor: pointer;

    @include pc {
      margin-inline: 0;
    }
  }

  &__input-button-icon {
    @include button-icon-style;
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
      line-height: 1.5;
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
      @include button-style-fill($blue, $hover-action: "none");
    }

    &--edit {
      @include button-style-fill($green, $hover-action: "none");
    }

    &--delete {
      @include button-style-fill($red, $hover-action: "none");
    }
  }

  @include pagination-style;

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
    width: 100%;
    max-width: 500px;
    margin-inline: 2rem;
    @include fluid-style(padding, 16, 24);
    border-radius: $radius-md;
    background-color: $white;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);

    &--typing-test {
      width: 900px;
      max-width: none;
    }
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

  &__modal-form {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 16, 24);
  }

  &__form-group {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 4, 8);
  }

  &__form-label {
    font-weight: $bold;
    @include fluid-text(12, 14);
  }

  &__form-select-wrapper {
    @include select-wrapper-style;
  }

  &__form-select {
    @include select-style;
  }

  &__form-input {
    @include input-style;
  }

  &__modal-actions {
    display: flex;
    justify-content: space-around;
    gap: 2.4rem;
  }

  &__modal-button {
    flex-grow: 1;
    padding: 1em;
    font-weight: $bold;
    @include fluid-text(12, 14);
    border-radius: $radius-sm;
    cursor: pointer;

    &--cancel {
      @include button-style-border($black);
    }

    &--confirm {
      @include button-style-fill($green);
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  .admin-view__modal-content {
    transition: transform $transition-base;
  }
}
</style>