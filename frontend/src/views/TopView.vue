<template>
  <div class="top-view">
    <div class="top-view__hero">
      <h1 class="top-view__title">GeminiType</h1>
      <p class="top-view__subtitle">
        AIと一緒に、タイピングを楽しく練習しよう！
      </p>

      <div v-if="authStore.isLoggedIn" class="top-view__actions">
        <p class="top-view__welcome">
          おかえりなさい、{{ authStore.user?.name }} さん！
        </p>
        <RouterLink
          to="/menu"
          class="top-view__button top-view__button--primary"
        >
          メニューへ進む
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

// 画面に来たらユーザー情報を確認しておく（セッション有効確認のため）
onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.user) {
    await authStore.fetchUser();
  }
});
</script>

<style lang="scss" scoped>
.top-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
  font-family: sans-serif;

  &__hero {
    margin-bottom: 4rem;
  }

  &__title {
    font-size: 4rem;
    color: #333;
    margin-bottom: 1rem;
    letter-spacing: 2px;
  }

  &__subtitle {
    font-size: 1.5rem;
    color: #666;
    margin-bottom: 3rem;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  &__welcome {
    font-size: 1.2rem;
    font-weight: bold;
    color: #007bff;
  }

  &__button {
    display: inline-block;
    padding: 1rem 3rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: bold;
    font-size: 1.2rem;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    &--primary {
      background-color: #007bff;
      color: white;
      box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
    }

    &--guest {
      background-color: #28a745;
      color: white;
      box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
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