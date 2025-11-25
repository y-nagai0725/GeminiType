<template>
  <div class="game-view">
    <div v-if="isLoading" class="game-view__loading">
      <p>問題を準備しています...</p>
      <p v-if="loadingMessage" class="game-view__sub-message">
        {{ loadingMessage }}
      </p>
    </div>

    <div v-else-if="errorMessage" class="game-view__error">
      <p>エラーが発生しました</p>
      <p>{{ errorMessage }}</p>
      <RouterLink to="/menu" class="game-view__button">メニューに戻る</RouterLink>
    </div>

    <div v-else class="game-view__core">
      <TypingCore :problems="problems" @complete="handleComplete" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import TypingCore from "../components/TypingCore.vue";

/**
 * route
 */
const route = useRoute();

/**
 * router
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
const isLoading = ref(true);

/**
 * ローディングメッセージ
 */
const loadingMessage = ref("");

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * 問題リスト
 */
const problems = ref([]);

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

/**
 * 画面が表示されたら問題をロードする
 */
onMounted(async () => {
  // 不正なアクセスなら戻す
  if (!validateQuery()) {
    router.push("/menu");
    return;
  }

  await loadProblems();
});

/**
 * クエリパラメータのバリデーション
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
 */
const loadProblems = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    // DBモードの場合
    if (mode.value === "db") {
      loadingMessage.value = "データベースから問題を抽出中...";

      // クエリパラメータの作成
      const params = new URLSearchParams();
      params.append("count", settingsStore.problemCount);
      if (genreId.value) params.append("genreId", genreId.value);

      const response = await api.get(`/api/typing/db?${params.toString()}`);
      problems.value = response.data;
    }
    // Geminiモードの場合
    else if (mode.value === "gemini") {
      loadingMessage.value = "AIが問題を生成中... (少々お待ちください。)";

      const params = new URLSearchParams();
      params.append("count", settingsStore.problemCount);
      if (prompt.value) params.append("prompt", prompt.value);

      const response = await api.get(`/api/typing/gemini?${params.toString()}`);
      problems.value = response.data;
    }

    // 問題が取れなかった場合
    if (problems.value.length === 0) {
      throw new Error("問題が見つかりませんでした。条件を変えて試して下さい。");
    }
  } catch (error) {
    // エラー通知
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
 * タイピング終了時（TypingCoreから呼ばれる）
 * @param {Array} results 各問題の結果配列
 */
const handleComplete = async (results) => {
  // 集計処理
  const totalProblems = results.length;
  const avgKpm = Math.round(
    results.reduce((sum, r) => sum + r.kpm, 0) / totalProblems
  );
  const avgAccuracy = Math.round(
    results.reduce((sum, r) => sum + r.accuracy, 0) / totalProblems
  );

  // ミスキー集計
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

  // TypingCore が送ってくれた「正解数 + ミス数」を全部足し算
  const totalTypes = results.reduce((sum, r) => {
    // correct_key_count と miss_key_count を使う
    const count = (r.correct_key_count || 0) + (r.miss_key_count || 0);
    return sum + count;
  }, 0);

  // ログインしているなら、結果をDBに保存
  if (authStore.isLoggedIn) {
    try {
      await api.post("/api/typing/result", {
        session_type: mode.value,
        genre_id: genreId.value ? parseInt(genreId.value, 10) : null,
        gemini_prompt: prompt.value || null,
        average_kpm: avgKpm,
        average_accuracy: avgAccuracy,
        most_missed_key: mostMissedKey,
        total_types: totalTypes,
        problem_results: results,
      });
      notificationStore.addNotification("結果を保存しました！", "success");
    } catch (error) {
      // 保存失敗は通知するけど、画面遷移は止めない
      console.error("保存エラー:", error);
      // (401の時は、インターセプター が「セッション切れ」通知をしてくれる為)
      if (!error.response || error.response.status !== 401) {
        notificationStore.addNotification(
          "結果の保存に失敗しました（プレイデータは残ります）",
          "error"
        );
      }
    }
  } else {
    // ゲストユーザーへの通知
    notificationStore.addNotification(
      "お疲れ様！ログインすると結果を保存できるよ♡",
      "success"
    );
  }

  // 次回の「もう一度やる！」のために設定を保存
  localStorage.setItem(
    "last_session_config",
    JSON.stringify({
      mode: mode.value,
      genreId: genreId.value,
      prompt: prompt.value,
    })
  );

  // 結果データを保存
  localStorage.setItem(
    "last_session_result",
    JSON.stringify({
      stats: { kpm: avgKpm, accuracy: avgAccuracy },
      results: results,
    })
  );

  // 結果画面へ遷移
  router.push("/typing/result");
};
</script>

<style lang="scss" scoped>
.game-view {
  max-width: 900px;
  margin: 2rem auto;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;

  &__loading,
  &__error {
    text-align: center;
    font-size: 1.2rem;
    color: #666;
  }

  &__sub-message {
    font-size: 0.9rem;
    margin-top: 0.5rem;
    color: #888;
  }

  &__error {
    color: #dc3545;
  }

  &__button {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #6c757d;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    &:hover {
      background-color: #5a6268;
    }
  }

  &__core {
    width: 100%;
  }
}
</style>