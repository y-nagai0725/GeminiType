<template>
  <div class="register-view">
    <h1 class="register-view__title">
      <span class="en">REGISTER</span>
      <span class="ja">ユーザー登録</span>
    </h1>
    <div class="register-view__contents-wrapper">
      <div class="register-view__link-wrapper">
        <RouterLink
          to="/login"
          class="register-view__link register-view__link--active"
        >
          <span class="register-view__link-text register-view__link-text--jp"
            >ログイン</span
          >
          <span class="register-view__link-text register-view__link-text--en"
            >LOGIN</span
          >
        </RouterLink>
        <div class="register-view__link register-view__link--disable">
          <span class="register-view__link-text register-view__link-text--jp"
            >ユーザー登録</span
          >
          <span class="register-view__link-text register-view__link-text--en"
            >REGISTER</span
          >
        </div>
      </div>
      <form
        class="register-view__form"
        @submit.prevent="handleRegister"
        novalidate
      >
        <div class="register-view__group">
          <label for="name" class="register-view__label"
            >ユーザー名<span class="register-view__label-notice"
              >※10文字以内</span
            ></label
          >
          <input
            type="text"
            id="name"
            class="register-view__input"
            v-model.trim="name"
            required
          />
        </div>

        <div class="register-view__group">
          <label for="email" class="register-view__label">メールアドレス</label>
          <input
            type="email"
            id="email"
            class="register-view__input"
            v-model.trim="email"
            required
          />
        </div>

        <div class="register-view__group">
          <label for="password" class="register-view__label"
            >パスワード<span class="register-view__label-notice"
              >※4文字以上</span
            ></label
          >
          <input
            type="password"
            id="password"
            class="register-view__input"
            v-model="password"
            required
          />
        </div>

        <div class="register-view__group">
          <label for="password-confirm" class="register-view__label"
            >パスワード確認</label
          >
          <input
            type="password"
            id="password-confirm"
            class="register-view__input"
            v-model="passwordConfirm"
            required
          />
        </div>

        <button type="submit" class="register-view__button">登録<ArrowIcon class="register-view__arrow-icon" /></button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import api from "../services/api";
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../stores/authStore";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

/**
 * router
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * ユーザー名
 */
const name = ref("");

/**
 * メールアドレス
 */
const email = ref("");

/**
 * パスワード
 */
const password = ref("");

/**
 * 確認用パスワード
 */
const passwordConfirm = ref("");

/**
 * ユーザー登録処理
 */
const handleRegister = async () => {
  // パスワード確認チェック
  if (password.value !== passwordConfirm.value) {
    notificationStore.addNotification(
      "パスワードと、確認用パスワードが一致しません。",
      "error"
    );
    return;
  }

  // ユーザー名の空白チェック
  if (name.value === "") {
    notificationStore.addNotification("ユーザー名を入力して下さい。", "error");
    return;
  }

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

  // ユーザー名チェック (10文字以内)
  if (name.value.length > 10) {
    notificationStore.addNotification(
      "ユーザー名は10文字以内にして下さい。",
      "error"
    );
    return;
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    notificationStore.addNotification(
      "メールアドレスの形式が正しくありません。",
      "error"
    );
    return;
  }

  // パスワードチェック (4文字以上)
  if (password.value.length < 4) {
    notificationStore.addNotification(
      "パスワードは4文字以上にして下さい。",
      "error"
    );
    return;
  }

  try {
    // ユーザー登録
    await api.post("/api/register", {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    // 登録＆ログイン通知
    notificationStore.addNotification(
      "登録完了しました。自動でログインします。",
      "success"
    );

    // ログイン処理を実行
    await authStore.login(email.value, password.value);
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "登録または自動ログインに失敗しました。",
      "error"
    );
  }
};
</script>

<style lang="scss" scoped>
.register-view {
  @include auth-style;
}
</style>