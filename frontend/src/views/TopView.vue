<template>
  <div class="top-view">
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
          <ArrowIcon class="top-view__arrow-icon" />
        </RouterLink>
      </div>

      <div v-else class="top-view__actions">
        <RouterLink to="/menu" class="top-view__button top-view__button--guest">
          ゲストで遊ぶ (登録なし)
          <ArrowIcon class="top-view__arrow-icon" />
        </RouterLink>

        <div class="top-view__sub-actions">
          <RouterLink
            to="/login"
            class="top-view__button top-view__button--small"
            >ログイン <ArrowIcon class="top-view__arrow-icon"
          /></RouterLink>
          <RouterLink
            to="/register"
            class="top-view__button top-view__button--small"
            >ユーザー登録 <ArrowIcon class="top-view__arrow-icon"
          /></RouterLink>
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
                無限に広がる、あなただけの練習問題。
              </p>
              <img
                class="top-view__image"
                src="@/assets/images/top/test.png"
                alt=""
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
            class="top-view__circle-button"
            @click="isAiModeDetail = !isAiModeDetail"
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
              <p class="top-view__catchcopy">昨日の自分より、ちょっと速く。</p>
              <img
                class="top-view__image"
                src="@/assets/images/top/test.png"
                alt=""
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
                苦手なキーもAIがバッチリ分析。弱点をピンポイントで克服して、最短距離で上達しちゃおう！
              </p>
            </div>
          </Transition>
          <button
            class="top-view__circle-button"
            @click="isProgressDetail = !isProgressDetail"
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
                ルールに縛られない、快適な打ち心地。
              </p>
              <img
                class="top-view__image"
                src="@/assets/images/top/test.png"
                alt=""
              />
            </div>
            <div v-else class="top-view__feature-content">
              <p class="top-view__text">
                「し」は [si] でも [shi]
                でもOK。あなたの慣れ親しんだ入力スタイルを尊重する、柔軟な判定システム。
              </p>
              <p class="top-view__text">
                「ん」の [n] [nn]
                問題も解決。細かいルールにイライラすることなく、純粋にスピードと正確さを追求できます。
              </p>
              <p class="top-view__text">
                独自開発の判定エンジンが、あなたの指の動きにしっかり寄り添い、最高に気持ちいいタイピング体験を届けます。
              </p>
            </div>
          </Transition>
          <button
            class="top-view__circle-button"
            @click="isStressFreeDetail = !isStressFreeDetail"
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

    <div class="top-view__actions-wrapper">
      <div v-if="authStore.isLoggedIn" class="top-view__actions">
        <RouterLink to="/menu" class="top-view__button top-view__button--menu">
          メインメニューへ進む
          <ArrowIcon class="top-view__arrow-icon" />
        </RouterLink>
      </div>

      <div v-else class="top-view__actions">
        <RouterLink to="/menu" class="top-view__button top-view__button--guest">
          ゲストで遊ぶ (登録なし)
          <ArrowIcon class="top-view__arrow-icon" />
        </RouterLink>

        <div class="top-view__sub-actions">
          <RouterLink
            to="/login"
            class="top-view__button top-view__button--small"
            >ログイン <ArrowIcon class="top-view__arrow-icon"
          /></RouterLink>
          <RouterLink
            to="/register"
            class="top-view__button top-view__button--small"
            >ユーザー登録 <ArrowIcon class="top-view__arrow-icon"
          /></RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// TODO 特長の3つの画像は仮です

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * 「AI問題生成モード」詳細表示・非表示
 */
const isAiModeDetail = ref(false);

/**
 * 「成長記録」詳細表示・非表示
 */
const isProgressDetail = ref(false);

/**
 * 「ストレスフリーな入力判定」詳細表示・非表示
 */
const isStressFreeDetail = ref(false);
</script>

<style lang="scss" scoped>
.top-view {
  $parent: &;
  display: flex;
  flex-direction: column;
  @include fluid-style(gap, 40, 120);
  @include contents-width;
  @include fluid-style(padding-top, 40, 80);
  @include fluid-style(padding-bottom, 64, 120);

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 32, 48);
  }

  &__title {
    font-family: $roboto-mono;
    @include fluid-text(40, 64);
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__subtitle {
    @include fluid-text(20, 32);
    font-weight: $bold;
    line-height: 1.8;
    letter-spacing: 0.05em;
    text-align: center;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 24, 48);
  }

  &__welcome {
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
    color: $blue;
  }

  &__button {
    @include fluid-style(width, 276, 432);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    &--menu {
      @include button-style-fill($green);
    }

    &--guest {
      @include button-style-fill($blue);
    }

    &--small {
      @include button-style-border($green);
      @include fluid-style(width, 130, 200);
      @include fluid-style(padding-block, 16, 20);
      @include fluid-text(12, 16);
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__sub-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    @include fluid-style(gap, 16, 32);
  }

  &__features {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 32, 48);
  }

  &__features-title {
    @include fluid-text(24, 32);
    font-weight: $bold;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.4rem;
    width: 100%;
    max-width: 380px;

    @include pc {
      grid-template-columns: repeat(3, 1fr);
      gap: 8rem;
      max-width: none;
    }
  }

  &__feature {
    position: relative;
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 28);
    aspect-ratio: 335 / 472;
    padding: 2.4rem;
    border-radius: $radius-lg;
    background-color: $gray;
  }

  &__feature-subtitle {
    font-size: 2rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__feature-content {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 16, 20);
  }

  &__catchcopy {
    font-size: 1.4rem;
    font-weight: $bold;
    letter-spacing: 0.1em;
    text-align: center;
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

    @include hover {
      #{$parent}__circle {
        transform: scale(1.08);
      }
    }
  }

  &__circle {
    position: absolute;
    bottom: 1.2rem;
    right: 1.2rem;
    display: block;
    width: 4.8rem;
    aspect-ratio: 1;
    border-radius: 100vmax;
    background-color: $blue;
    transition: background-color $transition-base, transform $transition-base;

    &::before,
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1.4rem;
      height: 2px;
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
        background-color: $blue;
      }

      &::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      &::after {
        transform: translate(-50%, -50%) rotate(135deg);
      }
    }
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