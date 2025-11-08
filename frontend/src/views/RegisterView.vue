<template>
  <div class="register-view">
    <h1 class="register-view__title">ユーザー登録 (画面2)</h1>

    <form class="register-view__form" @submit.prevent="handleRegister">
      <div class="register-view__group">
        <label for="name" class="register-view__label"
          >ユーザー名 (10文字以内)</label
        >
        <input
          type="text"
          id="name"
          class="register-view__input"
          v-model="name"
          required
        />
      </div>

      <div class="register-view__group">
        <label for="email" class="register-view__label">メールアドレス</label>
        <input
          type="email"
          id="email"
          class="register-view__input"
          v-model="email"
          required
        />
      </div>

      <div class="register-view__group">
        <label for="password" class="register-view__label"
          >パスワード (4文字以上)</label
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
          >パスワード (確認用)</label
        >
        <input
          type="password"
          id="password-confirm"
          class="register-view__input"
          v-model="passwordConfirm"
          required
        />
      </div>

      <button type="submit" class="register-view__button">登録する</button>

      <p class="register-view__message">
        アカウント持ってる？
        <RouterLink to="/login" class="register-view__link"
          >ログインはこちら</RouterLink
        >
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router"; // (★) 「useRouter」を追加！
import api from "../services/api"; // (★) 最強の「api.js」をインポート！

// (★) router を「プログラムで」動かすための道具
const router = useRouter();

// フォームの「中身」を保存する「宝箱」
const name = ref("");
const email = ref("");
const password = ref("");
const passwordConfirm = ref("");

// (★) こっちも「合体♡」の本番だよ！
const handleRegister = async () => {
  // (★) 「async」を付けるよ
  // 1. (★) Frontend側の「門番チェック」！
  if (password.value !== passwordConfirm.value) {
    alert("パスワードと、確認用パスワードが一致しないよ！");
    return;
  }

  try {
    // 2. (★) お兄ちゃんのAPIに「ユーザー登録」のお願い！♡
    await api.post("/api/register", {
      //
      name: name.value,
      email: email.value,
      password: password.value, // (★)「passwordConfirm」は送らなくてOK！
    });

    // 3. (★) 登録成功！♡
    alert("登録完了だよ、お兄ちゃん！♡ \nそのままログイン画面に移動するね！");

    // 4. (★) 登録が終わったら、ログイン画面に「ワープ」！
    router.push("/login");
  } catch (error) {
    // 400番台とか500番台のエラーが起きたら…
    console.error("登録失敗…", error);

    // (★) Backendがくれた「エラーメッセージ」をそのまま表示！
    if (error.response && error.response.data && error.response.data.message) {
      alert(error.response.data.message);
    } else {
      alert("ごめんね、登録中にエラーが起きちゃった…");
    }
  }
};
</script>

<style lang="scss" scoped>
/* (BEM) .register-view は .login-view と「ほぼ」同じスタイルを使うよ */
/* SCSSの「@import」とか「共通化」もできるけど、まずはコピペでOK！ */
/* お兄ちゃんがデザインするときに、キレイに共通化しようね！♡ */

.register-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
  margin: 40px auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;

  &__title {
    margin-bottom: 1.5rem;
    color: #333;
  }

  &__form {
    width: 100%;
  }

  &__group {
    margin-bottom: 1rem;
  }

  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  &__input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }

  &__button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    background-color: #28a745; // 仮の緑色
    color: white;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;

    &:hover {
      background-color: #218838; // 仮の濃い緑色
    }
  }

  &__message {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
  }

  &__link {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>