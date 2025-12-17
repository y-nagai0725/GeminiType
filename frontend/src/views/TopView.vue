<template>
  <div class="top-view">
    <div class="top-view__hero">
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
        </RouterLink>
      </div>

      <div v-else class="top-view__actions">
        <RouterLink to="/menu" class="top-view__button top-view__button--guest">
          ゲストで遊ぶ (登録なし)
        </RouterLink>

        <div class="top-view__sub-actions">
          <RouterLink to="/login" class="top-view__link">ログイン</RouterLink>
          <span class="top-view__separator">|</span>
          <RouterLink to="/register" class="top-view__link"
            >新規登録</RouterLink
          >
        </div>
      </div>
    </div>

    <div class="top-view__features">
      <section class="top-view__feature">
        <h3>🤖 AI生成モード</h3>
        <p>Geminiがお題を無限に生成！飽きずに練習できます。</p>
      </section>
      <section class="top-view__feature">
        <h3>📊 成長記録</h3>
        <p>苦手なキーやKPMを分析して、効率よく上達しましょう。</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const authStore = useAuthStore();
</script>

<style lang="scss" scoped>
.top-view {
  @include contents-width;
  @include fluid-style(padding-top, 40, 80);
  @include fluid-style(padding-bottom, 64, 120);

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 32, 48);
    @include fluid-style(margin-bottom, 40, 120);
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
    display: inline-block;
    @include fluid-style(width, 276, 432);
    @include fluid-style(padding-block, 17, 22);
    border-radius: 100vmax;
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
    color: $white;
    text-align: center;
    transition: color 0.3s ease-out, background-color 0.3s ease-out;

    @include hover {
    }

    &--menu {
      background-color: $blue;
    }

    &--guest {
      background-color: $green;
    }
  }

  &__sub-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  &__link {
    color: #555;
    text-decoration: none;
    font-weight: bold;
    &:hover {
      color: #007bff;
      text-decoration: underline;
    }
  }

  &__features {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;

    @media (min-width: 600px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__feature {
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;

    h3 {
      margin-bottom: 1rem;
      color: #333;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
  }
}
</style>