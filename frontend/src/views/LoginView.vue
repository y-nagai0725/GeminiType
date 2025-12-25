<template>
  <div class="login-view">
    <h1 class="login-view__title">
      <span class="en">LOGIN</span>
      <span class="ja">ログイン</span>
    </h1>
    <div class="login-view__contents-wrapper">
      <div class="login-view__link-wrapper">
        <div class="login-view__link login-view__link--disable">
          <span class="login-view__link-text login-view__link-text--jp"
            >ログイン</span
          >
          <span class="login-view__link-text login-view__link-text--en"
            >LOGIN</span
          >
        </div>
        <RouterLink
          to="/register"
          class="login-view__link login-view__link--active"
        >
          <span class="login-view__link-text login-view__link-text--jp"
            >ユーザー登録</span
          >
          <span class="login-view__link-text login-view__link-text--en"
            >REGISTER</span
          >
        </RouterLink>
      </div>
      <form class="login-view__form" @submit.prevent="handleLogin" novalidate>
        <div class="login-view__group">
          <label for="email" class="login-view__label">メールアドレス</label>
          <input
            type="email"
            id="email"
            class="login-view__input"
            v-model.trim="email"
            required
          />
        </div>

        <div class="login-view__group">
          <label for="password" class="login-view__label">パスワード</label>
          <input
            type="password"
            id="password"
            class="login-view__input"
            v-model="password"
            required
          />
        </div>

        <button type="submit" class="login-view__button">
          ログイン<ArrowIcon class="login-view__arrow-icon" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * メールアドレス
 */
const email = ref("");

/**
 * パスワード
 */
const password = ref("");

/**
 * ログイン処理
 */
const handleLogin = async () => {
  // メールアドレスの空白チェック
  if (email.value === "") {
    notificationStore.addNotification(
      "メールアドレスを入力して下さい。",
      "error"
    );
    return;
  }

  // パスワードの空白チェック
  if (!password.value) {
    notificationStore.addNotification("パスワードを入力して下さい。", "error");
    return;
  }

  try {
    // ログイン
    await authStore.login(email.value, password.value);

    // ログイン通知
    notificationStore.addNotification("ログインしました。", "success");
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "ログインに失敗しました。",
      "error"
    );
  }
};
</script>

<style lang="scss" scoped>
.login-view {
  @include auth-style;
}
</style>