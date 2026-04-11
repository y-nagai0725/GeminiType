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
    </div>

    <div v-else-if="errorMessage" class="game-view__error">
      <p class="game-view__message game-view__message--error">
        エラーが発生しました
      </p>
      <p class="game-view__sub-message game-view__sub-message--error">
        {{ errorMessage }}
      </p>
      <RouterLink to="/menu" class="game-view__link-button">
        メインメニューに戻る<ArrowIcon class="game-view__arrow-icon" />
      </RouterLink>
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
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useDeviceEnvironment } from "../composables/useDeviceEnvironment";
import DeviceWarningModal from "@/components/DeviceWarningModal.vue";
import TypingCore from "../components/TypingCore.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import Loading from "@/components/Loading.vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ローディングの最低表示時間 (ミリ秒)
 * 画面のチラつき(FOUC)防止用
 */
const MIN_LOADING_MS = 300;

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * route (現在のURL情報)
 */
const route = useRoute();

/**
 * router (ページ遷移用)
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
 */
const isLoading = ref(false);

/**
 * ローディング中の詳細メッセージ
 */
const loadingMessage = ref("");

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * 問題リストデータ
 */
const problems = ref([]);

/**
 * 警告モーダルの表示フラグ
 */
const showWarningModal = ref(false);

// --- URLクエリからのデータ取得 (Computed) ---

/**
 * モード ('db' or 'gemini')
 */
const mode = computed(() => route.query.mode);

/**
 * ジャンルID (DBモード用)
 */
const genreId = computed(() => route.query.genreId);

/**
 * お題 (Geminiモード用)
 */
const prompt = computed(() => route.query.prompt);

// =========================================================================
// Composables 呼び出し
// =========================================================================

/**
 * デバイスのプレイ環境を判定する
 */
const { checkNeedsWarning } = useDeviceEnvironment();

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
    isLoading.value = false;
  }
};

/**
 * タイピング終了時（子コンポーネント: TypingCoreから発火）
 * 結果を集計し、必要ならDBへ保存し、結果画面へ遷移する
 * @param {Object} data TypingCoreから渡されるデータ { results, info }
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
  const isNormalMode = settingsStore.gameMode === "normal";

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
        notificationStore.addNotification("結果の保存に失敗しました", "error");
      }
    }
  } else if (!isNormalMode) {
    notificationStore.addNotification(
      "特殊モードのため、結果は保存されません（記録のみ表示します）",
      "success"
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
      },
      results: results,
      specialModeInfo: specialModeInfo,
    })
  );

  // 結果画面へ遷移
  router.push("/typing/result");
};

/**
 * 警告モーダルで「キャンセル」が押された時の処理
 */
const handleCancelWarning = () => {
  // メインメニュー画面へ遷移させる
  router.push("/menu");
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理 (画面が表示されたら問題をロードする)
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

  /* --- 戻るボタン --- */
  &__link-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
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
</style>