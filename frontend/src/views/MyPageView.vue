<template>
  <div class="mypage-view">
    <h1 class="mypage-view__title">
      <span class="en">MYPAGE</span>
      <span class="ja">マイページ</span>
    </h1>

    <div class="mypage-view__contents-wrapper">
      <template v-if="isLoading">
        <div class="mypage-view__loading">読み込み中…</div>
      </template>
      <template v-else>
        <div class="mypage-view__top-grid-wrapper">
          <section
            class="mypage-view__section mypage-view__section--total-rank"
          >
            <h2 class="mypage-view__subtitle">総合ランク</h2>
          </section>
          <section class="mypage-view__section mypage-view__section--play-data">
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
                <span class="stat-card__value">{{
                  stats.average_accuracy
                }}</span>
                <span class="stat-card__unit">%</span>
              </div>
            </div>
          </section>
          <section
            class="mypage-view__section mypage-view__section--weak-keys"
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
                <div class="ranking-item__key">
                  {{ item.key.toUpperCase() }}
                </div>
                <div class="ranking-item__count">{{ item.count }}回ミス</div>
              </div>
            </div>
          </section>
        </div>

        <section
          class="mypage-view__section mypage-view__section--chart"
          v-if="sessions.length > 1"
        >
          <h2 class="mypage-view__subtitle">📈 成長グラフ</h2>
          <div class="mypage-view__chart-container">
            <GrowthChart :sessions="sessions" />
          </div>
        </section>

        <section class="mypage-view__section mypage-view__section--history">
          <h2 class="mypage-view__subtitle">📜 プレイ履歴</h2>

          <div v-if="sessions.length === 0" class="mypage-view__no-data">
            まだ履歴がありません。たくさん遊んでね！
          </div>

          <div v-else class="mypage-view__table-wrapper">
            <table class="mypage-view__table">
              <thead>
                <tr class="mypage-view__tr">
                  <th class="mypage-view__th mypage-view__th--date">日時</th>
                  <th class="mypage-view__th mypage-view__th--mode">モード</th>
                  <th class="mypage-view__th mypage-view__th--kpm">KPM</th>
                  <th class="mypage-view__th mypage-view__th--acc">正確率</th>
                  <th class="mypage-view__th mypage-view__th--action">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="session in sessions"
                  class="mypage-view__tr"
                  :key="session.id"
                >
                  <td class="mypage-view__td mypage-view__td--date">
                    {{ formatDate(session.created_at) }}
                  </td>
                  <td class="mypage-view__td mypage-view__td--mode">
                    <span v-if="session.session_type === 'db'">
                      📚 {{ session.genre ? session.genre.name : "削除済" }}
                    </span>
                    <span v-else>
                      🤖 AI: {{ truncateText(session.gemini_prompt, 10) }}
                    </span>
                  </td>
                  <td class="mypage-view__td mypage-view__td--kpm">
                    {{ Math.round(session.average_kpm) }}
                  </td>
                  <td class="mypage-view__td mypage-view__td--acc">
                    {{ Math.round(session.average_accuracy) }}%
                  </td>
                  <td class="mypage-view__td mypage-view__td--action">
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
      </template>
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
  @include contents-width;

  @include pc {
    max-width: 1000px;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
    @include contents-padding;
  }

  &__loading {
  }

  &__top-grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    @include pc {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto auto;
      row-gap: 3.2rem;
      column-gap: 4rem;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 10, 16);

    &--total-rank {
      grid-row: auto;

      @include pc {
        grid-row: 1 / 3;
      }
    }
  }

  &__subtitle {
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
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

  &__table-wrapper {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    min-width: 1000px;
  }

  &__tr {
    &:nth-of-type(odd) {
      background-color: $gray;
    }
  }

  &__th {
    padding: 1em;
    font-size: 1.4rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
    color: $white;
    background-color: $green;

    &--date {
      width: 25%;
      text-align: left;
    }

    &--mode {
      width: 40%;
      text-align: left;
    }

    &--kpm {
      width: 10%;
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
      text-align: right;
    }

    &--acc {
      width: 10%;
      text-align: right;
    }

    &--action {
      width: 15%;
      text-align: center;
    }
  }

  &__td {
    padding: 1em;
    font-size: 1.4rem;
    line-height: 1;

    &--date {
      text-align: left;
    }

    &--mode {
      text-align: left;
    }

    &--kpm {
      font-family: $roboto-mono;
      color: $blue;
      text-align: right;
    }

    &--acc {
      color: $green;
      text-align: right;
    }

    &--action {
      text-align: center;
    }
  }

  &__detail-link {
    color: $blue;
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