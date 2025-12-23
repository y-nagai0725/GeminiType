<template>
  <div class="login-view">
    <h1 class="login-view__title">
      <span class="en">LOGIN</span>
      <span class="ja">ログイン</span>
    </h1>

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

      <button type="submit" class="login-view__button">ログイン</button>

      <p class="login-view__message">
        アカウント持ってない？
        <RouterLink to="/register" class="login-view__link"
          >新規登録はこちら</RouterLink
        >
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

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
/* (BEM) ブロック: .login-view */
.login-view {
  @include contents-width;

  @include pc {
    max-width: 1000px;
  }

  &__title {
    @include page-title;
  }

  /* (BEM) エレメント: .login-view__form */
  &__form {
    width: 100%;
  }

  /* (BEM) エレメント: .login-view__group */
  &__group {
    margin-bottom: 1rem;
  }

  /* (BEM) エレメント: .login-view__label */
  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  /* (BEM) エレメント: .login-view__input */
  &__input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box; // ★paddingがあっても幅がはみ出ない魔法♡
  }

  /* (BEM) エレメント: .login-view__button */
  &__button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    background-color: #007bff; // 仮の青色
    color: white;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;

    &:hover {
      background-color: #0056b3; // 仮の濃い青色
    }
  }

  /* (BEM) エレメント: .login-view__message */
  &__message {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
  }

  /* (BEM) エレメント: .login-view__link */
  &__link {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>