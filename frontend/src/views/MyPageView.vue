<template>
  <div class="mypage-view">
    <h1 class="mypage-view__title">
      <span class="en" aria-hidden="true">MYPAGE</span>
      <span class="ja">マイページ</span>
    </h1>

    <div class="mypage-view__contents-wrapper" ref="mypageWrapperRef">
      <template v-if="isContentsLoading">
        <Loading
          class="mypage-view__loading"
          :text="'統計データ読み込み中です…'"
        />
      </template>

      <template v-else-if="errorMessage">
        <div class="mypage-view__error" role="alert">
          <p class="mypage-view__error-message">
            {{ errorMessage }}
          </p>
          <RouterLink to="/menu" class="mypage-view__back-button">
            メインメニューに戻る<ArrowIcon
              class="mypage-view__arrow-icon"
              aria-hidden="true"
            />
          </RouterLink>
        </div>
      </template>

      <template v-else>
        <div class="mypage-view__top-grid-wrapper">
          <section
            class="mypage-view__section mypage-view__section--profile"
            aria-labelledby="profile-heading"
          >
            <h2 id="profile-heading" class="mypage-view__subtitle">
              プロフィール
            </h2>
            <div class="mypage-view__profile-wrapper">
              <div class="mypage-view__profile">
                <UserIcon
                  class="mypage-view__profile-user-icon"
                  aria-hidden="true"
                />
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
                    aria-hidden="true"
                  />
                  <span class="mypage-view__card-title">総合スコア</span>
                  <span
                    class="mypage-view__card-value mypage-view__card-value--score"
                  >
                    {{ score }}
                  </span>
                </div>
                <ScoreRankCircle ref="scoreRankCircleRef" :score="score" />
              </div>
            </div>
          </section>

          <section
            class="mypage-view__section mypage-view__section--play-data"
            aria-labelledby="play-data-heading"
          >
            <h2 id="play-data-heading" class="mypage-view__subtitle">
              プレイデータ
            </h2>
            <div class="mypage-view__stats-card-wrapper">
              <div class="mypage-view__stat-card">
                <KpmIcon
                  class="mypage-view__card-icon mypage-view__card-icon--kpm"
                  aria-hidden="true"
                />
                <span class="mypage-view__card-title">平均 KPM</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--kpm"
                >
                  {{ stats.total_types === 0 ? "-" : stats.average_kpm }}
                </span>
              </div>
              <div class="mypage-view__stat-card">
                <AccuracyIcon
                  class="mypage-view__card-icon mypage-view__card-icon--accuracy"
                  aria-hidden="true"
                />
                <span class="mypage-view__card-title">平均 正確率</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--accuracy"
                >
                  {{
                    stats.total_types === 0 ? "-" : `${stats.average_accuracy}%`
                  }}
                </span>
              </div>
              <div class="mypage-view__stat-card">
                <TotalTypeCountIcon
                  class="mypage-view__card-icon mypage-view__card-icon--total-type-count"
                  aria-hidden="true"
                />
                <span class="mypage-view__card-title">総タイプ数</span>
                <span
                  class="mypage-view__card-value mypage-view__card-value--total-type-count"
                >
                  {{
                    stats.total_types === 0
                      ? "-"
                      : stats.total_types.toLocaleString()
                  }}
                </span>
              </div>
            </div>
          </section>

          <section
            class="mypage-view__section mypage-view__section--weak-keys"
            aria-labelledby="weak-keys-heading"
          >
            <h2 id="weak-keys-heading" class="mypage-view__subtitle">
              苦手なキー<span class="en" aria-hidden="true">(Top5)</span>
            </h2>
            <div
              v-if="stats.missed_keys_ranking.length === 0"
              class="mypage-view__no-data"
            >
              {{ NO_HISTORY_MESSAGE }}
            </div>
            <div v-else class="mypage-view__ranking-wrapper">
              <div
                v-for="(item, index) in stats.missed_keys_ranking"
                :key="item.key"
                class="mypage-view__ranking-item"
              >
                <div class="mypage-view__ranking-rank">{{ index + 1 }}</div>
                <div class="mypage-view__ranking-key">
                  {{ item.key }}
                </div>
                <div class="mypage-view__ranking-count">
                  <span class="number">{{ item.count }}</span> miss
                </div>
              </div>
            </div>
          </section>
        </div>

        <section
          class="mypage-view__section mypage-view__section--chart"
          aria-labelledby="chart-heading"
        >
          <h2 id="chart-heading" class="mypage-view__subtitle">成長グラフ</h2>
          <div v-if="sessions.length === 0" class="mypage-view__no-data">
            {{ NO_HISTORY_MESSAGE }}
          </div>
          <div v-else class="mypage-view__chart-container">
            <ScrollHint :show="!isChartHidden" />
            <div
              v-if="isSessionLoading"
              class="mypage-view__session-loading-overlay"
            >
              <Loading />
            </div>
            <Simplebar
              class="mypage-view__chart-wrapper"
              ref="chartScrollRef"
              @scroll="handleChartScroll"
              :auto-hide="false"
            >
              <GrowthChart class="mypage-view__chart" :sessions="sessions" />
            </Simplebar>
          </div>
        </section>

        <section
          class="mypage-view__section mypage-view__section--history"
          aria-labelledby="history-heading"
        >
          <h2 id="history-heading" class="mypage-view__subtitle">プレイ履歴</h2>
          <div v-if="sessions.length === 0" class="mypage-view__no-data">
            {{ NO_HISTORY_MESSAGE }}
          </div>
          <template v-else>
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="handlePageChange"
            />

            <div class="mypage-view__table-container">
              <ScrollHint :show="!isTableHidden" />
              <div
                v-if="isSessionLoading"
                class="mypage-view__session-loading-overlay"
              >
                <Loading />
              </div>
              <Simplebar
                class="mypage-view__table-wrapper"
                ref="tableScrollRef"
                @scroll="handleTableScroll"
                :auto-hide="false"
              >
                <table class="mypage-view__table">
                  <thead>
                    <tr>
                      <th class="col-date">日時</th>
                      <th class="col-mode">モード(AI or DB): お題</th>
                      <th class="col-kpm">KPM</th>
                      <th class="col-acc">正確率</th>
                      <th class="col-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="session in sessions" :key="session.id">
                      <td class="col-date">
                        {{ formatDate(session.created_at) }}
                      </td>
                      <td class="col-mode">
                        <span v-if="session.session_type === 'db'" class="db">
                          DB:
                          {{ session.genre ? session.genre.name : "削除済" }}
                        </span>
                        <span v-else class="ai">
                          AI: {{ truncateText(session.gemini_prompt, 15) }}
                        </span>
                      </td>
                      <td class="col-kpm">
                        {{ Math.round(session.average_kpm) }}
                      </td>
                      <td class="col-acc">
                        {{ Math.round(session.average_accuracy) }}%
                      </td>
                      <td class="col-action">
                        <RouterLink
                          :to="`/mypage/session/${session.id}`"
                          class="mypage-view__detail-link"
                          :aria-label="`${formatDate(
                            session.created_at
                          )}のプレイ詳細を見る`"
                        >
                          詳細
                          <ArrowIcon
                            class="mypage-view__arrow-icon"
                            aria-hidden="true"
                          />
                        </RouterLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Simplebar>
            </div>

            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="handlePageChange"
            />
          </template>
          <div class="mypage-view__back">
            <RouterLink to="/menu" class="mypage-view__back-button">
              メインメニューに戻る<ArrowIcon
                class="mypage-view__arrow-icon"
                aria-hidden="true"
              />
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useRouter, RouterLink } from "vue-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// --- Services & Utilities ---
import api from "../services/api";
import { formatDate, truncateText } from "../utils/formatters";

// --- Stores ---
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

// --- Composables ---
import { useScrollHint } from "../composables/useScrollHint";

// --- Components ---
import Pagination from "@/components/Pagination.vue";
import ScoreRankCircle from "@/components/ScoreRankCircle.vue";
import GrowthChart from "../components/GrowthChart.vue";
import Loading from "@/components/Loading.vue";
import Simplebar from "simplebar-vue";
import ScrollHint from "@/components/ScrollHint.vue";

// --- Icons ---
import KpmIcon from "@/components/icons/KpmIcon.vue";
import AccuracyIcon from "@/components/icons/AccuracyIcon.vue";
import TotalTypeCountIcon from "@/components/icons/TotalTypeCountIcon.vue";
import ScoreIcon from "@/components/icons/ScoreIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// GSAPプラグインの登録
gsap.registerPlugin(ScrollTrigger);

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
 * 履歴がない場合のメッセージ
 * @type {string}
 */
const NO_HISTORY_MESSAGE = "まだ履歴がありません。たくさん遊んでね！";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * routerインスタンス
 * @type {import('vue-router').Router}
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
 * ページ全体のローディング状態
 * @type {import('vue').Ref<boolean>}
 */
const isContentsLoading = ref(false);

/**
 * グラフと表のローディング状態（ページネーション切り替え時用）
 * @type {import('vue').Ref<boolean>}
 */
const isSessionLoading = ref(false);

/**
 * APIエラー時のメッセージ
 * @type {import('vue').Ref<string>}
 */
const errorMessage = ref("");

/**
 * 統計データ
 * @type {import('vue').Ref<{ total_types: number, average_kpm: number, average_accuracy: number, missed_keys_ranking: Array<Object>, first_play_at: string|null, latest_play_at: string|null }>}
 */
const stats = ref({
  total_types: 0,
  average_kpm: 0,
  average_accuracy: 0,
  missed_keys_ranking: [],
  first_play_at: null,
  latest_play_at: null,
});

/**
 * 履歴データ一覧
 * @type {import('vue').Ref<Array<Object>>}
 */
const sessions = ref([]);

/**
 * 履歴データページネーションの現在のページ数
 * @type {import('vue').Ref<number>}
 */
const currentPage = ref(1);

/**
 * 履歴データ総件数
 * @type {import('vue').Ref<number>}
 */
const totalCount = ref(0);

/**
 * 履歴データページネーションの総ページ数
 * @type {import('vue').Ref<number>}
 */
const totalPages = ref(1);

// =========================================================================
// DOM / コンポーネント参照 (Refs)
// =========================================================================

/**
 * GSAPアニメーションのスコープ設定用ラッパー
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const mypageWrapperRef = ref(null);

/**
 * ScoreRankCircleコンポーネントのメソッド呼び出し用
 * @type {import('vue').Ref<any>}
 */
const scoreRankCircleRef = ref(null);

// =========================================================================
// Composables 呼び出し
// =========================================================================

/**
 * グラフ用横スクロールヒント管理
 */
const {
  isHidden: isChartHidden,
  scrollRef: chartScrollRef,
  handleScroll: handleChartScroll,
  resetScroll: resetChartScroll,
} = useScrollHint();

/**
 * テーブル用横スクロールヒント管理
 */
const {
  isHidden: isTableHidden,
  scrollRef: tableScrollRef,
  handleScroll: handleTableScroll,
  resetScroll: resetTableScroll,
} = useScrollHint();

// =========================================================================
// Computed (計算プロパティ)
// =========================================================================

/**
 * スコア値の算出 (KPM * (正確率 / 100)^3)
 * @type {import('vue').ComputedRef<number|string>}
 */
const score = computed(() => {
  if (stats.value.average_kpm === 0 && stats.value.average_accuracy === 0)
    return "-";
  const kpm = stats.value.average_kpm;
  const acc = stats.value.average_accuracy;
  return Math.round(kpm * (acc / 100) ** 3);
});

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * 統計データの取得処理
 * @returns {Promise<void>}
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
 * 履歴データの取得処理 (ページ指定)
 * @param {number} page - 取得するページ番号
 * @returns {Promise<void>}
 */
const fetchSessions = async (page) => {
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

    // データが切り替わったらスクロール位置をリセット
    resetChartScroll();
    resetTableScroll();
  } catch (error) {
    notificationStore.addNotification("履歴の取得に失敗しました", "error");
    throw error;
  } finally {
    isSessionLoading.value = false;
  }
};

/**
 * ページ切り替えイベントのハンドラー
 * @param {number} page - 切り替え先のページ番号
 * @returns {Promise<void>}
 */
const handlePageChange = async (page) => {
  try {
    await fetchSessions(page);
  } catch (error) {
    // エラーハンドリングは fetchSessions 内部で行うためスキップ
  }
};

// =========================================================================
// GSAP アニメーション制御
// =========================================================================

/**
 * GSAPコンテキスト (アンマウント時のクリーンアップ用)
 * @type {import('gsap').Context}
 */
let gsapContext;

/**
 * GSAPアニメーションのセットアップ処理
 * @returns {void}
 */
const setAnimation = () => {
  // アニメーション共通設定：開始状態
  const fromAnimationSettings = { autoAlpha: 0, y: 20 };

  // アニメーション共通設定：終了状態
  const toAnimationSettings = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
  };

  gsapContext = gsap.context(() => {
    // スクロールコンテナの取得
    const scrollContainer = document.querySelector(
      "#app-main-scroll .simplebar-content-wrapper"
    );

    // 各セクションのクラス名
    const profileSection = ".mypage-view__section--profile";
    const playDataSection = ".mypage-view__section--play-data";
    const weakKeysSection = ".mypage-view__section--weak-keys";
    const chartSection = ".mypage-view__section--chart";
    const historySection = ".mypage-view__section--history";

    // プロフィール以外の各セクションのスクロール連動表示
    [playDataSection, weakKeysSection, chartSection, historySection].forEach(
      (section) => {
        gsap.fromTo(
          section,
          { ...fromAnimationSettings },
          {
            ...toAnimationSettings,
            scrollTrigger: {
              trigger: section,
              scroller: scrollContainer,
              start: "top center+=20%",
            },
          }
        );
      }
    );

    // プロフィールセクションとスコア円の連動タイムライン
    const timelineProfileSection = gsap.timeline({
      scrollTrigger: {
        trigger: profileSection,
        scroller: scrollContainer,
        start: "top center+=20%",
      },
    });

    timelineProfileSection.fromTo(
      profileSection,
      { ...fromAnimationSettings },
      { ...toAnimationSettings }
    );

    timelineProfileSection.add(() => {
      if (scoreRankCircleRef.value) {
        scoreRankCircleRef.value.playAnimation();
      }
    }, "-=0.6");
  }, mypageWrapperRef.value);
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(async () => {
  isContentsLoading.value = true;

  try {
    await Promise.all([
      fetchStats(),
      fetchSessions(1),
      new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
  } catch (error) {
    errorMessage.value = "データの取得に失敗しました。";
  } finally {
    isContentsLoading.value = false;

    // DOMの描画完了を待ってからアニメーションをセット
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
  // コンポーネントが破棄される時にGSAPのアニメーションをリセットし、メモリリークを防ぐ
  if (gsapContext) {
    gsapContext.revert();
  }
});
</script>

<style lang="scss" scoped>
/* =========================================================================
 * マイページ 全体レイアウト
 * ========================================================================= */
.mypage-view {
  @include contents-width;

  @include pc {
    max-width: 100rem;
  }

  &__title {
    @include page-title;
  }

  &__contents-wrapper {
    @include fluid-style(gap, 24, 32);
    @include contents-padding;

    display: flex;
    flex-direction: column;
    max-width: 60rem;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  /* --- 共通ステータス表示 --- */
  &__error {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    text-align: center;
  }

  &__error-message {
    @include fluid-text(12, 16);

    color: $red;
  }

  &__no-data {
    @include fluid-text(12, 14);
  }

  &__back-button,
  &__detail-link {
    @include button-style-fill($green);
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;
  }

  &__detail-link {
    @include button-style-border($black);

    width: 75%;
    padding: 1em 0;
    font-size: 1.2rem;
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  /* =========================================================================
   * 各セクションレイアウト
   * ========================================================================= */
  &__top-grid-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    @include pc {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.2rem 4rem;
    }
  }

  &__section {
    @include fluid-style(gap, 10, 16);

    display: flex;
    visibility: hidden; /* GSAPアニメーション用 */
    flex-direction: column;

    &--profile {
      position: relative;
      z-index: $z-toast;
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

  /* =========================================================================
   * プロフィール (Profile)
   * ========================================================================= */
  &__profile-wrapper {
    @include fluid-style(gap, 20, 24);
    @include fluid-style(padding, 16, 24);

    display: flex;
    flex-direction: column;
    background-color: $gray;
    border-radius: $radius-lg;

    @include pc {
      justify-content: space-around;
      height: 100%;
    }
  }

  &__profile {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    align-items: center;
    justify-content: center;

    @include tab {
      flex-direction: row;
    }
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
    gap: 2.4rem;
  }

  &__profile-item {
    @include fluid-style(gap, 4, 8);

    display: grid;
  }

  &__profile-heading {
    @include fluid-text(12, 14);

    font-weight: $bold;
    color: $light-black;
  }

  &__profile-value {
    @include fluid-text(12, 14);

    font-weight: $bold;

    &--number {
      font-family: $roboto-mono;
    }
  }

  /* =========================================================================
   * スコアカード / プレイデータカード群
   * ========================================================================= */
  &__score-card {
    display: flex;
    gap: 4rem;
    justify-content: center;
    width: 100%;
    background-color: $gray;
    border-radius: $radius-lg;
  }

  &__score-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
  }

  &__stats-card-wrapper {
    @include fluid-style(gap, 16, 30);

    display: grid;
    grid-template-columns: repeat(2, 1fr);

    @include tab {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    aspect-ratio: 1;
    padding: 2.4rem 0;
    background-color: $gray;
    border-radius: $radius-lg;

    @include pc {
      padding: 1.6rem 0;
    }
  }

  &__card-icon {
    @include fluid-style(width, 34, 40);

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
    @include fluid-text(18, 22);

    font-family: $roboto-mono;
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

  /* =========================================================================
   * 苦手キー ランキング
   * ========================================================================= */
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
    gap: 1rem;
    align-items: center;
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

    .number {
      font-weight: $bold;
      color: $red;
    }
  }

  /* =========================================================================
   * 成長グラフ & プレイ履歴テーブル (Simplebar領域)
   * ========================================================================= */
  &__chart-container,
  &__table-container {
    position: relative;
    width: 100%;
  }

  &__session-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    z-index: $z-loading-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $loading-overlay-color;
  }

  &__chart-wrapper,
  &__table-wrapper {
    /* スクロールバーと中身が被らないように少し下余白を入れる */
    padding-bottom: 1.6rem;

    /* Simplebarの横スクロールバー(horizontal)をカスタマイズ */
    &::v-deep(.simplebar-track.simplebar-horizontal) {
      @include fluid-style(height, 9, 11);

      .simplebar-scrollbar::before {
        background-color: $blue;
        opacity: 1;
      }
    }

    /* PC表示ではスクロールバーが非表示な為、余白は0 */
    @include pc {
      padding-bottom: 0;
    }
  }

  &__chart {
    width: 100%;
    min-width: 100rem;
  }

  &__table {
    @include table-style;

    /* --- 列ごとの幅やテキスト寄せの共通設定 --- */
    .col-date {
      width: 25%;
    }

    .col-mode {
      width: 40%;
    }

    .col-kpm {
      width: 10%;
      font-family: $roboto-mono;
      text-align: right;
    }

    .col-acc {
      width: 10%;
      text-align: right;
    }

    .col-action {
      width: 15%;
      text-align: center;
    }

    /* --- 各要素の個別装飾 --- */
    th {
      &.col-kpm {
        letter-spacing: 0.05em;
      }
    }

    td {
      &.col-date {
        font-family: $roboto-mono;
      }

      &.col-mode {
        .ai {
          color: $orange;
        }

        .db {
          color: $black;
        }
      }

      &.col-kpm {
        color: $blue;
      }

      &.col-acc {
        font-family: $roboto-mono;
        color: $green;
      }
    }
  }
}
</style>