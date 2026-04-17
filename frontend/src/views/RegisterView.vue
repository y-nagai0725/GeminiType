<template>
  <div class="register-view">
    <h1 class="register-view__title">
      <span class="en" aria-hidden="true">REGISTER</span>
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
          <span
            class="register-view__link-text register-view__link-text--en"
            aria-hidden="true"
            >LOGIN</span
          >
        </RouterLink>
        <div class="register-view__link register-view__link--disabled">
          <span class="register-view__link-text register-view__link-text--jp"
            >ユーザー登録</span
          >
          <span
            class="register-view__link-text register-view__link-text--en"
            aria-hidden="true"
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
              >※{{ MAX_NAME_LENGTH }}文字以内</span
            ></label
          >
          <input
            type="text"
            id="name"
            class="register-view__input"
            v-model.trim="name"
            autocomplete="username"
            :maxlength="MAX_NAME_LENGTH"
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
            autocomplete="email"
            required
          />
        </div>

        <div class="register-view__group">
          <label for="password" class="register-view__label"
            >パスワード<span class="register-view__label-notice"
              >※{{ MIN_PASSWORD_LENGTH }}文字以上</span
            ></label
          >
          <input
            type="password"
            id="password"
            class="register-view__input"
            v-model="password"
            autocomplete="new-password"
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
            autocomplete="new-password"
            required
          />
        </div>

        <button type="submit" class="register-view__button">
          登録<ArrowIcon class="register-view__arrow-icon" aria-hidden="true" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

// --- Services & Utilities ---
import api from "../services/api";

// --- Stores ---
import { useNotificationStore } from "../stores/notificationStore";
import { useAuthStore } from "../stores/authStore";

// --- Icons ---
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * ユーザー名の最大文字数
 * @type {number}
 */
const MAX_NAME_LENGTH = 10;

/**
 * パスワードの最小文字数
 * @type {number}
 */
const MIN_PASSWORD_LENGTH = 4;

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * routerインスタンス
 * @type {import('vue-router').Router}
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
 * @type {import('vue').Ref<string>}
 */
const name = ref("");

/**
 * メールアドレス
 * @type {import('vue').Ref<string>}
 */
const email = ref("");

/**
 * パスワード
 * @type {import('vue').Ref<string>}
 */
const password = ref("");

/**
 * 確認用パスワード
 * @type {import('vue').Ref<string>}
 */
const passwordConfirm = ref("");

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * ユーザー登録処理
 * @returns {Promise<void>}
 */
const handleRegister = async () => {
  // ユーザー名の空白チェック
  if (name.value === "") {
    notificationStore.addNotification("ユーザー名を入力して下さい。", "error");
    return;
  }

  // ユーザー名の文字数チェック
  if (name.value.length > MAX_NAME_LENGTH) {
    notificationStore.addNotification(
      `ユーザー名は${MAX_NAME_LENGTH}文字以内にして下さい。`,
      "error"
    );
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

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    notificationStore.addNotification(
      "メールアドレスの形式が正しくありません。",
      "error"
    );
    return;
  }

  // パスワードの空白チェック
  if (!password.value) {
    notificationStore.addNotification("パスワードを入力して下さい。", "error");
    return;
  }

  // パスワードの文字数チェック
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    notificationStore.addNotification(
      `パスワードは${MIN_PASSWORD_LENGTH}文字以上にして下さい。`,
      "error"
    );
    return;
  }

  // パスワード確認チェック
  if (password.value !== passwordConfirm.value) {
    notificationStore.addNotification(
      "パスワードと、確認用パスワードが一致しません。",
      "error"
    );
    return;
  }

  try {
    // ユーザー登録 API 呼び出し
    await api.post("/api/register", {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    // 登録成功通知
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
/* =========================================================================
 * ユーザー登録画面のスタイル
 * ========================================================================= */
.register-view {
  /* mixins.scss で定義した認証画面共通のスタイル（auth-style）を呼び出す */
  @include auth-style;
}
</style>