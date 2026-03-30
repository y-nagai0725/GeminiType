<template>
  <div class="mypage-view">
    <h1 class="mypage-view__title">
      <span class="en">MYPAGE</span>
      <span class="ja">マイページ</span>
    </h1>

    <div class="mypage-view__contents-wrapper">
      <template v-if="isContentsLoading">
        <Loading
          class="mypage-view__loading"
          :text="'統計データ読み込み中です…'"
        />
      </template>
      <template v-else-if="errorMessage">
        <div class="mypage-view__error">
          <p class="mypage-view__error-message">
            {{ errorMessage }}
          </p>
          <RouterLink to="/menu" class="mypage-view__back-button">
            メインメニューに戻る<ArrowIcon class="mypage-view__arrow-icon" />
          </RouterLink>
        </div>
      </template>
      <template v-else>
        <div class="mypage-view__top-grid-wrapper">
          <section class="mypage-view__section mypage-view__section--profile">
            <h2 class="mypage-view__subtitle">プロフィール</h2>
            <div class="mypage-view__profile-wrapper">
              <div class="mypage-view__profile">
                <UserIcon class="mypage-view__profile-user-icon" />
                <dl class="mypage-view__profile-info">
                  <div class="mypage-view__profile-item">
                    <dt class="mypage-view__profile-heading">お名前</dt>
                    <dd class="mypage-view__profile-value">
                      {{ authStore.user?.name }}
                    </dd>
                  </div>
                  <div class="mypage-view__profile-item">
                    <dt class="mypage-view__profile-heading">総プレイ回数</dt>
                    <dd
                      class="mypage-view__profile-value mypage-view__profile-value--number"
                    >
                      {{ totalCount }}
                    </dd>
                  </div>
                  <div class="mypage-view__profile-item">
                    <dt class="mypage-view__profile-heading">初回プレイ日時</dt>
                    <dd
                      class="mypage-view__profile-value mypage-view__profile-value--number"
                    >
                      {{ formatDate(stats.first_play_at) }}
                    </dd>
                  </div>
                  <div class="mypage-view__profile-item">
                    <dt class="mypage-view__profile-heading">最新プレイ日時</dt>
                    <dd
                      class="mypage-view__profile-value mypage-view__profile-value--number"
                    >
                      {{ formatDate(stats.latest_play_at) }}
                    </dd>
                  </div>
                </dl>
              </div>
              <div class="mypage-view__score-card">
                <div class="mypage-view__score-item">
                  <ScoreIcon
                    class="mypage-view__card-icon mypage-view__card-icon--score"
                  />
                  <span class="mypage-view__card-title">総合スコア</span>
                  <span
                    class="mypage-view__card-value mypage-view__card-value--score"
                    >{{ score }}</span
                  >
                </div>
                <div class="mypage-view__rank-item">
                  <div class="mypage-view__rank-circle-wrapper">
                    <svg
                      class="mypage-view__progress-ring"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        class="mypage-view__progress-ring-background"
                        stroke-width="10"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        class="mypage-view__progress-ring-circle"
                        stroke-width="10"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        :class="scoreRankClass"
                        :stroke-dasharray="circumference"
                        :stroke-dashoffset="progressCircleDashoffset"
                      />
                    </svg>
                  </div>
                  <div class="mypage-view__rank-wrapper">
                    <span
                      class="mypage-view__rank-text"
                      :class="scoreRankClass"
                      >{{ rank }}</span
                    >
                    <span class="mypage-view__rank-title">Rank</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section class="mypage-view__section mypage-view__section--play-data">
            <h2 class="mypage-view__subtitle">プレイデータ</h2>
            <div class="mypage-view__stats-card-wrapper">
              <div class="mypage-view__stat-card">
                <KpmIcon
                  class="mypage-view__card-icon mypage-view__card-icon--kpm"
                />
                <span class="mypage-view__card-title">平均 KPM</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--kpm"
                  >{{ stats.total_types === 0 ? "-" : stats.average_kpm }}</span
                >
              </div>
              <div class="mypage-view__stat-card">
                <AccuracyIcon
                  class="mypage-view__card-icon mypage-view__card-icon--accuracy"
                />
                <span class="mypage-view__card-title">平均 正確率</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--accuracy"
                  >{{
                    stats.total_types === 0 ? "-" : `${stats.average_accuracy}%`
                  }}</span
                >
              </div>
              <div class="mypage-view__stat-card">
                <TotalTypeCountIcon
                  class="mypage-view__card-icon mypage-view__card-icon--total-type-count"
                />
                <span class="mypage-view__card-title">総タイプ数</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--total-type-count"
                  >{{
                    stats.total_types === 0
                      ? "-"
                      : stats.total_types.toLocaleString()
                  }}</span
                >
              </div>
            </div>
          </section>
          <section class="mypage-view__section mypage-view__section--weak-keys">
            <h2 class="mypage-view__subtitle">
              苦手なキー<span class="en">(Top5)</span>
            </h2>

            <div
              v-if="stats.missed_keys_ranking.length === 0"
              class="mypage-view__no-data"
            >
              まだ履歴がありません。たくさん遊んでね！
            </div>

            <div v-else class="mypage-view__ranking-wrapper">
              <div
                v-for="(item, index) in stats.missed_keys_ranking"
                :key="item.key"
                class="mypage-view__ranking-item"
              >
                <div class="mypage-view__ranking-rank">{{ index + 1 }}</div>
                <div class="mypage-view__ranking-key">
                  {{ item.key.toUpperCase() }}
                </div>
                <div class="mypage-view__ranking-count">
                  <span class="en">{{ item.count }}</span> miss
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="mypage-view__section mypage-view__section--chart">
          <h2 class="mypage-view__subtitle">成長グラフ</h2>

          <div v-if="sessions.length === 0" class="mypage-view__no-data">
            まだ履歴がありません。たくさん遊んでね！
          </div>

          <div v-else class="mypage-view__chart-container">
            <ScrollHint :show="!scrollStates.chart" />
            <div
              v-if="isSessionLoading"
              class="mypage-view__session-loading-overlay"
            >
              <Loading />
            </div>
            <div
              class="mypage-view__chart-wrapper"
              ref="chartWrapper"
              @scroll="handleScroll($event, 'chart')"
            >
              <GrowthChart class="mypage-view__chart" :sessions="sessions" />
            </div>
          </div>
        </section>

        <section class="mypage-view__section mypage-view__section--history">
          <h2 class="mypage-view__subtitle">プレイ履歴</h2>

          <div v-if="sessions.length === 0" class="mypage-view__no-data">
            まだ履歴がありません。たくさん遊んでね！
          </div>

          <template v-else>
            <div
              class="mypage-view__pagination-container"
              v-if="totalPages > 1"
            >
              <div class="mypage-view__pagination">
                <button
                  class="mypage-view__page-button mypage-view__page-button--prev"
                  :class="{ 'is-disabled': currentPage === 1 }"
                  @click="prevPage"
                  :disabled="currentPage === 1"
                ></button>

                <template v-for="(item, index) in paginationItems">
                  <button
                    v-if="item !== '...'"
                    :key="`num-${index}`"
                    class="mypage-view__page-button mypage-view__page-button--number"
                    :class="{
                      'is-active': item === currentPage,
                    }"
                    @click="handlePageChange(item)"
                  >
                    {{ item }}
                  </button>

                  <span
                    v-else
                    :key="`dots-${index}`"
                    class="mypage-view__page-dots"
                  >
                    …
                  </span>
                </template>

                <button
                  class="mypage-view__page-button mypage-view__page-button--next"
                  :class="{ 'is-disabled': currentPage === totalPages }"
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                ></button>
              </div>
            </div>
            <div class="mypage-view__table-container">
              <ScrollHint :show="!scrollStates.table" />
              <div
                v-if="isSessionLoading"
                class="mypage-view__session-loading-overlay"
              >
                <Loading />
              </div>
              <div
                class="mypage-view__table-wrapper"
                ref="historyTableWrapper"
                @scroll="handleScroll($event, 'table')"
              >
                <table class="mypage-view__table">
                  <thead>
                    <tr class="mypage-view__tr">
                      <th class="mypage-view__th mypage-view__th--date">
                        日時
                      </th>
                      <th class="mypage-view__th mypage-view__th--mode">
                        モード(AI or DB): お題
                      </th>
                      <th class="mypage-view__th mypage-view__th--kpm">KPM</th>
                      <th class="mypage-view__th mypage-view__th--acc">
                        正確率
                      </th>
                      <th class="mypage-view__th mypage-view__th--action"></th>
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
                        <span v-if="session.session_type === 'db'" class="db">
                          DB:
                          {{ session.genre ? session.genre.name : "削除済" }}
                        </span>
                        <span v-else class="ai"
                          >AI:
                          {{ truncateText(session.gemini_prompt, 15) }}
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
                          <ArrowIcon class="mypage-view__arrow-icon" />
                        </RouterLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div
              class="mypage-view__pagination-container"
              v-if="totalPages > 1"
            >
              <div class="mypage-view__pagination">
                <button
                  class="mypage-view__page-button mypage-view__page-button--prev"
                  :class="{ 'is-disabled': currentPage === 1 }"
                  @click="prevPage"
                  :disabled="currentPage === 1"
                ></button>

                <template v-for="(item, index) in paginationItems">
                  <button
                    v-if="item !== '...'"
                    :key="`num-${index}`"
                    class="mypage-view__page-button mypage-view__page-button--number"
                    :class="{
                      'is-active': item === currentPage,
                    }"
                    @click="handlePageChange(item)"
                  >
                    {{ item }}
                  </button>

                  <span
                    v-else
                    :key="`dots-${index}`"
                    class="mypage-view__page-dots"
                  >
                    …
                  </span>
                </template>

                <button
                  class="mypage-view__page-button mypage-view__page-button--next"
                  :class="{ 'is-disabled': currentPage === totalPages }"
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                ></button>
              </div>
            </div>
          </template>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import GrowthChart from "../components/GrowthChart.vue";
import { formatDate, truncateText } from "../utils/formatters";
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import ScoreIcon from "@/components/icons/ScoreIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
import Loading from "@/components/Loading.vue";
import ScrollHint from "@/components/ScrollHint.vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ScrollTriggerを登録する
gsap.registerPlugin(ScrollTrigger);

/**
 * router
 */
const router = useRouter();

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * グラフ要素を取得するための参照
 */
const chartWrapper = ref(null);

/**
 * 履歴テーブル要素を取得するための参照
 */
const historyTableWrapper = ref(null);

/**
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * ローディングの最低表示時間 (ミリ秒)
 */
const MIN_LOADING_MS = 300;

/**
 * ページ全体のローディング状態
 */
const isContentsLoading = ref(false);

/**
 * グラフと表のローディング状態
 */
const isSessionLoading = ref(false);

/**
 * スクロールヒントの非表示状態を管理するオブジェクト
 */
const scrollStates = ref({
  chart: false,
  table: false,
});

/**
 * 統計データ
 */
const stats = ref({
  // 総タイプ数
  total_types: 0,
  // 平均KPM
  average_kpm: 0,
  // 平均正確率
  average_accuracy: 0,
  // 苦手キー配列
  missed_keys_ranking: [],
  // 初回プレイ日時
  first_play_at: null,
  // 最新プレイ日時
  latest_play_at: null,
});

/**
 * 履歴データ配列
 */
const sessions = ref([]);

/**
 * 履歴データページネーションの現在のページ数
 */
const currentPage = ref(1);

/**
 * 履歴データ総件数
 */
const totalCount = ref(0);

/**
 * 履歴データページネーションの総ページ数
 */
const totalPages = ref(1);

/**
 * スコアランククラス名
 */
const scoreRankClass = ref("rank-c");

/**
 * ランクテキスト
 */
const rank = ref("C");

/**
 * 円の半径
 */
const radius = 45;

/**
 * 円周の長さ（2 * π * r）
 */
const circumference = 2 * Math.PI * radius;

/**
 * スコアの最大値
 */
const maxScore = 350;

/**
 * スコアランクプログレスバー（円）のstroke-dashoffset
 */
const progressCircleDashoffset = ref(circumference);

/**
 * 結果ランクのstroke-dashoffset
 */
const resultDashoffset = computed(() => {
  const validPercent = Math.min(100, Math.max(0, scorePercent.value));

  // 計算式：円周 - (進捗割合 * 円周)
  return circumference - (validPercent / 100) * circumference;
});

/**
 * スコア値
 */
const score = computed(() => {
  if (stats.value.average_kpm === 0 && stats.value.average_accuracy === 0)
    return "-";
  const kpm = stats.value.average_kpm;
  const acc = stats.value.average_accuracy;
  return Math.round(kpm * (acc / 100));
});

/**
 * スコアの割合
 */
const scorePercent = computed(() => {
  if (!score.value || score.value === "-") {
    return 0;
  }

  return Math.round((score.value / maxScore) * 100);
});

/**
 * ページネーションアイテム
 */
const paginationItems = computed(() => {
  const current = currentPage.value;
  const total = totalPages.value;

  // 必ず表示したいページ番号
  // (1ページ目、最後のページ、現在のページ、現在の前後のページ)
  const pages = new Set([1, total, current, current - 1, current + 1]);

  // 範囲外のページ（0以下や最大ページ超え）を除外、昇順に並べ替える
  const sortedPages = Array.from(pages)
    .filter((page) => page > 0 && page <= total)
    .sort((a, b) => a - b);

  const result = [];

  for (let i = 0; i < sortedPages.length; i++) {
    const page = sortedPages[i];

    if (i > 0) {
      const prevPage = sortedPages[i - 1];
      if (page - prevPage > 1) {
        if (page - prevPage === 2) {
          result.push(prevPage + 1); // 間の数字が1個だけなら数字を表示
        } else {
          result.push("..."); // 間の数字がいっぱいあるなら「...」を表示
        }
      }
    }

    result.push(page);
  }

  return result;
});

/**
 * GSAPコンテキスト
 */
let gsapContext;

/**
 * 初期データ読み込み
 */
onMounted(async () => {
  // ローディング表示
  isContentsLoading.value = true;

  try {
    await Promise.all([
      fetchStats(),
      fetchSessions(1),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    // どちらかのAPIでエラーが発生した場合
    errorMessage.value = "データの取得に失敗しました。";
  } finally {
    // ローディング終了
    isContentsLoading.value = false;
    if (!errorMessage.value) {
      await nextTick();
      setAnimation();
    }
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  // コンポーネントが破棄される時にアニメーションをリセットする
  if (gsapContext) {
    gsapContext.revert();
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
    throw error;
  }
};

/**
 * 履歴データの取得
 */
const fetchSessions = async (page) => {
  // グラフと表のローディング表示
  isSessionLoading.value = true;

  try {
    const [response] = await Promise.all([
      api.get(`/api/mypage/sessions?page=${page}`),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    sessions.value = response.data.sessions;
    totalPages.value = response.data.totalPages;
    totalCount.value = response.data.totalCount;
    currentPage.value = response.data.currentPage;

    // スクロール位置リセット
    resetScroll("chart", chartWrapper);
    resetScroll("table", historyTableWrapper);
  } catch (error) {
    notificationStore.addNotification("履歴の取得に失敗しました", "error");
    throw error;
  } finally {
    // ローディング終了
    isSessionLoading.value = false;
  }
};

/**
 * ページ切り替え
 */
const handlePageChange = async (page) => {
  // 「...」や無効なページ番号の場合は何もしない
  if (page === "..." || page < 1 || page > totalPages.value) return;

  // 該当ページの履歴データ取得
  try {
    await fetchSessions(page);
  } catch (error) {
    // エラー時の通知は fetchSessions の中で処理を行っている
  }
};

/**
 * 次へボタンの処理
 */
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    handlePageChange(currentPage.value);
  }
};

/**
 * 前へボタンの処理
 */
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    handlePageChange(currentPage.value);
  }
};

/**
 * スクロールイベントハンドラ
 */
const handleScroll = (e, targetKey) => {
  // すでにスクロールヒントが消えている（true）なら、これ以上計算しない
  if (scrollStates.value[targetKey]) return;

  // 5px以上スクロールされたら、スクロールヒントを消す
  if (e.target.scrollLeft > 5) {
    scrollStates.value[targetKey] = true;
  }
};

/**
 * スクロール位置とヒント表示をリセットする
 */
const resetScroll = (targetKey, wrapperRef) => {
  if (wrapperRef.value) {
    wrapperRef.value.scrollLeft = 0;
  }
  scrollStates.value[targetKey] = false;
};

/**
 * 結果表示アニメーション設定
 * TODO 仮アニメーションです
 */
const setAnimation = () => {
  // アニメーション共通設定：開始状態
  const fromAnimationSettings = {
    autoAlpha: 0,
    y: 20,
  };

  // アニメーション共通設定：終了状態
  const toAnimationSettings = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8, // 0.8秒かけて表示
    ease: "power2.out",
  };

  gsapContext = gsap.context(() => {
    // プロフィールセクション
    const profileSection = ".mypage-view__section--profile";

    // プレイデータセクション
    const playDataSection = ".mypage-view__section--play-data";

    // 苦手キーセクション
    const weakKeysSection = ".mypage-view__section--weak-keys";

    // 成長グラフセクション
    const chartSection = ".mypage-view__section--chart";

    // 履歴セクション
    const historySection = ".mypage-view__section--history";

    // --- [プレイデータ,苦手キー,成長グラフ,履歴]セクションの表示アニメーション ---
    [playDataSection, weakKeysSection, chartSection, historySection].forEach(
      (section) => {
        gsap.fromTo(
          section,
          {
            ...fromAnimationSettings,
          },
          {
            ...toAnimationSettings,
            scrollTrigger: {
              trigger: section,
              start: "top center+=20%",
            },
          }
        );
      }
    );

    // --- プロフィールセクションのアニメーション設定 ---
    const timelineProfileSection = gsap.timeline({
      scrollTrigger: {
        trigger: profileSection,
        start: "top center+=20%",
      },
    });

    timelineProfileSection.fromTo(
      profileSection,
      {
        ...fromAnimationSettings,
      },
      {
        ...toAnimationSettings,
      }
    );

    timelineProfileSection.fromTo(
      progressCircleDashoffset,
      {
        value: circumference,
      },
      {
        value: resultDashoffset.value,
        duration: 0.8,
        ease: "none",
      },
      "-=0.6"
    );
  });
};

/**
 * スコアランクプログレスバー値を監視
 */
watch(progressCircleDashoffset, (newValue) => {
  // プログレスバー割合
  const percent = Math.max(0, (1 - newValue / circumference) * 100);

  // 履歴データが無い時
  if (percent === 0) {
    scoreRankClass.value = "rank-none";
    rank.value = "-";
    return;
  }

  // 割合でランク付け
  if (percent >= 95) {
    // 95%以上でSランク
    scoreRankClass.value = "rank-s";
    rank.value = "S";
  } else if (percent >= 75) {
    // 75%以上でAランク
    scoreRankClass.value = "rank-a";
    rank.value = "A";
  } else if (percent >= 60) {
    // 60%以上でBランク
    scoreRankClass.value = "rank-b";
    rank.value = "B";
  } else {
    // 60%未満でCランク
    scoreRankClass.value = "rank-c";
    rank.value = "C";
  }
});
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
    max-width: 600px;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  &__error {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 16, 24);
    text-align: center;
  }

  &__error-message {
    @include fluid-text(12, 16);
    color: $red;
  }

  &__back-button {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
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
    visibility: hidden; // GSAPアニメーション用

    &--profile {
      grid-row: auto;

      @include pc {
        grid-row: 1 / 3;
      }
    }
  }

  &__subtitle {
    @include fluid-text(16, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;

    .en {
      font-family: $roboto-mono;
      letter-spacing: 0;
    }
  }

  &__profile-wrapper {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 20, 24);
    @include fluid-style(padding, 16, 24);
    background-color: $gray;
    border-radius: $radius-lg;

    @include pc {
      justify-content: space-around;
      height: 100%;
    }
  }

  &__profile {
    display: flex;
    justify-content: center;
    align-items: center;
    @include fluid-style(gap, 16, 32);
  }

  &__profile-user-icon {
    width: 6rem;
    fill: $black;

    @include pc {
      width: 8rem;
    }
  }

  &__profile-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    @include fluid-style(gap, 16, 24);
  }

  &__profile-item {
    display: grid;
    @include fluid-style(gap, 4, 8);
  }

  &__profile-heading {
    font-weight: $bold;
    @include fluid-text(12, 14);
    color: $light-black;
  }

  &__profile-value {
    font-weight: $bold;
    @include fluid-text(12, 14);

    &--number {
      font-family: $roboto-mono;
    }
  }

  &__score-card {
    align-self: center;
    display: flex;
    justify-content: center;
    gap: 4rem;
    width: 100%;
    border-radius: $radius-lg;
    background-color: $gray;
  }

  &__score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  &__rank-item {
    position: relative;
    display: grid;
    place-content: center;
    @include fluid-style(width, 90, 108);
    @include fluid-style(height, 90, 108);
  }

  &__rank-circle-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  &__progress-ring {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__progress-ring-background {
    stroke: $light-black;
  }

  &__progress-ring-circle {
    transition: stroke $transition-base;

    &.rank-c {
      stroke: $blue;
    }

    &.rank-b {
      stroke: $green;
    }

    &.rank-a {
      stroke: $orange;
    }

    &.rank-s {
      stroke: $yellow;
    }
  }

  &__rank-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__rank-text {
    font-family: $roboto-mono;
    @include fluid-text(40, 50);
    font-weight: $bold;
    line-height: 1;
    transition: color $transition-base;

    &.rank-s {
      color: $yellow;
    }

    &.rank-a {
      color: $orange;
    }

    &.rank-b {
      color: $green;
    }

    &.rank-c {
      color: $blue;
    }

    &.rank-none {
      color: $light-black;
    }
  }

  &__rank-title {
    font-family: $roboto-mono;
    @include fluid-text(13, 16);
    font-weight: $bold;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  &__stats-card-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    @include fluid-style(gap, 16, 30);

    @include tab {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__stat-card {
    justify-self: center;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    aspect-ratio: 1;
    padding: 1.6rem 0;
    border-radius: $radius-lg;
    background-color: $gray;

    @include pc {
      justify-self: auto;
    }
  }

  &__card-icon {
    @include fluid-style(width, 32, 40);
    line-height: 1;

    &--score {
      stroke: $orange;
    }

    &--kpm {
      fill: $blue;
    }

    &--accuracy {
      fill: $green;
    }

    &--total-type-count {
      fill: $light-black;
    }
  }

  &__card-title {
    @include fluid-text(14, 16);
    font-weight: $bold;
    line-height: 1;
  }

  &__card-value {
    font-family: $roboto-mono;
    @include fluid-text(18, 22);
    font-weight: $bold;
    line-height: 1;

    &--score {
      color: $orange;
    }

    &--kpm {
      color: $blue;
    }

    &--accuracy {
      color: $green;
    }

    &--total-type-count {
      color: $light-black;
    }
  }

  &__no-data {
    @include fluid-text(12, 14);
  }

  &__ranking-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 2.4rem;
    padding: 1.6rem 2.4rem;
    background-color: $gray;
    border-radius: $radius-lg;

    @include pc {
      grid-template-columns: repeat(5, 1fr);
    }
  }

  &__ranking-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  &__ranking-rank {
    font-family: $roboto-mono;
    font-size: 1.4rem;
    font-weight: $bold;
    color: $light-black;
  }

  &__ranking-key {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.5rem;
    height: 4.5rem;
    font-family: $roboto-mono;
    font-size: 1.8rem;
    font-weight: $bold;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $key-shadow;
  }

  &__ranking-count {
    font-family: $roboto-mono;
    font-size: 1.2rem;

    .en {
      font-weight: $bold;
      color: $red;
    }
  }

  &__chart-container,
  &__table-container {
    position: relative;
    width: 100%;
  }

  &__session-loading-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba($white, 0.7);
  }

  &__chart-wrapper {
    overflow-x: auto;
  }

  &__chart {
    width: 100%;
    min-width: 1000px;
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

      .ai {
        color: $orange;
      }

      .db {
        color: $black;
      }
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
      font-size: 1.2rem;
      text-align: center;
    }
  }

  &__detail-link {
    @include button-style-border($black);
    width: 66%;
    margin-inline: auto;
    padding: 1em 0;
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  @include pagination-style;
  &__pagination-container {
    margin-top: 2rem;
  }
}
</style>