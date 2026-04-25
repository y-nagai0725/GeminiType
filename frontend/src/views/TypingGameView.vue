<template>
  <div class="game-view">
    <div v-if="isLoading" class="game-view__loading">
      <p class="game-view__message game-view__message--loading">
        問題を準備しています
      </p>
      <p
        v-if="loadingMessage"
        class="game-view__sub-message game-view__sub-message--loading"
      >
        {{ loadingMessage }}
      </p>
      <Loading />
      <div
        v-if="mode === 'gemini'"
        class="game-view__ai-loading-wrapper"
        ref="aiLoadingWrapperRef"
      >
        <div class="game-view__ai-loading">
          <div class="game-view__ai-icon-wrapper">
            <Transition name="icon-fade" mode="out-in">
              <img
                :key="currentAiIcon"
                :src="currentAiIcon"
                alt="AIタイピングアイコン"
                class="game-view__ai-icon"
                :class="{ 'is-typing': isAiIconTyping }"
              />
            </Transition>
          </div>

          <div class="game-view__editor">
            <div class="game-view__editor-header">
              <span
                class="game-view__editor-dot game-view__editor-dot--red"
              ></span
              ><span
                class="game-view__editor-dot game-view__editor-dot--yellow"
              ></span
              ><span
                class="game-view__editor-dot game-view__editor-dot--green"
              ></span>
            </div>
            <div class="game-view__editor-body">
              <span class="game-view__editor-prompt-symbol">> </span>
              <span
                ref="aiTypingTextRef"
                class="game-view__editor-typing-text"
              ></span>
              <span class="game-view__editor-blinking-cursor">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="errorMessage"
      class="game-view__error"
      role="alert"
      aria-live="assertive"
    >
      <p class="game-view__message game-view__message--error">
        エラーが発生しました
      </p>
      <p class="game-view__sub-message game-view__sub-message--error">
        {{ errorMessage }}
      </p>
      <div class="game-view__error-actions">
        <button
          v-if="mode === 'gemini'"
          type="button"
          @click="handleRetry"
          class="game-view__retry-button"
        >
          もう一度生成する<ArrowIcon
            class="game-view__arrow-icon"
            aria-hidden="true"
          />
        </button>

        <RouterLink to="/menu" class="game-view__back-button">
          メインメニューに戻る<ArrowIcon
            class="game-view__arrow-icon"
            aria-hidden="true"
          />
        </RouterLink>
      </div>
    </div>

    <div v-else class="game-view__core">
      <TypingCore
        :problems="problems"
        :game-mode="settingsStore.gameMode"
        :time-limit="settingsStore.timeLimit"
        :miss-limit="settingsStore.missLimit"
        :show-romaji="settingsStore.showRomaji"
        @complete="handleComplete"
      />

      <div v-if="mode === 'gemini'" class="game-view__credits">
        <p class="game-view__credit-item">
          AI問題生成 :
          <span class="game-view__credit-highlight">Powered by Gemini</span>
        </p>
        <p class="game-view__credit-item">
          ふりがな取得API :
          <a
            href="https://developer.yahoo.co.jp/sitemap/"
            target="_blank"
            rel="noopener noreferrer"
            class="game-view__credit-link"
          >
            Web Services by Yahoo! JAPAN
          </a>
        </p>
      </div>
    </div>

    <DeviceWarningModal
      :show="showWarningModal"
      cancel-text="メニューに戻る"
      @cancel="handleCancelWarning"
      @play="showWarningModal = false"
    />

    <Teleport to="body">
      <Transition name="fade-game-over">
        <div
          v-if="isGameOver"
          class="game-over-overlay"
          role="alert"
          aria-live="assertive"
        >
          <div class="game-over-content">
            <p class="game-over-text">GAME OVER</p>
            <p class="game-over-reason">{{ gameOverReason }}</p>
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
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

// --- Services & Utilities ---
import api from "../services/api";

// --- Stores ---
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

// --- Composables ---
import { useDeviceEnvironment } from "../composables/useDeviceEnvironment";

// --- Components ---
import DeviceWarningModal from "@/components/DeviceWarningModal.vue";
import TypingCore from "../components/TypingCore.vue";
import Loading from "@/components/Loading.vue";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// --- Images (AI Icons) ---
import aiTypingIcon from "@/assets/images/typing-game/ai-icon-typing.webp";
import aiReadyIcon from "@/assets/images/typing-game/ai-icon-ready.webp";

// GSAPプラグインの登録
gsap.registerPlugin(TextPlugin);

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ローディングの最低表示時間 (ミリ秒)
 * .env.local から取得し、設定されていなければ300msをデフォルトにします
 * @type {number}
 */
const MIN_LOADING_MS = Number(import.meta.env.VITE_MIN_LOADING_MS) || 300;

/**
 * AIが高速で打ち込むダミーテキストの配列
 * @type {string[]}
 */
const AI_TYPING_DUMMY_TEXTS = [
  "あなたにぴったりの問題文をGeminiが生成中...",
  "（カタカタカタ...）AIも今、必死にタイピングして問題を作っています！",
  "function generateQuestions() { return optimal; }",
  "問題文を生成中... 指の体操をしてお待ちください！",
  "Geminiがフルパワーで問題を作成中！ どんな文章が出るかお楽しみに。",
];

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * route (現在のURL情報)
 * @type {import('vue-router').RouteLocationNormalizedLoaded}
 */
const route = useRoute();

/**
 * router (ページ遷移用)
 * @type {import('vue-router').Router}
 */
const router = useRouter();

/**
 * 設定store
 */
const settingsStore = useSettingsStore();

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * ローディング中かどうか
 * @type {import('vue').Ref<boolean>}
 */
const isLoading = ref(false);

/**
 * ローディング中の詳細メッセージ
 * @type {import('vue').Ref<string>}
 */
const loadingMessage = ref("");

/**
 * エラーメッセージ
 * @type {import('vue').Ref<string>}
 */
const errorMessage = ref("");

/**
 * ゲームオーバー演出用のフラグ
 * @type {import('vue').Ref<boolean>}
 */
const isGameOver = ref(false);

/**
 * ゲームオーバーの理由テキスト
 * @type {import('vue').Ref<string>}
 */
const gameOverReason = ref("");

/**
 * 問題リストデータ
 * @type {import('vue').Ref<Array<Object>>}
 */
const problems = ref([]);

/**
 * 警告モーダルの表示フラグ
 * @type {import('vue').Ref<boolean>}
 */
const showWarningModal = ref(false);

/**
 * 現在表示するAIアイコン画像
 * @type {import('vue').Ref<string>}
 */
const currentAiIcon = ref(aiTypingIcon);

/**
 * AIアイコン画像タイピングアニメーションフラグ
 * @type {import('vue').Ref<boolean>}
 */
const isAiIconTyping = ref(true);

/**
 * GSAPコンテキスト (アンマウント時のクリーンアップ用)
 * @type {import('gsap').Context}
 */
let gsapContext;

// =========================================================================
// DOM / コンポーネント参照 (Refs)
// =========================================================================

/**
 * AIローディングアニメーションの全体ラッパー要素
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const aiLoadingWrapperRef = ref(null);

/**
 * AIがタイピングしているテキストを表示する要素
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const aiTypingTextRef = ref(null);

// =========================================================================
// Composables 呼び出し
// =========================================================================

/**
 * デバイスのプレイ環境を判定する
 */
const { checkNeedsWarning } = useDeviceEnvironment();

// =========================================================================
// Computed (計算プロパティ)
// =========================================================================

// --- URLクエリからのデータ取得 ---

/**
 * モード ('db' or 'gemini')
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const mode = computed(() => route.query.mode);

/**
 * ジャンルID (DBモード用)
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const genreId = computed(() => route.query.genreId);

/**
 * お題 (Geminiモード用)
 * @type {import('vue').ComputedRef<string|undefined>}
 */
const prompt = computed(() => route.query.prompt);

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * クエリパラメータのバリデーション
 * 不正なアクセスやパラメータ不足を防ぐ
 * @returns {boolean} 正しいアクセスなら true
 */
const validateQuery = () => {
  // モードがない、または不正な場合
  if (!mode.value || (mode.value !== "db" && mode.value !== "gemini")) {
    notificationStore.addNotification(
      "不正なアクセスです。メニューから操作してください。",
      "error"
    );
    return false;
  }

  // DBモードなのにジャンルIDがない場合
  if (mode.value === "db" && !genreId.value) {
    notificationStore.addNotification(
      "ジャンルが選択されていません。",
      "error"
    );
    return false;
  }

  // Geminiモードなのにお題がない場合
  if (mode.value === "gemini" && !prompt.value) {
    notificationStore.addNotification("お題が入力されていません。", "error");
    return false;
  }

  return true;
};

/**
 * APIから問題を取得する
 * モードに応じてDBかGeminiか自動で切り替える
 * @returns {Promise<void>}
 */
const loadProblems = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    let response;

    // --- DBモードの場合 ---
    if (mode.value === "db") {
      loadingMessage.value = "データベースから問題を抽出中...";

      // クエリパラメータの作成
      const params = new URLSearchParams();
      params.append("count", settingsStore.problemCount);
      if (genreId.value) params.append("genreId", genreId.value);

      // API取得と最低待機時間を並行処理
      [response] = await Promise.all([
        api.get(`/api/typing/db?${params.toString()}`),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
    }
    // --- Geminiモードの場合 ---
    else if (mode.value === "gemini") {
      loadingMessage.value = "AIが問題を生成中です、少々お待ちください...";

      // AIローディングアニメーション設定
      await nextTick();
      setAnimation();

      const params = new URLSearchParams();
      params.append("count", settingsStore.problemCount);
      if (prompt.value) params.append("prompt", prompt.value);

      [response] = await Promise.all([
        api.get(`/api/typing/gemini?${params.toString()}`),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
    }

    // 取得したデータを problems にセット
    problems.value = response.data;

    // 問題が0件の場合のエラーハンドリング
    if (problems.value.length === 0) {
      throw new Error("問題が見つかりませんでした。条件を変えて試して下さい。");
    }
  } catch (error) {
    // エラーハンドリング
    console.error("問題取得エラー:", error);
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "問題の読み込みに失敗しました";
  } finally {
    // GSAPアニメーション削除
    if (gsapContext) {
      gsapContext.revert();
    }

    // ローディング非表示
    isLoading.value = false;
  }
};

/**
 * タイピング終了時（子コンポーネント: TypingCoreから発火）
 * 結果を集計し、必要ならDBへ保存し、結果画面へ遷移する
 * @param {Object} data TypingCoreから渡されるデータ { results, info }
 * @returns {Promise<void>}
 */
const handleComplete = async (data) => {
  // 結果配列
  const results = data.results;
  // 特殊モード情報など
  const info = data.info;

  // --- スコアの集計計算 ---

  // 総タイプ数
  const totalTypes = results.reduce((sum, r) => {
    const count = (r.correct_key_count || 0) + (r.miss_count || 0);
    return sum + count;
  }, 0);

  // 合計ミス数
  const totalMissCount = results.reduce((sum, r) => {
    return sum + (r.miss_count || 0);
  }, 0);

  // 合計正解キー数
  const totalCorrectKeys = results.reduce((sum, r) => {
    return sum + (r.correct_key_count || 0);
  }, 0);

  // 合計問題数
  const totalProblems = results.length;

  // 平均KPM
  const avgKpm = Math.round(
    results.reduce((sum, r) => sum + r.kpm, 0) / totalProblems
  );

  // 平均正確率（合計正解キー数 ÷ 総タイプ数）
  let avgAccuracy = 0;
  if (totalTypes > 0) {
    avgAccuracy = Math.round((totalCorrectKeys / totalTypes) * 100);

    // 四捨五入後の正確率が100でも、ミスが1回でもある場合は99%にする
    if (totalMissCount > 0 && avgAccuracy === 100) {
      avgAccuracy = 99;
    }
  }

  // ミスキーの集計（最もミスしたキーを特定）
  const totalMissedKeys = {};
  results.forEach((result) => {
    const keys = result.missed_keys || {};
    for (const [key, count] of Object.entries(keys)) {
      totalMissedKeys[key] = (totalMissedKeys[key] || 0) + count;
    }
  });

  let mostMissedKey = "";
  let maxMissCount = 0;
  for (const [key, count] of Object.entries(totalMissedKeys)) {
    if (count > maxMissCount) {
      maxMissCount = count;
      mostMissedKey = key;
    }
  }

  // --- 特殊モード用の結果情報まとめ ---
  const specialModeInfo = {
    config: {
      mode: settingsStore.gameMode,
      timeLimit: settingsStore.timeLimit,
      missLimit: settingsStore.missLimit,
      problemCount: settingsStore.problemCount,
    },
    result: {
      isClear: info.isClear,
      reason: info.reason,
      solvedCount: info.solvedCount,
      remainingTime: info.remainingTime,
      remainingLives: info.remainingLives,
    },
  };

  // --- DB保存処理 ---

  // 「ログインしている」かつ「通常モード」の場合のみ保存
  const isNormalMode =
    settingsStore.gameMode === settingsStore.GAME_MODES.NORMAL;

  if (authStore.isLoggedIn && isNormalMode) {
    try {
      await api.post("/api/typing/result", {
        session_type: mode.value,
        genre_id: genreId.value ? parseInt(genreId.value, 10) : null,
        gemini_prompt: prompt.value || null,
        average_kpm: avgKpm,
        average_accuracy: avgAccuracy,
        most_missed_key: mostMissedKey,
        total_types: totalTypes,
        total_miss_count: totalMissCount,
        problem_results: results,
      });
      notificationStore.addNotification("結果を保存しました！", "success");
    } catch (error) {
      console.error("保存エラー:", error);
      // インターセプターが401エラー（セッション切れ）は処理するため、それ以外を通知
      if (!error.response || error.response.status !== 401) {
        notificationStore.addNotification("結果の保存に失敗しました。", "error");
      }
    }
  } else if (!isNormalMode) {
    notificationStore.addNotification(
      "特殊モードのため、結果は保存されません（記録のみ表示します）",
      "success",
      2500
    );
  } else {
    notificationStore.addNotification(
      "お疲れ様！ユーザー登録すると結果を保存できるよ！",
      "success"
    );
  }

  // --- ローカルストレージへの保存（結果画面表示用・リトライ用） ---

  // 次回の「もう一度やる！」のために設定を保存
  localStorage.setItem(
    "last_session_config",
    JSON.stringify({
      mode: mode.value,
      genreId: genreId.value,
      prompt: prompt.value,
    })
  );

  // 今回のスコア詳細を結果画面用に保存
  localStorage.setItem(
    "last_session_result",
    JSON.stringify({
      stats: {
        kpm: avgKpm,
        accuracy: avgAccuracy,
        total_types: totalTypes,
        total_miss_count: totalMissCount,
        most_missed_key: mostMissedKey,
      },
      results: results,
      specialModeInfo: specialModeInfo,
    })
  );

  if (
    !info.isClear &&
    settingsStore.gameMode !== settingsStore.GAME_MODES.NORMAL
  ) {
    // 特殊モードで失敗した場合、ゲームオーバー演出を見せる
    isGameOver.value = true;
    gameOverReason.value = info.reason;

    // 2.5秒(2500ms)ゲームオーバー画面を見せてから、結果画面へ遷移
    setTimeout(() => {
      router.push("/typing/result");
    }, 2500);
  } else {
    // 成功時、または通常モードの場合はすぐ遷移
    router.push("/typing/result");
  }
};

/**
 * 警告モーダルで「キャンセル」が押された時の処理
 * @returns {void}
 */
const handleCancelWarning = () => {
  // メインメニュー画面へ遷移させる
  router.push("/menu");
};

/**
 * 問題読み込みリトライ処理
 * @returns {Promise<void>}
 */
const handleRetry = async () => {
  await loadProblems();
};

/**
 * GSAPアニメーションのセットアップ処理
 * @returns {void}
 */
const setAnimation = () => {
  // GSAPアニメーションをContextで囲む（Vueのコンポーネント破棄時に一括解除するため）
  gsapContext = gsap.context(() => {
    // timeline作成、繰り返しを無限に設定
    const tl = gsap.timeline({ repeat: -1 });

    // お題テキスト
    const promptText = `テーマ：[ ${prompt.value} ] の問題を生成しています...`;

    // アニメーションさせるテキスト配列作成
    const animationTexts = [promptText, ...AI_TYPING_DUMMY_TEXTS];

    // AIアイコンをタイピング用画像に設定
    currentAiIcon.value = aiTypingIcon;
    isAiIconTyping.value = true;

    // アニメーション設定
    animationTexts.forEach((text) => {
      // テキストを高速で打ち込む
      tl.to(aiTypingTextRef.value, {
        duration: text.length * 0.04,
        text: text,
        ease: "none",
        onComplete: () => {
          // テキスト入力完了後にAIアイコンを待機用画像に変更
          currentAiIcon.value = aiReadyIcon;
          isAiIconTyping.value = false;
        },
      })
        // 打ち終わったら少し待機して読ませる
        .to({}, { duration: 1 })
        // バックスペースで高速で消す（空文字にする）
        .to(
          {},
          {
            duration: text.length * 0.02,
            ease: "none",
            onUpdate: function () {
              // 進行度に合わせて、表示する文字数を後ろから削っていく
              const currentLength = Math.ceil(
                text.length * (1 - this.progress())
              );
              aiTypingTextRef.value.textContent = text.substring(
                0,
                currentLength
              );
            },
            onComplete: () => {
              // テキスト削除完了後にAIアイコンをタイピング用画像に変更
              currentAiIcon.value = aiTypingIcon;
              isAiIconTyping.value = true;
            },
          }
        );
    });
  }, aiLoadingWrapperRef.value);
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(async () => {
  // 不正なアクセスなら処理を中断して戻す
  if (!validateQuery()) {
    router.push("/menu");
    return;
  }

  // プレイ環境チェック
  if (checkNeedsWarning()) {
    // 警告モーダルを表示
    showWarningModal.value = true;
  }

  // 問題データの取得を開始
  await loadProblems();
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  // コンポーネントが破棄される時にGSAPのアニメーションをリセットし、メモリリークを防ぐ
  if (gsapContext) {
    gsapContext.revert();
  }
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * タイピングゲーム画面スタイル
 * ========================================================================= */
.game-view {
  /* PC画面想定なのでレスポンシブ対応はしない */
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90rem;
  min-height: 50vh;
  margin: 4.8rem auto 16rem;

  /* --- ローディング・エラー画面共通 --- */
  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    align-items: center;
  }

  /* --- メッセージテキスト --- */
  &__message {
    font-size: 1.6rem;
    font-weight: $bold;

    &--error {
      color: $red;
    }
  }

  &__sub-message {
    font-size: 1.4rem;
  }

  /* --- エラーアクション要素 --- */
  &__error-actions {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    align-items: center;
  }

  &__retry-button {
    @include button-style-fill($blue);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);
  }

  &__back-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  /* --- AIローディング --- */
  &__ai-loading {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    align-items: center;

    @include pc {
      flex-direction: row;
    }
  }

  &__ai-icon-wrapper {
    @include fluid-style(width, 120, 140);

    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    background-color: $gray;
    border-radius: 100vmax;
  }

  &__ai-icon {
    width: 80%;
    aspect-ratio: 1;

    &.is-typing {
      animation: typing-bounce 0.15s infinite;
    }
  }

  &__editor {
    width: 30rem;
    overflow: hidden;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
  }

  &__editor-header {
    display: flex;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    background-color: $gray;
  }

  &__editor-dot {
    width: 1rem;
    aspect-ratio: 1;
    border-radius: 100vmax;

    &--red {
      background-color: $red;
    }

    &--yellow {
      background-color: $yellow;
    }

    &--green {
      background-color: $green;
    }
  }

  &__editor-body {
    min-height: 8rem;
    padding: 1.6rem;
    font-family: "Noto Sans JP", "Roboto Mono", monospace;
    font-size: 1.4rem;
    line-height: 1.5;
    text-align: left;
    background-color: $black;
  }

  &__editor-prompt-symbol {
    color: $green;
  }

  &__editor-typing-text {
    color: $yellow;
  }

  &__editor-blinking-cursor {
    font-weight: $bold;
    color: $blue;
    animation: blink 1s step-end infinite;
  }

  /* --- コアコンポーネントのラッパー --- */
  &__core {
    width: 100%;
  }

  /* =======================================================================
   * クレジット表記用スタイル
   * ======================================================================= */
  &__credits {
    @include fluid-style(gap, 8, 12);
    @include fluid-text(11, 12);

    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 2.4rem; /* TypingCoreとの間に余白を作る */
    color: $light-black; /* 目立ちすぎないグレー */
    text-align: center;
  }

  &__credit-highlight {
    font-family: $roboto-mono;
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__credit-link {
    display: inline-block;
    color: currentcolor;
    text-decoration: underline;
    transition: color $transition-base;

    @include hover {
      color: $blue;
    }
  }
}

/* =========================================================================
 * ゲームオーバー演出用スタイル
 * ========================================================================= */
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: $z-modal-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100svh;

  /* 背景を真っ黒の半透明にして、後ろを少しぼかす */
  background-color: rgb(0 0 0 / 85%);
  backdrop-filter: blur(5px);
}

.game-over-content {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  align-items: center;

  /* 拡大しながら少し下から現れるアニメーション */
  animation: game-over-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.game-over-text {
  @include fluid-text(60, 100);

  font-family: $roboto-mono;
  font-weight: $bold;
  line-height: 1;
  color: $red;
  letter-spacing: 0.1em;

  /* 禍々しく赤く光らせる */
  text-shadow: 0 0 20px rgba($red, 0.6), 0 0 40px rgba($red, 0.4);
}

.game-over-reason {
  font-family: $roboto-mono;
  font-size: 2.4rem;
  font-weight: $bold;
  color: $white;
  letter-spacing: 0.05em;
}

/* オーバーレイ自体のフェードイン・フェードアウト */
.fade-game-over-enter-active,
.fade-game-over-leave-active {
  transition: opacity $transition-base;
}

.fade-game-over-enter-from,
.fade-game-over-leave-to {
  opacity: 0;
}

/* =========================================================================
 * @keyframes (アニメーションの定義)
 * ========================================================================= */

/* 文字のポップアップアニメーション */
@keyframes game-over-pop {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* AIがタイピングしている反動を表現する微小な揺れ */
@keyframes typing-bounce {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-2px) rotate(-1deg);
  }

  75% {
    transform: translateY(-1px) rotate(1deg);
  }
}

/* エディタのカーソル点滅 */
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* AIアイコン切り替えアニメーション */
.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}
</style>