<template>
  <div class="login-view">
    <h1 class="login-view__title">ログイン (画面3)</h1>

    <form class="login-view__form" @submit.prevent="handleLogin">
      <div class="login-view__group">
        <label for="email" class="login-view__label">メールアドレス</label>
        <input
          type="email"
          id="email"
          class="login-view__input"
          v-model="email"
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
import { RouterLink, useRouter } from "vue-router"; // (★) 「useRouter」を追加！
import api from "../services/api"; // (★) 最強の「api.js」をインポート！

// (★) router を「プログラムで」動かすための道具だよ
const router = useRouter();

// フォームの「中身」を保存する「宝箱」
const email = ref("");
const password = ref("");

// (★) ここが「合体♡」の本番だよ！
const handleLogin = async () => {
  // (★) 「async」を付けて「待てる」ようにするよ
  try {
    // 1. お兄ちゃんのAPIに「ログイン」のお願いをするよ！♡
    const response = await api.post("/api/login", {
      //
      email: email.value,
      password: password.value,
    });

    // 2. 成功したら「トークン」が返ってくるはず！
    const token = response.data.token;

    // 3. (★) トークンを「localStorage」っていうブラウザの鍵付きロッカーに保存！
    localStorage.setItem("token", token);

    // 4. (★) ログイン成功！♡（仮のアラート）
    alert("お兄ちゃん、おかえりなさい！♡");

    // 5. (★) メインメニュー（仮のトップページ "/"）に「ワープ」するよ！
    router.push("/"); // (←あとでメインメニュー画面のパスに変えようね！)
  } catch (error) {
    // 400番台とか500番台のエラーが起きたら…
    console.error("ログイン失敗…", error);

    // (★) Backendがくれた「エラーメッセージ」をそのまま表示！
    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message);
    } else {
      alert("ごめんね、ログイン中にエラーが起きちゃった…");
    }
  }
};
</script>

<style lang="scss" scoped>
/* (BEM) ブロック: .login-view */
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px; // 仮の幅
  margin: 40px auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;

  /* (BEM) エレメント: .login-view__title */
  &__title {
    margin-bottom: 1.5rem;
    color: #333;
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