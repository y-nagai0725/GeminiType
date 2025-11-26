<template>
  <div class="session-detail">
    <h1 class="session-detail__title">セッション詳細</h1>

    <div v-if="isLoading" class="session-detail__loading">読み込み中...</div>

    <div v-else-if="errorMessage" class="session-detail__error">
      <p>{{ errorMessage }}</p>
      <RouterLink to="/mypage" class="session-detail__link"
        >マイページに戻る</RouterLink
      >
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
            <span v-else>
              🤖 AI: {{ truncateText(session.gemini_prompt, 20) }}
            </span>
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
        <div class="score-item">
          <span class="label">総ミス数</span>
          <span class="value error-text">{{ session.total_miss_count }}</span>
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
        <div class="session-detail__table-wrapper">
          <table class="session-detail__table">
            <thead>
              <tr>
                <th class="col-no">No.</th>
                <th class="col-problem">問題文</th>
                <th class="col-romaji">ローマ字</th>
                <th class="col-kpm">KPM</th>
                <th class="col-acc">Acc.</th>
                <th class="col-miss-count">Miss</th>
                <th class="col-miss-keys">Missed Keys</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(problem, index) in session.session_problems"
                :key="problem.id"
              >
                <td>{{ index + 1 }}</td>
                <td class="text-left">{{ problem.problem_text }}</td>
                <td class="text-left text-romaji">
                  {{ problem.romaji_text || "-" }}
                </td>
                <td class="text-bold">{{ Math.round(problem.kpm) }}</td>
                <td class="text-bold">{{ Math.round(problem.accuracy) }}%</td>
                <td class="text-miss">{{ problem.miss_count }}</td>
                <td class="text-miss-keys">
                  {{ formatMissedKeys(problem.missed_keys) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
import { formatDate, truncateText, formatMissedKeys } from "../utils/formatters";

/**
 * route
 */
const route = useRoute();

/**
 * router
 */
const router = useRouter();

/**
 * ローディング状態
 */
const isLoading = ref(true);

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * セッション詳細データ
 */
const session = ref(null);

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  const sessionId = route.params.id;

  // IDがない場合は戻す
  if (!sessionId) {
    router.push("/mypage");
    return;
  }

  try {
    // 詳細APIを叩く
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
</script>

<style lang="scss" scoped>
.session-detail {
  max-width: 1000px; /* (★) テーブルが広くなったから幅を広げたよ！ */
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;
  text-align: center;

  &__title {
    font-size: 2rem;
    color: #333;
    margin-bottom: 2rem;
  }

  &__loading {
    font-size: 1.2rem;
    color: #666;
    margin-top: 4rem;
  }

  &__error {
    color: #dc3545;
    margin-top: 2rem;
    font-size: 1.1rem;
  }

  &__link {
    color: #007bff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  /* ヘッダー情報 */
  &__header {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
    font-size: 1.1rem;
    color: #555;
    flex-wrap: wrap; /* スマホ対応 */

    .label {
      font-weight: bold;
      margin-right: 0.5rem;
      color: #333;
    }
  }

  /* スコアボード */
  &__score-board {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

  /* リストセクション */
  &__list-section {
    h3 {
      text-align: left;
      border-bottom: 2px solid #eee;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      color: #555;
    }
  }

  /* テーブルラッパー（横スクロール対応） */
  &__table-wrapper {
    overflow-x: auto;
  }

  /* テーブル */
  &__table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
    font-size: 0.95rem;

    th {
      background: #f1f1f1;
      padding: 0.8rem;
      text-align: left;
      white-space: nowrap;
      color: #444;
    }
    td {
      border-bottom: 1px solid #eee;
      padding: 0.8rem;
      vertical-align: middle;
    }

    /* 各列のスタイル */
    .col-no {
      width: 50px;
      text-align: center;
    }
    .col-problem {
      min-width: 150px;
    }
    .col-romaji {
      min-width: 150px;
    }
    .col-kpm,
    .col-acc,
    .col-miss-count {
      width: 80px;
      text-align: center;
    }
    .col-miss-keys {
      min-width: 120px;
    }

    .text-left {
      text-align: left;
    }
    .text-bold {
      font-weight: bold;
      color: #333;
      text-align: center;
    }
    .text-romaji {
      font-family: "Courier New", monospace;
      color: #666;
      font-size: 0.9rem;
    }
    .text-miss {
      color: #dc3545;
      font-weight: bold;
      text-align: center;
    }
    .text-miss-keys {
      color: #dc3545;
      font-size: 0.85rem;
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