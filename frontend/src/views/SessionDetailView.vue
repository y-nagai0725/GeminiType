<template>
  <div class="session-detail">
    <h1 class="session-detail__title">
      <span class="en">SESSION DETAIL</span>
      <span class="ja">セッション詳細</span>
    </h1>
    <div class="session-detail__contents-wrapper">
      <div v-if="isLoading" class="session-detail__loading">読み込み中...</div>

      <div v-else-if="errorMessage" class="session-detail__error">
        <p>{{ errorMessage }}</p>
        <RouterLink to="/mypage" class="session-detail__link"
          >マイページに戻る</RouterLink
        >
      </div>

      <div v-else class="session-detail__content">
        <div class="session-detail__information">
          <span class="session-detail__information-label">実施日時</span>
          <span
            class="session-detail__information-value session-detail__information-value--number"
            >{{ formatDate(session.created_at) }}</span
          >
          <span class="session-detail__information-label">モード: お題</span>
          <span class="session-detail__information-value">
            <span v-if="session.session_type === 'db'">
              {{ session.genre ? session.genre.name : "削除済" }}
            </span>
            <span v-else>
              AI: {{ truncateText(session.gemini_prompt, 20) }}
            </span>
          </span>
        </div>

        <div class="session-detail__score-board">
          <div class="score-item">
            <span class="label">平均 KPM</span>
            <span class="value">{{ Math.round(session.average_kpm) }}</span>
          </div>
          <div class="score-item">
            <span class="label">平均 正確率</span>
            <span class="value"
              >{{ Math.round(session.average_accuracy) }}%</span
            >
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

        <div class="session-detail__history">
          <h2 class="session-detail__subtitle">問題別スコア</h2>
          <div class="session-detail__table-wrapper">
            <table class="session-detail__table">
              <thead>
                <tr class="session-detail__tr">
                  <th class="session-detail__th session-detail__th--no">No.</th>
                  <th class="session-detail__th session-detail__th--problem">
                    問題文
                  </th>
                  <th class="session-detail__th session-detail__th--romaji">
                    ローマ字
                  </th>
                  <th class="session-detail__th session-detail__th--kpm">
                    KPM
                  </th>
                  <th class="session-detail__th session-detail__th--acc">
                    正確率
                  </th>
                  <th class="session-detail__th session-detail__th--miss-keys">
                    ミスしたキー
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(problem, index) in session.session_problems"
                  :key="problem.id"
                  class="session-detail__tr"
                >
                  <td class="session-detail__td session-detail__td--no">
                    {{ index + 1 }}
                  </td>
                  <td class="session-detail__td session-detail__td--problem">
                    {{ problem.problem_text }}
                  </td>
                  <td class="session-detail__td session-detail__td--romaji">
                    {{ problem.romaji_text || "-" }}
                  </td>
                  <td class="session-detail__td session-detail__td--kpm">
                    {{ Math.round(problem.kpm) }}
                  </td>
                  <td class="session-detail__td session-detail__td--acc">
                    {{ Math.round(problem.accuracy) }}%
                  </td>
                  <td class="session-detail__td session-detail__td--miss-keys">
                    {{ formatMissedKeys(problem.missed_keys) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="session-detail__back">
          <RouterLink to="/mypage" class="session-detail__back-button"
            >マイページに戻る<ArrowIcon class="session-detail__arrow-icon"
          /></RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import {
  formatDate,
  truncateText,
  formatMissedKeys,
} from "../utils/formatters";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

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
    max-width: 600px;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  //TODO
  &__loading {
    font-size: 1.2rem;
    color: #666;
    margin-top: 4rem;
  }

  //TODO
  &__error {
    color: #dc3545;
    margin-top: 2rem;
    font-size: 1.1rem;
  }

  //TODO
  &__link {
    color: #007bff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
  }

  &__information {
    display: grid;
    grid-template-columns: 1fr 2.5fr;
    row-gap: 1em;
    width: 100%;
    max-width: 500px;
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__information-label {
    font-weight: $bold;
  }

  &__information-value {
    &--number {
      font-family: $roboto-mono;
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

  &__history {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 8, 16);
  }

  &__subtitle {
    font-weight: $bold;
    @include fluid-text(14, 16);
    letter-spacing: 0.1em;
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

    &--no {
      width: 5%;
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
      text-align: right;
    }

    &--problem {
      width: 30%;
      text-align: left;
    }

    &--romaji {
      width: 30%;
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

    &--miss-keys {
      width: 15%;
      text-align: center;
    }
  }

  &__td {
    padding: 1em;
    font-size: 1.4rem;

    &--no {
      font-family: $roboto-mono;
      text-align: right;
    }

    &--problem {
      text-align: left;
    }

    &--romaji {
      font-family: $roboto-mono;
      text-align: left;
    }

    &--kpm {
      font-family: $roboto-mono;
      color: $blue;
      text-align: right;
    }

    &--acc {
      font-family: $roboto-mono;
      color: $green;
      text-align: right;
    }

    &--miss-keys {
      font-family: $roboto-mono;
      color: $red;
    }
  }

  &__back {
  }

  &__back-button {
    @include button-style-border($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }
}
</style>