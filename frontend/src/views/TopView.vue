<template>
  <div class="top-view" ref="topWrapper">
    <section class="top-view__hero">
      <h1 class="top-view__title">GeminiType</h1>
      <p class="top-view__subtitle">
        <span class="top-view__highlight">AI(Gemini)</span>と一緒に、<br
          class="top-view__br"
        />タイピングを楽しく練習しよう！
      </p>

      <div v-if="authStore.isLoggedIn" class="top-view__actions">
        <p class="top-view__welcome">
          おかえりなさい、{{ authStore.user?.name }} さん！
        </p>
        <RouterLink to="/menu" class="top-view__button top-view__button--menu">
          メインメニューへ進む
          <ArrowIcon class="top-view__arrow-icon" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-else class="top-view__actions">
        <RouterLink to="/menu" class="top-view__button top-view__button--guest">
          ゲストで遊ぶ (登録なし)
          <ArrowIcon class="top-view__arrow-icon" aria-hidden="true" />
        </RouterLink>

        <div class="top-view__sub-actions">
          <RouterLink
            to="/login"
            class="top-view__button top-view__button--small"
            >ログイン
            <ArrowIcon class="top-view__arrow-icon" aria-hidden="true"
          /></RouterLink>
          <RouterLink
            to="/register"
            class="top-view__button top-view__button--small"
            >ユーザー登録
            <ArrowIcon class="top-view__arrow-icon" aria-hidden="true"
          /></RouterLink>
        </div>
      </div>

      <div class="top-view__scroll-indicator" aria-hidden="true">
        <span class="top-view__scroll-text">SCROLL</span>
        <div class="top-view__scroll-line-wrapper">
          <div class="top-view__scroll-line"></div>
        </div>
      </div>
    </section>

    <section class="top-view__features">
      <h2 class="top-view__features-title">特長</h2>
      <div class="top-view__features-grid">
        <div class="top-view__feature">
          <h3 class="top-view__feature-subtitle">AI問題生成モード</h3>
          <Transition name="fade" mode="out-in">
            <div v-if="!isAiModeDetail" class="top-view__feature-content">
              <p class="top-view__catchcopy">
                無限に広がる、あなただけの練習問題
              </p>
              <img
                class="top-view__image"
                src="@/assets/images/top/feature-1.webp"
                loading="lazy"
                alt="AI問題生成のイメージ"
              />
            </div>
            <div v-else class="top-view__feature-content">
              <p class="top-view__text">
                「好きな言葉」がそのまま練習問題に。「アニメ」「プログラミング」など、テーマはあなたの自由自在！
              </p>
              <p class="top-view__text">
                最新AI (Gemini)
                が毎回違う文章を作ってくれるから、もう「同じ問題ばかりで飽きた」なんて言わせません。
              </p>
              <p class="top-view__text">
                興味のあるテーマだから練習が続く。あなただけのオリジナル問題集で、楽しくタイピングをマスターしよう！
              </p>
            </div>
          </Transition>
          <button
            type="button"
            class="top-view__circle-button"
            @click="isAiModeDetail = !isAiModeDetail"
            :aria-expanded="isAiModeDetail"
            aria-label="機能の詳細を切り替える"
          >
            <span
              class="top-view__circle"
              :class="{ 'is-active': isAiModeDetail }"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <div class="top-view__feature">
          <h3 class="top-view__feature-subtitle">成長記録</h3>
          <Transition name="fade" mode="out-in">
            <div v-if="!isProgressDetail" class="top-view__feature-content">
              <p class="top-view__catchcopy">昨日の自分より、ちょっと速く</p>
              <img
                class="top-view__image"
                src="@/assets/images/top/feature-2.webp"
                loading="lazy"
                alt="成長記録のイメージ"
              />
            </div>
            <div v-else class="top-view__feature-content">
              <p class="top-view__text">
                毎日の頑張りを美しいグラフで見える化。「先週より速くなった！」という成長がひと目で分かります。
              </p>
              <p class="top-view__text">
                「KPM（1分間の打鍵数）」や「正確率」を自動で記録。自分の実力が数値になるから、モチベーションが続く！
              </p>
              <p class="top-view__text">
                苦手なキーも過去のデータから集計・ランキング化。弱点をピンポイントで克服して、最短距離で上達しちゃおう！
              </p>
            </div>
          </Transition>
          <button
            type="button"
            class="top-view__circle-button"
            @click="isProgressDetail = !isProgressDetail"
            :aria-expanded="isProgressDetail"
            aria-label="機能の詳細を切り替える"
          >
            <span
              class="top-view__circle"
              :class="{ 'is-active': isProgressDetail }"
              aria-hidden="true"
            ></span>
          </button>
        </div>

        <div class="top-view__feature">
          <h3 class="top-view__feature-subtitle">ストレスフリーな入力判定</h3>
          <Transition name="fade" mode="out-in">
            <div v-if="!isStressFreeDetail" class="top-view__feature-content">
              <p class="top-view__catchcopy">
                ルールに縛られない、快適な打ち心地
              </p>
              <img
                class="top-view__image"
                src="@/assets/images/top/feature-3.webp"
                loading="lazy"
                alt="ストレスフリーな入力判定のイメージ"
              />
            </div>
            <div v-else class="top-view__feature-content">
              <p class="top-view__text">
                「し」の [si] [shi] [ci] や、「ち」の [ti] [chi]
                など、複数の入力パターンをしっかりカバーしています！
              </p>
              <p class="top-view__text">
                途中で入力のクセが出ても大丈夫。細かいルールにイライラすることなく、タイピングの勢いを止めずにスピードを追求できます。
              </p>
              <p class="top-view__text">
                こだわり抜いた柔軟な入力判定が、あなたの指の動きにしっかり寄り添い、最高に気持ちいいタイピング体験を届けます。
              </p>
            </div>
          </Transition>
          <button
            type="button"
            class="top-view__circle-button"
            @click="isStressFreeDetail = !isStressFreeDetail"
            :aria-expanded="isStressFreeDetail"
            aria-label="機能の詳細を切り替える"
          >
            <span
              class="top-view__circle"
              :class="{ 'is-active': isStressFreeDetail }"
              aria-hidden="true"
            ></span>
          </button>
        </div>
      </div>
    </section>

    <section class="top-view__gallery">
      <div
        class="top-view__horizontal-scroll-wrapper"
        ref="horizontalScrollWrapper"
      >
        <div class="top-view__slide-wrapper" ref="slideWrapper">
          <div class="top-view__slide">
            <div class="top-view__slide-inner">
              <h3 class="top-view__slide-title">基本を学ぶ「通常モード」</h3>
              <img
                src="@/assets/images/top/gallery-1.webp"
                loading="lazy"
                alt="通常モードタイピング画面"
                class="top-view__slide-image"
              />
              <p class="top-view__slide-description">
                画面上のキーボードと運指ガイドが、正しい指の配置をしっかりサポート！<br />まずは自分のペースで、正確なタイピングの基礎を楽しく身につけましょう。
              </p>
            </div>
          </div>

          <div class="top-view__slide">
            <div class="top-view__slide-inner">
              <h3 class="top-view__slide-title">
                「特殊モード」で限界に挑戦！
              </h3>
              <img
                src="@/assets/images/top/gallery-2.webp"
                loading="lazy"
                alt="特殊モードタイピング画面"
                class="top-view__slide-image"
              />
              <p class="top-view__slide-description">
                速さ勝負の「時間制限」と、ミスが許されない「サドンデス」を搭載！<br />ゲーム感覚で楽しみながら正確さと速さを鍛え、自分のスキルの限界を突破しよう！
              </p>
            </div>
          </div>

          <div class="top-view__slide">
            <div class="top-view__slide-inner">
              <h3 class="top-view__slide-title">
                AIコーチからのフィードバック
              </h3>
              <img
                src="@/assets/images/top/gallery-3.webp"
                loading="lazy"
                alt="タイピング結果画面"
                class="top-view__slide-image"
              />
              <p class="top-view__slide-description">
                プレイ後はスコアやランクと一緒に、AIからのパーソナルなアドバイスがもらえます。<br />
                あなたの頑張りをしっかり分析して、ポジティブに可愛く応援してくれます！
              </p>
            </div>
          </div>

          <div class="top-view__slide">
            <div class="top-view__slide-inner">
              <h3 class="top-view__slide-title">成長が目に見えるマイページ</h3>
              <img
                src="@/assets/images/top/gallery-4.webp"
                loading="lazy"
                alt="マイページの成長グラフ"
                class="top-view__slide-image"
              />
              <p class="top-view__slide-description">
                KPMや正確率の推移が分かる「成長グラフ」で、日々の頑張りをしっかり可視化！<br />過去のデータから算出した「苦手キーランキング」で、弱点もひと目で把握できます。
              </p>
            </div>
          </div>

          <div class="top-view__slide">
            <div class="top-view__slide-inner">
              <h3 class="top-view__slide-title">弱点を克服する詳細データ</h3>
              <img
                src="@/assets/images/top/gallery-5.webp"
                loading="lazy"
                alt="詳細履歴と試し打ち"
                class="top-view__slide-image"
              />
              <p class="top-view__slide-description">
                プレイごとのスコアや「どの問題でどのキーをミスしたか」を細かく振り返り！<br />ミスした問題を練習できる「試し打ち」機能で、ピンポイントに弱点を克服できます。
              </p>
            </div>
          </div>
        </div>
        <div class="top-view__progress-bar-wrapper">
          <div class="top-view__progress-segment" v-for="i in 5" :key="i">
            <div class="top-view__progress-fill"></div>
          </div>
        </div>
      </div>
    </section>

    <div class="top-view__actions top-view__actions--last">
      <p class="top-view__subtitle">
        <span class="top-view__highlight">GeminiType</span>で、<br
          class="top-view__br"
        />タイピング練習！
      </p>

      <template v-if="authStore.isLoggedIn">
        <RouterLink to="/menu" class="top-view__button top-view__button--menu">
          メインメニューへ進む
          <ArrowIcon class="top-view__arrow-icon" aria-hidden="true" />
        </RouterLink>
      </template>

      <template v-else>
        <RouterLink to="/menu" class="top-view__button top-view__button--guest">
          ゲストで遊ぶ (登録なし)
          <ArrowIcon class="top-view__arrow-icon" aria-hidden="true" />
        </RouterLink>

        <div class="top-view__sub-actions">
          <RouterLink
            to="/login"
            class="top-view__button top-view__button--small"
            >ログイン
            <ArrowIcon class="top-view__arrow-icon" aria-hidden="true"
          /></RouterLink>
          <RouterLink
            to="/register"
            class="top-view__button top-view__button--small"
            >ユーザー登録
            <ArrowIcon class="top-view__arrow-icon" aria-hidden="true"
          /></RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

// --- Stores ---
import { useAuthStore } from "../stores/authStore";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// GSAPプラグインの登録
gsap.registerPlugin(ScrollTrigger);

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * 「AI問題生成モード」詳細表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isAiModeDetail = ref(false);

/**
 * 「成長記録」詳細表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isProgressDetail = ref(false);

/**
 * 「ストレスフリーな入力判定」詳細表示・非表示
 * @type {import('vue').Ref<boolean>}
 */
const isStressFreeDetail = ref(false);

// --- GSAPアニメーション用 DOM参照 (Refs) ---

/**
 * 全体ラッパー要素参照
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const topWrapper = ref(null);

/**
 * 横スクロール要素参照
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const horizontalScrollWrapper = ref(null);

/**
 * スライドラッパー参照
 * @type {import('vue').Ref<HTMLElement|null>}
 */
const slideWrapper = ref(null);

/**
 * GSAPコンテキスト (アンマウント時のクリーンアップ用)
 * @type {import('gsap').Context}
 */
let gsapContext;

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * GSAPアニメーションのセットアップ処理
 * @returns {void}
 */
const setAnimation = () => {
  // アニメーション共通設定：開始状態 (下からフワッと現れる準備)
  const fromAnimationSettings = {
    autoAlpha: 0,
    y: 20,
  };

  // アニメーション共通設定：終了状態 (元の位置に戻って不透明になる)
  const toAnimationSettings = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    ease: "power2.out",
  };

  // CSS変数の値をブラウザの :root から取得する
  const style = getComputedStyle(document.documentElement);
  const bgColors = {
    gray: style.getPropertyValue("--color-bg-gray").trim(),
    green: style.getPropertyValue("--color-bg-green").trim(),
    orange: style.getPropertyValue("--color-bg-orange").trim(),
    blue: style.getPropertyValue("--color-bg-blue").trim(),
    yellow: style.getPropertyValue("--color-bg-yellow").trim(),
  };

  // GSAPアニメーションをContextで囲む（Vueのコンポーネント破棄時に一括解除するため）
  gsapContext = gsap.context(() => {
    // App.vue側にある「Simplebarのスクロール要素」を直接取得して、ScrollTriggerの基準にする
    const scrollContainer = document.querySelector(
      "#app-main-scroll .simplebar-content-wrapper"
    );

    // --- 特長セクションの表示アニメーション ---
    const featuresSection = ".top-view__features";
    gsap.fromTo(
      featuresSection,
      { ...fromAnimationSettings },
      {
        ...toAnimationSettings,
        scrollTrigger: {
          trigger: featuresSection,
          scroller: scrollContainer,
          start: "top center", // 画面の中央に要素のトップが来たら発火
        },
      }
    );

    // --- ギャラリーセクションの表示アニメーション ---
    // この要素は後でピン留め(pin)されるため、位置(y)は動かさず autoAlpha(透明度) のみで表示させる
    gsap.fromTo(
      horizontalScrollWrapper.value,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: horizontalScrollWrapper.value,
          scroller: scrollContainer,
          start: "top center",
        },
      }
    );

    // --- 横スクロールアニメーション ---
    const slides = gsap.utils.toArray(".top-view__slide");
    const fills = gsap.utils.toArray(".top-view__progress-fill");

    // ScrollTriggerと連動するタイムラインを作成
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: horizontalScrollWrapper.value,
        scroller: scrollContainer,
        pin: true, // 画面に固定（ピン留め）
        pinType: "fixed",
        scrub: 1, // スクロール量に合わせて滑らかに動かす
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // スライドの合計幅だけスクロールしたらピン留めを解除する
        end: () => "+=" + window.innerWidth * (slides.length - 1),
      },
    });

    // スライドを横に動かすアニメーション
    tl.to(
      slides,
      {
        xPercent: -100 * (slides.length - 1),
        ease: "none",
        duration: slides.length - 1,
      },
      0
    );

    // スライド背景色をグラデーションのように変化させる
    tl.to(
      slideWrapper.value,
      {
        keyframes: [
          { backgroundColor: bgColors.blue, duration: 1 }, // 2枚目へ向かう時
          { backgroundColor: bgColors.green, duration: 1 }, // 3枚目へ向かう時
          { backgroundColor: bgColors.yellow, duration: 1 }, // 4枚目へ向かう時
          { backgroundColor: bgColors.orange, duration: 1 }, // 5枚目へ向かう時
        ],
        ease: "none",
      },
      0
    );

    // 進行度を示すプログレスバーのアニメーション
    const fillDuration = (slides.length - 1) / fills.length;
    tl.to(
      fills,
      {
        scaleX: 1,
        ease: "none",
        duration: fillDuration,
        stagger: fillDuration,
      },
      0
    );

    // --- ページ下部アクションボタンの表示アニメーション ---
    const back = ".top-view__actions--last";
    gsap.fromTo(
      back,
      { ...fromAnimationSettings },
      {
        ...toAnimationSettings,
        scrollTrigger: {
          trigger: back,
          scroller: scrollContainer,
          start: "top center",
        },
      }
    );
  }, topWrapper.value);
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(() => {
  setAnimation();
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
.top-view {
  @include contents-width;
  @include fluid-style(gap, 40, 120);
  @include fluid-style(padding-bottom, 64, 120);

  $parent: &;

  display: flex;
  flex-direction: column;

  /* =======================================================================
   * Hero セクション
   * ======================================================================= */
  &__hero {
    @include full-width-style;
    @include fluid-style(gap, 32, 48);

    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100svh;

    /* ヘッダーの高さ分だけ上に引き上げて、画面のど真ん中に配置する */
    margin-top: -$header-height-sp;

    @include tab {
      margin-top: -$header-height-tab;
    }

    @include pc {
      margin-top: -$header-height-pc;
    }
  }

  &__title {
    @include fluid-text(40, 64);

    font-family: $roboto-mono;
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__subtitle {
    @include fluid-text(20, 32);

    font-weight: $bold;
    line-height: 1.8;
    text-align: center;
    letter-spacing: 0.05em;
  }

  &__highlight {
    color: $green;
  }

  &__br {
    @include pc {
      display: none;
    }
  }

  &__actions {
    @include fluid-style(gap, 24, 48);

    display: flex;
    flex-direction: column;
    align-items: center;

    &--last {
      visibility: hidden; // GSAPの初期状態アニメーション用
    }
  }

  &__welcome {
    @include fluid-text(14, 18);

    font-weight: $bold;
    color: $blue;
    letter-spacing: 0.1em;
  }

  &__button {
    @include fluid-style(width, 276, 432);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    &--menu,
    &--guest {
      @include button-style-fill($green);
    }

    &--small {
      @include button-style-border($blue);
      @include fluid-style(width, 130, 200);
      @include fluid-style(padding-block, 16, 20);
      @include fluid-text(12, 16);
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__sub-actions {
    @include fluid-style(gap, 16, 32);

    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__scroll-indicator {
    position: absolute;
    bottom: 2.4rem;
    left: 50%;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    align-items: center;
    opacity: 0;
    transform: translateX(-50%);

    /* 画面が開いてから0.5秒後に、フワッと表示させる */
    animation: indicator-fade-in 1s ease-out 0.5s forwards;

    @include pc {
      bottom: 4rem;
    }
  }

  &__scroll-text {
    @include fluid-text(10, 12);

    font-family: $roboto-mono;
    font-weight: $bold;
    color: $green;
    letter-spacing: 0.2em;
  }

  &__scroll-line-wrapper {
    position: relative;
    width: 2px;
    height: 4.8rem;
    overflow: hidden;
    background-color: rgba($black, 0.1);
    border-radius: 100vmax;

    @include pc {
      height: 6.4rem;
    }
  }

  &__scroll-line {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background-color: $green;

    /* 上から下へスーッと落ちるループアニメーション */
    animation: scroll-down-drop 2s cubic-bezier(0.77, 0, 0.175, 1) infinite;
  }

  /* =======================================================================
   * Features セクション
   * ======================================================================= */
  &__features {
    @include fluid-style(gap, 32, 48);

    display: flex;
    visibility: hidden; // GSAP用
    flex-direction: column;
    align-items: center;
  }

  &__features-title {
    @include fluid-text(24, 32);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.4rem;
    width: 100%;
    max-width: 38rem;

    @include pc {
      grid-template-columns: repeat(3, 1fr);
      gap: 9.8rem;
      max-width: none;
    }
  }

  &__feature {
    @include fluid-style(gap, 24, 28);

    position: relative;
    display: flex;
    flex-direction: column;
    aspect-ratio: 335 / 472;
    padding: 2.4rem;
    background-color: $gray;
    border-radius: $radius-lg;
    transition: box-shadow $transition-base, transform $transition-base;

    @media (any-hover: hover) {
      &:has(#{$parent}__circle-button:hover) {
        box-shadow: $hovered-box-shadow;
        transform: translateY(-2px);
      }
    }
  }

  &__feature-subtitle {
    font-size: 2rem;
    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__feature-content {
    @include fluid-style(gap, 16, 20);

    display: flex;
    flex-direction: column;
  }

  &__catchcopy {
    font-size: 1.4rem;
    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__image {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: $radius-lg;
  }

  &__text {
    font-size: 1.4rem;
    line-height: 1.8;
  }

  &__circle-button {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  &__circle {
    position: absolute;
    right: 1.2rem;
    bottom: 1.2rem;
    display: block;
    width: 4rem;
    aspect-ratio: 1;
    background-color: $green;
    border-radius: 100vmax;
    transition: background-color $transition-base, transform $transition-base;

    &::before,
    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1.4rem;
      height: 2px;
      content: "";
      background-color: $white;
      transition: transform $transition-base, background-color $transition-base;
    }

    &::before {
      transform: translate(-50%, -50%);
    }

    &::after {
      transform: translate(-50%, -50%) rotate(90deg);
    }

    &.is-active {
      background-color: $white;

      &::before,
      &::after {
        background-color: $green;
      }

      &::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      &::after {
        transform: translate(-50%, -50%) rotate(135deg);
      }
    }
  }

  /* =======================================================================
   * Gallery セクション (横スクロール)
   * ======================================================================= */
  &__horizontal-scroll-wrapper {
    @include full-width-style;

    position: relative;
    visibility: hidden; // GSAPアニメーション用
    overflow: hidden;
    pointer-events: none; // pin留めした際にスワイプ（スクロール）できるように
  }

  &__slide-wrapper {
    display: flex;
    background-color: $gray; /* 横スクロール部分の初期背景色 */
  }

  &__slide {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100svh;
  }

  &__slide-inner {
    @include contents-width;
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__slide-title {
    @include fluid-text(18, 26);

    font-weight: $bold;
    color: $black;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__slide-image {
    width: 100%;
    max-width: 85rem;
    height: auto;
    border-radius: $radius-md;
  }

  &__slide-description {
    @include fluid-text(14, 18);

    font-weight: $bold;
    text-align: center;
  }

  &__progress-bar-wrapper {
    @include contents-width;

    position: absolute;
    bottom: 6rem;
    left: 50%;
    display: flex;
    gap: 1.2rem;
    width: 100%;
    transform: translateX(-50%);
  }

  &__progress-segment {
    flex: 1;
    height: 2px;
    overflow: hidden;
    background-color: rgba($black, 0.1);
    border-radius: 100vmax;
  }

  &__progress-fill {
    width: 100%;
    height: 100%;
    background-color: $green;
    transform: scaleX(0);
    transform-origin: left;
  }
}

/* =========================================================================
 * @keyframes / Transitions
 * ========================================================================= */

/* スクロールラインが落ちるアニメーション */
@keyframes scroll-down-drop {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(200%);
  }
}

/* インジケーター自体のフェードイン */
@keyframes indicator-fade-in {
  to {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>