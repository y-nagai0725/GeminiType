<template>
  <div class="admin-view">
    <h1 class="admin-view__title">
      <span class="en" aria-hidden="true">ADMIN</span>
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
        <template v-else-if="authStore.isGuestAdmin">
          <p class="admin-view__welcome-message">
            あなたは「ゲスト管理者」です。<br />
            ※ポートフォリオ閲覧用のため、データの追加・更新・削除はできません。
          </p>
        </template>
        <template v-else>
          <p class="admin-view__welcome-message">
            あなたは「管理者」ではありませんので、<br />このページでの管理操作が許可されていません。
          </p>
          <RouterLink to="/menu" class="admin-view__welcome-link">
            メインメニューへ
            <ArrowIcon class="admin-view__arrow-icon" aria-hidden="true" />
          </RouterLink>
        </template>
      </div>

      <template v-if="authStore.canAccessAdmin">
        <Loading
          v-if="isContentsLoading"
          class="admin-view__loading"
          :text="'データ読み込み中です…'"
        />

        <div v-else-if="errorMessage" class="admin-view__error" role="alert">
          <p class="admin-view__error-message">{{ errorMessage }}</p>
        </div>

        <div v-else class="admin-view__content">
          <div class="admin-view__tab-control">
            <button
              type="button"
              class="admin-view__tab-button admin-view__tab-button--problem"
              :class="{ 'is-active': currentTab === 'problem' }"
              @click="currentTab = 'problem'"
            >
              問題管理
            </button>
            <button
              type="button"
              class="admin-view__tab-button admin-view__tab-button--genre"
              :class="{ 'is-active': currentTab === 'genre' }"
              @click="currentTab = 'genre'"
            >
              ジャンル管理
            </button>
          </div>

          <section v-if="currentTab === 'problem'" class="admin-view__section">
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
                id="new-problem-text"
                class="admin-view__input"
                placeholder="新しい問題文"
                v-model="newProblemText"
                :maxlength="MAX_PROBLEM_TEXT_LENGTH"
                required
              />
              <input
                type="text"
                id="new-problem-hiragana"
                class="admin-view__input"
                placeholder="ひらがな"
                v-model="newProblemHiragana"
                :maxlength="MAX_PROBLEM_HIRAGANA_LENGTH"
                required
              />
              <button type="submit" class="admin-view__input-button">
                <PlusIcon
                  class="admin-view__input-button-icon"
                  aria-hidden="true"
                />追加
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
                id="search-text"
                class="admin-view__input"
                placeholder="（問題文）と（ひらがな）を対象に検索"
                v-model="localFilterSearchText"
              />
              <button type="submit" class="admin-view__input-button">
                <SearchIcon
                  class="admin-view__input-button-icon"
                  aria-hidden="true"
                />検索
              </button>
            </form>

            <Pagination
              :current-page="adminStore.currentPage"
              :total-pages="adminStore.totalPages"
              @page-change="handleSetPage"
            />

            <div class="admin-view__table-container">
              <ScrollHint :show="!isProblemsTableHidden" />

              <div v-if="isTableLoading" class="admin-view__loading-overlay">
                <Loading />
              </div>

              <Simplebar
                class="admin-view__table-wrapper"
                ref="problemsScrollRef"
                @scroll="handleProblemsScroll"
                :auto-hide="false"
              >
                <table class="admin-view__problem-table">
                  <thead>
                    <tr>
                      <th class="col-genre">ジャンル</th>
                      <th class="col-problem">問題文</th>
                      <th class="col-hiragana">ひらがな</th>
                      <th class="col-action">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-if="!isTableLoading && adminStore.problems.length === 0"
                    >
                      <td colspan="4" class="admin-view__empty-message">
                        登録されている問題がありません。
                      </td>
                    </tr>
                    <tr
                      v-for="problem in adminStore.problems"
                      :key="problem.id"
                    >
                      <td class="col-genre">{{ problem.genre.name }}</td>
                      <td class="col-problem">{{ problem.problem_text }}</td>
                      <td class="col-hiragana">
                        {{ problem.problem_hiragana }}
                      </td>
                      <td class="col-action">
                        <button
                          type="button"
                          class="admin-view__problem-table-button admin-view__problem-table-button--try"
                          @click="handleTryClick(problem)"
                          aria-label="この問題を試し打ちする"
                        >
                          <TotalTypeCountIcon
                            class="admin-view__table-button-icon admin-view__table-button-icon--keyboard"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          class="admin-view__problem-table-button admin-view__problem-table-button--edit"
                          @click="openEditModal(problem, 'problem')"
                          aria-label="この問題を編集する"
                        >
                          <EditIcon
                            class="admin-view__table-button-icon admin-view__table-button-icon--edit"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          class="admin-view__problem-table-button admin-view__problem-table-button--delete"
                          @click="
                            handleDeleteProblem(
                              problem.id,
                              problem.problem_text
                            )
                          "
                          aria-label="この問題を削除する"
                        >
                          <DeleteIcon
                            class="admin-view__table-button-icon admin-view__table-button-icon--delete"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Simplebar>
            </div>

            <Pagination
              :current-page="adminStore.currentPage"
              :total-pages="adminStore.totalPages"
              @page-change="handleSetPage"
            />
          </section>

          <section
            v-else-if="currentTab === 'genre'"
            class="admin-view__section"
          >
            <form
              class="admin-view__form"
              @submit.prevent="handleAddGenre"
              novalidate
            >
              <input
                type="text"
                id="new-genre-name"
                class="admin-view__input"
                placeholder="追加するジャンル名を入力…"
                v-model="newGenreName"
                :maxlength="MAX_GENRE_NAME_LENGTH"
                required
              />
              <button type="submit" class="admin-view__input-button">
                <PlusIcon
                  class="admin-view__input-button-icon"
                  aria-hidden="true"
                />追加
              </button>
            </form>

            <div class="admin-view__table-container">
              <ScrollHint :show="!isGenresTableHidden" />

              <div v-if="isTableLoading" class="admin-view__loading-overlay">
                <Loading />
              </div>

              <Simplebar
                class="admin-view__table-wrapper"
                ref="genresScrollRef"
                @scroll="handleGenresScroll"
                :auto-hide="false"
              >
                <table class="admin-view__genre-table">
                  <thead>
                    <tr>
                      <th class="col-id">ID</th>
                      <th class="col-genre">ジャンル名</th>
                      <th class="col-count">登録問題数</th>
                      <th class="col-action">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-if="!isTableLoading && adminStore.genres.length === 0"
                    >
                      <td colspan="4" class="admin-view__empty-message">
                        登録されているジャンルがありません。
                      </td>
                    </tr>
                    <tr v-for="genre in adminStore.genres" :key="genre.id">
                      <td class="col-id">{{ genre.id }}</td>
                      <td class="col-genre">{{ genre.name }}</td>
                      <td class="col-count">{{ genre._count.problems }}</td>
                      <td class="col-action">
                        <button
                          type="button"
                          class="admin-view__genre-table-button admin-view__genre-table-button--edit"
                          @click="openEditModal(genre, 'genre')"
                          aria-label="このジャンルを編集する"
                        >
                          <EditIcon
                            class="admin-view__table-button-icon admin-view__table-button-icon--edit"
                            aria-hidden="true"
                          />
                        </button>
                        <button
                          type="button"
                          class="admin-view__genre-table-button admin-view__genre-table-button--delete"
                          @click="handleDeleteGenre(genre.id, genre.name)"
                          aria-label="このジャンルを削除する"
                        >
                          <DeleteIcon
                            class="admin-view__table-button-icon admin-view__table-button-icon--delete"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Simplebar>
            </div>
          </section>
        </div>
      </template>
    </div>

    <TryTypingModal
      :show="isTryModalOpen"
      :problem="problemToTry"
      :show-debug="true"
      @close="closeTryModal"
    />

    <ConfirmModal
      :show="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="handleConfirmDelete"
      @cancel="closeConfirmModal"
    />

    <DeviceWarningModal
      :show="showWarningModal"
      @cancel="showWarningModal = false"
      @play="handleProceedToPlay"
    />

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isEditModalOpen"
          class="admin-view__modal-overlay"
          @click.self="closeEditModal"
        >
          <div class="admin-view__modal-content" @click.stop>
            <button
              type="button"
              @click="closeEditModal"
              class="admin-view__modal-close"
              aria-label="閉じる"
            >
              <PlusIcon
                class="admin-view__modal-close-icon"
                aria-hidden="true"
              />
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
                  :maxlength="MAX_GENRE_NAME_LENGTH"
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
                    :maxlength="MAX_PROBLEM_TEXT_LENGTH"
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
                    :maxlength="MAX_PROBLEM_HIRAGANA_LENGTH"
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
    </Teleport>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import romajiMapData from "@/data/romajiDictionary.json";

// --- Stores ---
import { useAuthStore } from "../stores/authStore";
import { useAdminStore } from "../stores/adminStore";
import { useNotificationStore } from "../stores/notificationStore";

// --- Composables ---
import { useScrollHint } from "../composables/useScrollHint";
import { useDeviceEnvironment } from "../composables/useDeviceEnvironment";

// --- Components ---
import Pagination from "@/components/Pagination.vue";
import TryTypingModal from "@/components/TryTypingModal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import DeviceWarningModal from "@/components/DeviceWarningModal.vue";
import Simplebar from "simplebar-vue";
import ScrollHint from "@/components/ScrollHint.vue";
import Loading from "@/components/Loading.vue";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import PlusIcon from "@/components/icons/PlusIcon.vue";
import DeleteIcon from "@/components/icons/DeleteIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ローディングの最低表示時間 (ミリ秒)
 * @type {number}
 */
const MIN_LOADING_MS = Number(import.meta.env.VITE_MIN_LOADING_MS) || 300;

/**
 * ジャンル名の最大文字数
 * @type {number}
 */
const MAX_GENRE_NAME_LENGTH = 15;

/**
 * 問題の最大文字数
 * @type {number}
 */
const MAX_PROBLEM_TEXT_LENGTH = 25;

/**
 * （問題の）ひらがなの最大文字数
 * @type {number}
 */
const MAX_PROBLEM_HIRAGANA_LENGTH = 50;

// =========================================================================
// State (状態管理)
// =========================================================================

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
 * routerインスタンス
 * @type {import('vue-router').Router}
 */
const router = useRouter();

/**
 * 問題登録のひらがなで許可する文字
 * @type {Set<string>}
 */
const allowedChars = new Set(romajiMapData.map((item) => item.Pattern));

/**
 * ページ全体のローディング状態
 * @type {import('vue').Ref<boolean>}
 */
const isContentsLoading = ref(false);

/**
 * 表のローディング管理用
 * @type {import('vue').Ref<boolean>}
 */
const isTableLoading = ref(false);

/**
 * エラーメッセージ
 * @type {import('vue').Ref<string>}
 */
const errorMessage = ref("");

/**
 * (登録用)新しいジャンル名
 * @type {import('vue').Ref<string>}
 */
const newGenreName = ref("");

/**
 * (登録用)新しい問題のジャンルid
 * @type {import('vue').Ref<string|number>}
 */
const newProblemGenreId = ref("");

/**
 * (登録用)新しい問題文
 * @type {import('vue').Ref<string>}
 */
const newProblemText = ref("");

/**
 * (登録用)新しい問題文のひらがな
 * @type {import('vue').Ref<string>}
 */
const newProblemHiragana = ref("");

/**
 * 検索用設定: ジャンルid
 * @type {import('vue').Ref<string|number>}
 */
const localFilterGenreId = ref("");

/**
 * 検索用設定: 検索キーワード
 * @type {import('vue').Ref<string>}
 */
const localFilterSearchText = ref("");

/**
 * 試し打ちモーダルの表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isTryModalOpen = ref(false);

/**
 * 試し打ちの問題
 * @type {import('vue').Ref<Object|null>}
 */
const problemToTry = ref(null);

/**
 * 警告モーダルの表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const showWarningModal = ref(false);

/**
 * 警告が出た際に、一時的に「どの問題を試し打ちしようとしたか」を保存する
 * @type {import('vue').Ref<Object|null>}
 */
const pendingProblem = ref(null);

/**
 * 確認モーダルの表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isConfirmOpen = ref(false);

/**
 * 確認モーダルのタイトル
 * @type {import('vue').Ref<string>}
 */
const confirmTitle = ref("");

/**
 * 確認モーダルのメッセージ
 * @type {import('vue').Ref<string>}
 */
const confirmMessage = ref("");

/**
 * 確認了承時の処理
 * @type {import('vue').Ref<Function|null>}
 */
const onConfirmAction = ref(null);

/**
 * 編集モーダルの表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isEditModalOpen = ref(false);

/**
 * 編集の種類('genre' or 'problem')
 * @type {import('vue').Ref<string>}
 */
const editType = ref("problem");

/**
 * タブ切り替え
 * @type {import('vue').Ref<string>}
 */
const currentTab = ref("problem");

/**
 * 編集フォーム
 * @type {{ id: number|null, name: string, genre_id: string|number, problem_text: string, problem_hiragana: string }}
 */
const editForm = reactive({
  id: null,
  name: "",
  genre_id: "",
  problem_text: "",
  problem_hiragana: "",
});

// =========================================================================
// Composables 呼び出し
// =========================================================================

/**
 * ジャンルテーブル用横スクロールヒント管理
 */
const {
  isHidden: isGenresTableHidden,
  scrollRef: genresScrollRef,
  handleScroll: handleGenresScroll,
  resetScroll: resetGenresScroll,
} = useScrollHint();

/**
 * 問題テーブル用横スクロールヒント管理
 */
const {
  isHidden: isProblemsTableHidden,
  scrollRef: problemsScrollRef,
  handleScroll: handleProblemsScroll,
  resetScroll: resetProblemsScroll,
} = useScrollHint();

/**
 * デバイス環境チェック
 */
const { checkNeedsWarning } = useDeviceEnvironment();

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * ゲスト権限の操作制限チェック
 * @returns {boolean} ゲストで操作が制限された場合は true、それ以外は false
 */
const isGuestRestricted = () => {
  // ゲスト管理者ならエラー通知を出して、その後の処理をストップさせる
  if (authStore.isGuestAdmin) {
    notificationStore.addNotification(
      "ゲスト権限ではこの操作は許可されていません。",
      "error"
    );
    return true;
  }
  return false;
};

/**
 * 入力されたひらがなの辞書チェック
 * @param {string} text チェック対象の文字列
 * @returns {boolean} OKならtrue
 */
const isValidReading = (text) => {
  // 1文字ずつチェックして、タイピング辞書にない文字が含まれていれば false を返す
  for (const char of text) {
    if (!allowedChars.has(char)) return false;
  }
  return true;
};

/**
 * 「ジャンル追加」処理
 * @returns {Promise<void>}
 */
const handleAddGenre = async () => {
  // ゲスト権限では実行させない
  if (isGuestRestricted()) return;

  // ジャンル名の空チェック
  if (!newGenreName.value || newGenreName.value.trim() === "") {
    notificationStore.addNotification("ジャンル名を入力して下さい。", "error");
    return;
  }

  // ジャンル名の文字数チェック
  if (newGenreName.value.length > MAX_GENRE_NAME_LENGTH) {
    notificationStore.addNotification(
      `ジャンル名は${MAX_GENRE_NAME_LENGTH}文字以内にして下さい。`,
      "error"
    );
    return;
  }

  // テーブルをローディング状態にする
  isTableLoading.value = true;
  try {
    // ジャンル登録API (UXのために最低限のローディング時間を見せる)
    await Promise.all([
      adminStore.addGenre(newGenreName.value),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

    // 追加されたら、テーブルのスクロール位置とヒントをリセット
    resetGenresScroll();

    // 成功通知を出して、入力フォームを空に戻す
    notificationStore.addNotification("ジャンルを追加しました。", "success");
    newGenreName.value = "";
  } catch (error) {
    // エラー時の通知
    notificationStore.addNotification(
      error.response?.data?.message || "ジャンルの追加に失敗しました。",
      "error"
    );
  } finally {
    // 処理が終わったらローディングを解除
    isTableLoading.value = false;
  }
};

/**
 * 「問題文追加」処理
 * @returns {Promise<void>}
 */
const handleAddProblem = async () => {
  // ゲスト権限では実行させない
  if (isGuestRestricted()) return;

  // 未入力項目のバリデーション
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

  // 問題文の文字数チェック
  if (newProblemText.value.length > MAX_PROBLEM_TEXT_LENGTH) {
    notificationStore.addNotification(
      `問題文は${MAX_PROBLEM_TEXT_LENGTH}文字以内にして下さい。`,
      "error"
    );
    return;
  }

  // ひらがなの文字数チェック
  if (newProblemHiragana.value.length > MAX_PROBLEM_HIRAGANA_LENGTH) {
    notificationStore.addNotification(
      `ひらがなは${MAX_PROBLEM_HIRAGANA_LENGTH}文字以内にして下さい。`,
      "error"
    );
    return;
  }

  // ひらがなにタイピング不可能な文字（漢字や未対応記号）が含まれていないかチェック
  if (!isValidReading(newProblemHiragana.value)) {
    notificationStore.addNotification(
      "ひらがなにタイピング判定の対象外となる文字が検出されました。有効なひらがな・記号・半角英数字のみを入力してください。",
      "error"
    );
    return;
  }

  // テーブルをローディング状態にする
  isTableLoading.value = true;
  try {
    // 問題文登録API
    await Promise.all([
      adminStore.addProblem(
        newProblemGenreId.value,
        newProblemText.value,
        newProblemHiragana.value
      ),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

    // スクロール位置のリセット
    resetProblemsScroll();

    // 成功通知を出して、入力フォームを空に戻す
    notificationStore.addNotification("問題文を追加しました。", "success");
    newProblemText.value = "";
    newProblemHiragana.value = "";
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "問題文の追加に失敗しました。",
      "error"
    );
  } finally {
    isTableLoading.value = false;
  }
};

/**
 * 「検索」処理
 * @returns {Promise<void>}
 */
const handleSearch = async () => {
  isTableLoading.value = true;
  try {
    // 入力されている検索条件（ジャンルとテキスト）をStoreにセットする
    adminStore.filterGenreId = localFilterGenreId.value;
    adminStore.filterSearchText = localFilterSearchText.value;

    // 検索処理を実行し、結果を取得する
    await Promise.all([
      adminStore.applyFilters(),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

    // 検索結果が表示されたら、スクロールをリセットする
    resetProblemsScroll();
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "検索に失敗しました。",
      "error"
    );
  } finally {
    isTableLoading.value = false;
  }
};

/**
 * 「ページネーション」処理
 * @param {number} newPage 指定されたページ番号
 * @returns {Promise<void>}
 */
const handleSetPage = async (newPage) => {
  isTableLoading.value = true;
  try {
    // 指定されたページ番号のデータを取得する
    await Promise.all([
      adminStore.setPage(newPage),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);

    // ページが切り替わったらスクロールをリセットする
    resetProblemsScroll();
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "ページの取得に失敗しました。",
      "error"
    );
  } finally {
    isTableLoading.value = false;
  }
};

/**
 * 「ジャンル削除」ボタンが押された時のモーダル準備処理
 * @param {number} id ジャンルID
 * @param {string} name ジャンル名
 * @returns {void}
 */
const handleDeleteGenre = (id, name) => {
  if (isGuestRestricted()) return;

  // 確認モーダルに表示するテキストをセット
  confirmTitle.value = "ジャンルの削除";
  confirmMessage.value = `本当に「${name}」を削除しますか？\n（※問題文データが存在していると削除できません）`;

  // モーダルで「OK」が押された時に実行する処理をセット
  onConfirmAction.value = async () => {
    const isFilterReset = await adminStore.deleteGenre(id);
    resetGenresScroll();

    // 検索でフィルタリングしているジャンルの削除の場合
    if (isFilterReset) {
      // 検索ジャンルとキーワードを空にする
      localFilterGenreId.value = "";
      localFilterSearchText.value = "";

      notificationStore.addNotification(
        "※検索で絞り込んでいたジャンルを削除したため、検索条件をリセットしました。",
        "notice"
      );
    }
  };

  // 準備ができたら確認モーダルを開く
  isConfirmOpen.value = true;
};

/**
 * 「問題文削除」ボタンが押された時のモーダル準備処理
 * @param {number} id 問題ID
 * @param {string} text 問題文
 * @returns {void}
 */
const handleDeleteProblem = (id, text) => {
  if (isGuestRestricted()) return;

  // 確認モーダルに表示するテキストをセット
  confirmTitle.value = "問題文の削除";
  confirmMessage.value = `本当に「${text}」を削除しますか？`;

  // モーダルで「OK」が押された時に実行する処理をセット
  onConfirmAction.value = async () => {
    await adminStore.deleteProblem(id);
    resetProblemsScroll();
  };

  // 準備ができたら確認モーダルを開く
  isConfirmOpen.value = true;
};

/**
 * 確認モーダルで「削除する(OK)」を押した時の実行処理
 * @returns {Promise<void>}
 */
const handleConfirmDelete = async () => {
  // セットされている削除処理(onConfirmAction)があれば実行する
  if (onConfirmAction.value) {
    isTableLoading.value = true;
    try {
      await Promise.all([
        onConfirmAction.value(),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      notificationStore.addNotification("削除しました。", "success");
    } catch (error) {
      notificationStore.addNotification(
        error.response?.data?.message || "削除に失敗しました。",
        "error"
      );
    } finally {
      isTableLoading.value = false;
    }
  }
  // 処理が終わったら確認モーダルを閉じる
  closeConfirmModal();
};

/**
 * 確認モーダルを閉じる（キャンセル）処理
 * @returns {void}
 */
const closeConfirmModal = () => {
  isConfirmOpen.value = false;
  // セットしていた処理やテキストを初期化しておく
  onConfirmAction.value = null;
  confirmTitle.value = "";
  confirmMessage.value = "";
};

/**
 * 「編集」モーダルを開く処理
 * @param {Object} item 編集対象のオブジェクト
 * @param {string} type 'genre' または 'problem'
 * @returns {void}
 */
const openEditModal = (item, type) => {
  if (isGuestRestricted()) return;

  // 編集タイプ('genre' か 'problem')をセット
  editType.value = type;
  editForm.id = item.id;

  // 編集フォームに、現在登録されている元のデータをセットする
  if (type === "genre") {
    editForm.name = item.name;
  } else {
    editForm.genre_id = item.genre_id;
    editForm.problem_text = item.problem_text;
    editForm.problem_hiragana = item.problem_hiragana;
  }

  // モーダルを表示
  isEditModalOpen.value = true;
};

/**
 * 「編集」モーダルを閉じる処理
 * @returns {void}
 */
const closeEditModal = () => {
  isEditModalOpen.value = false;
  // フォームの中身をリセット
  editForm.id = null;
  editForm.name = "";
  editForm.genre_id = "";
  editForm.problem_text = "";
  editForm.problem_hiragana = "";
};

/**
 * 編集モーダルの「更新する」ボタンが押された時の処理
 * @returns {Promise<void>}
 */
const handleUpdateItem = async () => {
  isTableLoading.value = true;
  try {
    // --- ジャンル編集の場合の処理 ---
    if (editType.value === "genre") {
      // ジャンル名の空チェック
      if (!editForm.name || editForm.name.trim() === "") {
        notificationStore.addNotification(
          "ジャンル名を入力して下さい。",
          "error"
        );
        return;
      }
      // ジャンル名の文字数オーバーチェック
      if (editForm.name.length > MAX_GENRE_NAME_LENGTH) {
        notificationStore.addNotification(
          `ジャンル名は${MAX_GENRE_NAME_LENGTH}文字以内にして下さい。`,
          "error"
        );
        return;
      }

      // ジャンル更新API
      await Promise.all([
        adminStore.updateGenre(editForm.id, editForm.name),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      resetGenresScroll();

      // --- 問題文編集の場合の処理 ---
    } else {
      // ジャンルと問題文とひらがなの空チェック
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

      // 問題文の文字数チェック
      if (editForm.problem_text.length > MAX_PROBLEM_TEXT_LENGTH) {
        notificationStore.addNotification(
          `問題文は${MAX_PROBLEM_TEXT_LENGTH}文字以内にして下さい。`,
          "error"
        );
        return;
      }

      // ひらがなの文字数チェック
      if (editForm.problem_hiragana.length > MAX_PROBLEM_HIRAGANA_LENGTH) {
        notificationStore.addNotification(
          `ひらがなは${MAX_PROBLEM_HIRAGANA_LENGTH}文字以内にして下さい。`,
          "error"
        );
        return;
      }

      // ひらがなにタイピング不可能な文字（漢字や未対応記号）が含まれていないかチェック
      if (!isValidReading(editForm.problem_hiragana)) {
        notificationStore.addNotification(
          "ひらがなにタイピング判定の対象外となる文字が検出されました。有効なひらがな・記号・半角英数字のみを入力してください。",
          "error"
        );
        return;
      }

      // 問題更新API
      await Promise.all([
        adminStore.updateProblem(
          editForm.id,
          editForm.genre_id,
          editForm.problem_text,
          editForm.problem_hiragana
        ),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      resetProblemsScroll();
    }

    // 成功通知を出してモーダルを閉じる
    notificationStore.addNotification("更新しました。", "success");
    closeEditModal();
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "更新に失敗しました。",
      "error"
    );
  } finally {
    isTableLoading.value = false;
  }
};

/**
 * 試し打ちモーダルを開く処理
 * @param {Object} problem 問題オブジェクト
 * @returns {void}
 */
const openTryModal = (problem) => {
  problemToTry.value = problem;
  isTryModalOpen.value = true;
};

/**
 * 試し打ちモーダルを閉じる処理
 * @returns {void}
 */
const closeTryModal = () => {
  isTryModalOpen.value = false;
  problemToTry.value = null;
};

/**
 * 「試し打ち」ボタンが押された時の処理 (環境チェックあり)
 * @param {Object} problem 問題オブジェクト
 * @returns {void}
 */
const handleTryClick = (problem) => {
  // PC以外の環境（タッチ端末や狭い画面）なら警告モーダルを出す
  if (checkNeedsWarning()) {
    pendingProblem.value = problem;
    showWarningModal.value = true;
  } else {
    // 問題なければそのまま試し打ちを開く
    openTryModal(problem);
  }
};

/**
 * デバイス警告モーダルで「そのままプレイ」が押された時の処理
 * @returns {void}
 */
const handleProceedToPlay = () => {
  showWarningModal.value = false;
  // 保存しておいた問題を使って試し打ちを開く
  if (pendingProblem.value) {
    openTryModal(pendingProblem.value);
    pendingProblem.value = null;
  }
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(async () => {
  // ユーザー情報がない場合
  if (!authStore.user) {
    // ユーザー情報を取得
    await authStore.fetchUser();
  }

  // 権限がある場合（roleが"ADMIN" or "GUEST_ADMIN"）
  if (authStore.canAccessAdmin) {
    // ページ全体のローディング開始
    isContentsLoading.value = true;
    try {
      // ジャンルと問題の取得
      await Promise.all([
        adminStore.fetchGenres(),
        adminStore.fetchProblems(),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
    } catch (error) {
      errorMessage.value = "データの取得に失敗しました。";
      notificationStore.addNotification(
        error.response?.data?.message || "データの取得に失敗しました。",
        "error"
      );
    } finally {
      // ローディング終了
      isContentsLoading.value = false;
    }
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  // 検索条件を初期化
  adminStore.filterGenreId = "";
  adminStore.filterSearchText = "";
  adminStore.currentPage = 1;
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * 管理画面 全体レイアウト
 * ========================================================================= */
.admin-view {
  @include contents-width;

  @include pc {
    max-width: 110rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include fluid-style(gap, 24, 32);
    @include contents-padding;

    display: flex;
    flex-direction: column;
    max-width: 60rem;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  &__welcome {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__welcome-message {
    @include fluid-text(14, 20);

    font-weight: $bold;
    text-align: center;

    &--blue {
      color: $blue;
    }
  }

  &__welcome-link {
    @include button-style-fill($green);
    @include fluid-style(width, 276, 432);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__error {
    display: flex;
    flex-direction: column;
  }

  &__error-message {
    @include fluid-text(12, 16);

    font-weight: $bold;
    color: $red;
    text-align: center;
  }

  &__content {
    @include fluid-style(gap, 24, 32);

    display: flex;
    flex-direction: column;
  }

  /* =========================================================================
   * タブ切り替え
   * ========================================================================= */
  &__tab-control {
    @include fluid-style(gap, 16, 24);

    display: flex;
    border-bottom: 1px solid $light-black;
  }

  &__tab-button {
    @include fluid-text(14, 16);

    position: relative;
    padding: 1em;
    font-weight: $bold;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity $transition-base;

    &::before {
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 4px;
      content: "";
      background-color: $green;
      border-radius: $radius-lg;
      transform: scaleX(0);
      transform-origin: right;
      transition: transform $transition-base;
    }

    &.is-active {
      opacity: 1;

      &::before {
        transform: scaleX(1);
        transform-origin: left;
      }
    }

    @include hover {
      opacity: 1;

      &::before {
        transform: scaleX(1);
        transform-origin: left;
      }
    }
  }

  &__section {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
  }

  /* =========================================================================
   * フォームエリア
   * ========================================================================= */
  &__form {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;

    @include pc {
      flex-direction: row;
    }
  }

  &__input {
    @include input-style;

    @include pc {
      flex-grow: 1;
      width: auto;
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
    @include fluid-text(14, 16);
    @include fluid-style(width, 130, 150);

    padding-block: 1em;
    margin-inline: auto;
    cursor: pointer;

    @include pc {
      margin-inline: 0;
    }
  }

  &__input-button-icon {
    @include button-icon-style;
  }

  /* =========================================================================
   * テーブル共通 (Simplebar)
   * ========================================================================= */
  &__table-container {
    position: relative;
    width: 100%;
  }

  &__table-wrapper {
    padding-bottom: 1.6rem;

    &::v-deep(.simplebar-track.simplebar-horizontal) {
      @include fluid-style(height, 9, 11);

      .simplebar-scrollbar::before {
        background-color: $blue;
        opacity: 1;
      }
    }

    @include pc {
      padding-bottom: 0;
    }
  }

  &__loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    z-index: $z-loading-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $loading-overlay-color;
  }

  &__empty-message {
    @include fluid-text(14, 16);

    padding: 2rem 1rem;
    font-weight: $bold;
    color: $light-black;
    text-align: left;

    @include pc {
      text-align: center;
    }
  }

  /* --- ボタンアイコン --- */
  &__table-button-icon {
    width: 1.4em;

    &--edit {
      fill: currentcolor;
    }

    &--delete {
      fill: none;
      stroke: currentcolor;
    }

    &--keyboard {
      fill: currentcolor;
    }
  }

  /* =========================================================================
   * 【タブ1】ジャンルテーブル
   * ========================================================================= */
  &__genre-table {
    @include table-style;

    .col-id {
      width: 15%;
      text-align: left;
    }

    .col-genre {
      width: 40%;
      text-align: left;
    }

    .col-count {
      width: 15%;
      text-align: right;
    }

    .col-action {
      width: 30%;
      text-align: center;
    }

    td.col-action {
      display: flex;
      gap: 1.6rem;
      justify-content: center;
      width: 100%;
    }
  }

  &__genre-table-button {
    @include fluid-text(11, 13);

    width: 4.6rem;
    height: 4.6rem;

    &--edit {
      @include button-style-fill($green, $hover-action: "none");
    }

    &--delete {
      @include button-style-fill($red, $hover-action: "none");
    }
  }

  /* =========================================================================
   * 【タブ2】問題テーブル
   * ========================================================================= */
  &__problem-table {
    @include table-style;

    .col-genre {
      width: 20%;
      text-align: left;
    }

    .col-problem {
      width: 27.5%;
      text-align: left;
    }

    .col-hiragana {
      width: 30%;
      text-align: left;
    }

    .col-action {
      width: 22.5%;
      text-align: center;
    }

    td.col-hiragana {
      line-height: 1.5;
    }

    td.col-action {
      display: flex;
      gap: 1.6rem;
      justify-content: center;
      width: 100%;
    }
  }

  &__problem-table-button {
    @include fluid-text(11, 13);

    width: 4.6rem;
    height: 4.6rem;

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

  /* =========================================================================
   * 編集モーダル
   * ========================================================================= */
  &__modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: $z-modal-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $modal-overlay-color;
  }

  &__modal-content {
    @include fluid-style(padding, 16, 24);

    position: relative;
    width: 100%;
    max-width: 50rem;
    margin-inline: 2rem;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
  }

  &__modal-close {
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);

    position: absolute;
    color: $black;
    cursor: pointer;
    transform: rotate(45deg);
    transition: color $transition-base;

    @include hover {
      color: $red;
    }
  }

  &__modal-close-icon {
    width: 100%;
    fill: currentcolor;
  }

  &__modal-title {
    @include fluid-style(margin-bottom, 10, 16);
    @include fluid-text(16, 18);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__modal-form {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
  }

  &__form-group {
    @include fluid-style(gap, 6, 10);

    display: flex;
    flex-direction: column;
  }

  &__form-label {
    @include fluid-text(12, 14);

    font-weight: $bold;
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
    gap: 2.4rem;
    justify-content: space-around;
  }

  &__modal-button {
    @include fluid-text(12, 14);

    flex-grow: 1;
    padding: 1em;
    font-weight: $bold;
    cursor: pointer;
    border-radius: $radius-sm;

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

  /* stylelint-disable-next-line selector-class-pattern */
  .admin-view__modal-content {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  /* stylelint-disable-next-line selector-class-pattern */
  .admin-view__modal-content {
    transition: transform $transition-base;
  }
}
</style>