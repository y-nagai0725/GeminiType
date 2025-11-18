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
      <RouterLink to="/" class="game-view__button">メニューに戻る</RouterLink>
    </div>

    <div v-else class="game-view__core">
      <TypingCore :problems="problems" @complete="handleComplete" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import TypingCore from "../components/TypingCore.vue";

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

// --- 状態 ---
const isLoading = ref(true);
const loadingMessage = ref("");
const errorMessage = ref("");
const problems = ref([]);

// --- URLクエリから設定を取得 ---
const mode = computed(() => route.query.mode); // 'db' or 'gemini'
const genreId = computed(() => route.query.genreId);
const prompt = computed(() => route.query.prompt);

/**
 * 画面が表示されたら問題をロード！
 */
onMounted(async () => {
  // バリデーション: モード指定がなければ戻す
  if (!mode.value) {
    router.push("/");
    return;
  }

  await loadProblems();
});

/**
 * APIから問題を取得する魔法
 */
const loadProblems = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    // 1. DBモードの場合
    if (mode.value === "db") {
      loadingMessage.value = "データベースから問題を抽出中...";
      const response = await api.get("/api/typing/db", {
        params: {
          count: settingsStore.problemCount, // 設定した問題数
          genreId: genreId.value,
        },
      });
      problems.value = response.data;
    }
    // 2. Geminiモードの場合
    else if (mode.value === "gemini") {
      loadingMessage.value = "AIが問題を生成中... (ちょっと待ってね♡)";
      const response = await api.get("/api/typing/gemini", {
        params: {
          count: settingsStore.problemCount, // 設定した問題数
          prompt: prompt.value,
        },
      });
      problems.value = response.data;
    }

    // 問題が取れなかった場合
    if (problems.value.length === 0) {
      throw new Error("問題が見つかりませんでした。条件を変えて試してみてね！");
    }
  } catch (error) {
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
 */
const handleComplete = async (results) => {
  // (★) 集計処理（WPMなどの平均を計算）
  const totalProblems = results.length;
  const avgWpm = results.reduce((sum, r) => sum + r.wpm, 0) / totalProblems;
  const avgAccuracy =
    results.reduce((sum, r) => sum + r.accuracy, 0) / totalProblems;

  // (★) (★) (★)
  // お兄ちゃんがやりたかった「ミスキー集計」 ロジック！
  // (★) (★) (★)

  // 1. 全問題のミスを「1つの箱」にまとめる
  const totalMissedKeys = {};
  results.forEach(result => {
    const keys = result.missed_keys || {};
    for (const [key, count] of Object.entries(keys)) {
      totalMissedKeys[key] = (totalMissedKeys[key] || 0) + count;
    }
  })

  // 2. 「一番多いやつ」を探す！
  let mostMissedKey = '';
  let maxMissCount = 0;

  for (const [key, count] of Object.entries(totalMissedKeys)) {
    if (count > maxMissCount) {
      maxMissCount = count;
      mostMissedKey = key;
    }
  }

  // (デバッグ用：コンソールで確認してみてね♡)
  console.log('集計結果:', { totalMissedKeys, mostMissedKey })

  // total_types は概算（WPMから逆算もできるけど、今回は簡易的に文字数合計とかでもOK。一旦0にしておくね！）
  // ※本当は TypingCore から総タイプ数も送ってもらうと正確だよ！
  const totalTypes = 0 // (今回は0のままでOK)

  // (★) ログインしているなら、結果をDBに保存！
  if (authStore.isLoggedIn) {
    try {
      await api.post("/api/typing/result", {
        session_type: mode.value,
        genre_id: parseInt(genreId.value, 10) || null,
        gemini_prompt: prompt.value || null,
        average_wpm: avgWpm,
        average_accuracy: avgAccuracy,
        most_missed_key: mostMissedKey,
        total_types: totalTypes,
        problem_results: results,
      });
      notificationStore.addNotification("結果を保存しました！", "success");
    } catch (error) {
      console.error("保存エラー:", error);
      notificationStore.addNotification(
        "結果の保存に失敗しました（プレイデータは残ります）",
        "error"
      );
    }
  } else {
    // ゲストユーザーへの通知
    notificationStore.addNotification(
      "お疲れ様！ログインすると結果を保存できるよ♡",
      "success"
    );
  }

  // (★) 次の画面（結果画面）へ！ (Task 15)
  // 一旦、結果データを localStorage に一時保存して渡すのが簡単かも！
  // （URLクエリだとデータ量が多すぎるからね）
  localStorage.setItem(
    "last_session_result",
    JSON.stringify({
      stats: { wpm: avgWpm, accuracy: avgAccuracy },
      results: results,
    })
  );

  // (★) (★) (★)
  // ここに追加！「もう一度やる！」ボタンのために、今回の設定を覚えておくよ！
  // (★) (★) (★)
  localStorage.setItem(
    "last_session_config",
    JSON.stringify({
      mode: mode.value,
      genreId: genreId.value,
      prompt: prompt.value,
    })
  );

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