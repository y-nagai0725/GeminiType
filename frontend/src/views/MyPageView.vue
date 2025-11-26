<template>
  <div class="mypage-view">
    <h1 class="mypage-view__title">マイページ</h1>

    <div v-if="isLoading" class="mypage-view__loading">読み込み中...</div>

    <div v-else class="mypage-view__content">
      <section class="mypage-view__section">
        <h2 class="mypage-view__subtitle">📊 プレイデータ</h2>
        <div class="mypage-view__stats-grid">
          <div class="stat-card">
            <span class="stat-card__label">総タイプ数</span>
            <span class="stat-card__value">{{
              stats.total_types.toLocaleString()
            }}</span>
            <span class="stat-card__unit">keys</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">平均 KPM</span>
            <span class="stat-card__value">{{ stats.average_kpm }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-card__label">平均 正確率</span>
            <span class="stat-card__value">{{ stats.average_accuracy }}</span>
            <span class="stat-card__unit">%</span>
          </div>
        </div>
      </section>

      <section class="mypage-view__section" v-if="sessions.length > 1">
        <h2 class="mypage-view__subtitle">📈 成長グラフ</h2>
        <div class="mypage-view__chart-container">
          <GrowthChart :sessions="sessions" />
        </div>
      </section>

      <section
        class="mypage-view__section"
        v-if="stats.missed_keys_ranking.length > 0"
      >
        <h2 class="mypage-view__subtitle">😱 苦手なキー (Top 5)</h2>
        <div class="mypage-view__ranking">
          <div
            v-for="(item, index) in stats.missed_keys_ranking"
            :key="item.key"
            class="ranking-item"
          >
            <div class="ranking-item__rank">{{ index + 1 }}</div>
            <div class="ranking-item__key">{{ item.key.toUpperCase() }}</div>
            <div class="ranking-item__count">{{ item.count }}回ミス</div>
          </div>
        </div>
      </section>

      <section class="mypage-view__section">
        <h2 class="mypage-view__subtitle">📜 プレイ履歴</h2>

        <div v-if="sessions.length === 0" class="mypage-view__no-data">
          まだ履歴がありません。たくさん遊んでね！
        </div>

        <div v-else>
          <table class="mypage-view__table">
            <thead>
              <tr>
                <th>日時</th>
                <th>モード</th>
                <th>KPM</th>
                <th>Acc.</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="session in sessions" :key="session.id">
                <td>{{ formatDate(session.created_at) }}</td>
                <td>
                  <span v-if="session.session_type === 'db'">
                    📚 {{ session.genre ? session.genre.name : "削除済" }}
                  </span>
                  <span v-else>
                    🤖 AI: {{ truncateText(session.gemini_prompt, 10) }}
                  </span>
                </td>
                <td class="text-bold">{{ Math.round(session.average_kpm) }}</td>
                <td class="text-bold">
                  {{ Math.round(session.average_accuracy) }}%
                </td>
                <td>
                  <RouterLink
                    :to="`/mypage/session/${session.id}`"
                    class="mypage-view__detail-link"
                  >
                    詳細
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="mypage-view__pagination" v-if="totalPages > 1">
            <button
              v-for="page in totalPages"
              :key="page"
              :class="{ active: page === currentPage }"
              @click="handlePageChange(page)"
            >
              {{ page }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <div class="mypage-view__back">
      <RouterLink to="/menu">メニューに戻る</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import GrowthChart from "../components/GrowthChart.vue";
import { formatDate, truncateText } from "../utils/formatters";

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const isLoading = ref(true);
const stats = ref({
  total_types: 0,
  average_kpm: 0,
  average_accuracy: 0,
  missed_keys_ranking: [],
});
const sessions = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push("/login");
    return;
  }

  try {
    await Promise.all([fetchStats(), fetchSessions(1)]);
  } catch (error) {
    // 個別の関数内でエラー処理してるのでここはスルーでもOK
  } finally {
    isLoading.value = false;
  }
});

/**
 * 統計データの取得
 */
const fetchStats = async () => {
  try {
    const response = await api.get("/api/mypage/stats");
    stats.value = response.data;
  } catch (error) {
    notificationStore.addNotification(
      "統計データの取得に失敗しました",
      "error"
    );
  }
};

/**
 * 履歴データの取得
 */
const fetchSessions = async (page) => {
  try {
    const response = await api.get(`/api/mypage/sessions?page=${page}`);
    sessions.value = response.data.sessions;
    totalPages.value = response.data.totalPages;
    currentPage.value = response.data.currentPage;
  } catch (error) {
    notificationStore.addNotification("履歴の取得に失敗しました", "error");
  }
};

/**
 * ページ切り替え
 */
const handlePageChange = (page) => {
  fetchSessions(page);
};
</script>

<style lang="scss" scoped>
.mypage-view {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;

  &__title {
    text-align: center;
    margin-bottom: 2rem;
    color: #333;
  }

  &__loading {
    text-align: center;
    font-size: 1.2rem;
    color: #666;
  }

  &__section {
    margin-bottom: 3rem;
  }

  &__subtitle {
    font-size: 1.3rem;
    border-left: 5px solid #007bff;
    padding-left: 1rem;
    margin-bottom: 1.5rem;
    color: #444;
  }

  /* 統計カード */
  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &__label {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    &__value {
      font-size: 2rem;
      font-weight: bold;
      color: #007bff;
    }
    &__unit {
      font-size: 1rem;
      color: #888;
      margin-left: 0.2rem;
    }
  }

  /* ランキング */
  &__ranking {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .ranking-item {
    background: #fff0f0;
    border: 1px solid #ffcccc;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    min-width: 100px;

    &__rank {
      font-size: 0.9rem;
      font-weight: bold;
      color: #dc3545;
      margin-bottom: 0.3rem;
    }
    &__key {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
    }
    &__count {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.3rem;
    }
  }

  /* 履歴テーブル */
  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: #eee;
      padding: 0.8rem;
      text-align: left;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
    }
    .text-bold {
      font-weight: bold;
      color: #007bff;
    }
  }

  &__detail-link {
    color: #007bff;
    text-decoration: none;
    font-size: 0.9rem;
    &:hover {
      text-decoration: underline;
    }
  }

  &__pagination {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 0.5rem;

    button {
      padding: 0.5rem 0.8rem;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;

      &.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      &:hover:not(.active) {
        background: #f4f4f4;
      }
    }
  }

  &__back {
    text-align: center;
    margin-top: 3rem;
    a {
      color: #666;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

/* (★) グラフ用のコンテナスタイルを追加 */
.mypage-view__chart-container {
  background: white;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>