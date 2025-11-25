<template>
  <div class="session-detail">
    <h1 class="session-detail__title">セッション詳細</h1>

    <div v-if="isLoading" class="session-detail__loading">読み込み中...</div>

    <div v-else-if="errorMessage" class="session-detail__error">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/mypage">マイページに戻る</RouterLink>
    </div>

    <div v-else class="session-detail__content">
      <div class="session-detail__header">
        <div class="info-item">
          <span class="label">実施日時</span>
          <span class="value">{{ formatDate(session.created_at) }}</span>
        </div>
        <div class="info-item">
          <span class="label">モード</span>
          <span class="value">
            <span v-if="session.session_type === 'db'">
              📚 {{ session.genre ? session.genre.name : "削除済" }}
            </span>
            <span v-else> 🤖 AI: {{ session.gemini_prompt }} </span>
          </span>
        </div>
      </div>

      <div class="session-detail__score-board">
        <div class="score-item">
          <span class="label">平均 KPM</span>
          <span class="value">{{ Math.round(session.average_kpm) }}</span>
        </div>
        <div class="score-item">
          <span class="label">平均 正確率</span>
          <span class="value">{{ Math.round(session.average_accuracy) }}%</span>
        </div>
        <div class="score-item">
          <span class="label">総タイプ数</span>
          <span class="value">{{ session.total_types }}</span>
        </div>
        <div class="score-item" v-if="session.most_missed_key">
          <span class="label">ワーストキー</span>
          <span class="value error-text">{{
            session.most_missed_key.toUpperCase()
          }}</span>
        </div>
      </div>

      <section class="session-detail__list-section">
        <h3>問題別スコア</h3>
        <table class="session-detail__table">
          <thead>
            <tr>
              <th>No.</th>
              <th>問題文</th>
              <th>KPM</th>
              <th>Acc.</th>
              <th>ミスキー</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(problem, index) in session.session_problems"
              :key="problem.id"
            >
              <td>{{ index + 1 }}</td>
              <td class="text-left">{{ problem.problem_text }}</td>
              <td>{{ Math.round(problem.kpm) }}</td>
              <td>{{ Math.round(problem.accuracy) }}%</td>
              <td class="text-miss">
                {{ formatMissedKeys(problem.missed_keys) }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div class="session-detail__back">
        <RouterLink to="/mypage">マイページに戻る</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import api from "../services/api";

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const errorMessage = ref("");
const session = ref(null);

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  const sessionId = route.params.id;

  try {
    // (★) 詳細APIを叩く！
    const response = await api.get(`/api/mypage/sessions/${sessionId}`);
    session.value = response.data;
  } catch (error) {
    console.error("詳細取得エラー:", error);
    errorMessage.value =
      error.response?.data?.message || "データの取得に失敗しました";
  } finally {
    isLoading.value = false;
  }
});

// --- ヘルパー関数 ---

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * ミスキー情報のフォーマット (JSON文字列をパースして表示)
 */
const formatMissedKeys = (missedKeysJson) => {
  if (!missedKeysJson) return "-";

  try {
    // DBにはJSON文字列で入ってるからパースする
    const missedKeys = JSON.parse(missedKeysJson);

    if (Object.keys(missedKeys).length === 0) {
      return "-";
    }

    return Object.entries(missedKeys)
      .map(([key, count]) => `${key}(${count})`)
      .join(", ");
  } catch (e) {
    return "データ形式エラー";
  }
};
</script>

<style lang="scss" scoped>
.session-detail {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;
  text-align: center;

  &__title {
    font-size: 2rem;
    color: #333;
    margin-bottom: 2rem;
  }

  &__header {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
    font-size: 1.1rem;
    color: #555;

    .label {
      font-weight: bold;
      margin-right: 0.5rem;
    }
  }

  &__score-board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 12px;
  }

  .score-item {
    display: flex;
    flex-direction: column;

    .label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    .value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #007bff;
    }
    .error-text {
      color: #dc3545;
    }
  }

  &__list-section {
    h3 {
      text-align: left;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      color: #555;
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;

    th {
      background: #eee;
      padding: 0.8rem;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
    }

    .text-left {
      text-align: left;
    }
    .text-miss {
      color: #dc3545;
      font-size: 0.9rem;
    }
  }

  &__error {
    color: #dc3545;
    margin-top: 2rem;
    a {
      color: #007bff;
    }
  }

  &__back {
    margin-top: 2rem;
    a {
      color: #6c757d;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>