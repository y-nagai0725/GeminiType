<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <div class="app-footer__logo">
        <RouterLink to="/">GeminiType</RouterLink>
      </div>

      <nav class="app-footer__nav">
        <ul class="footer-links">
          <li><RouterLink to="/">TOP</RouterLink></li>

          <template v-if="!authStore.isLoggedIn">
            <li><RouterLink to="/login">ログイン</RouterLink></li>
            <li><RouterLink to="/register">ユーザー登録</RouterLink></li>
          </template>

          <template v-else>
            <li><RouterLink to="/menu">MENU</RouterLink></li>
            <li><RouterLink to="/mypage">マイページ</RouterLink></li>
            <li v-if="authStore.isAdmin">
              <RouterLink to="/admin">管理画面</RouterLink>
            </li>
            <li><a href="#" @click.prevent="handleLogout">ログアウト</a></li>
          </template>
        </ul>
      </nav>

      <div class="app-footer__copyright">
        &copy; 2025 GeminiType. All Rights Reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  notificationStore.addNotification("ログアウトしました", "success");
  router.push("/login");
};
</script>

<style lang="scss" scoped>
.app-footer {
  background-color: $green;
  padding: 2rem 1rem;
  margin-top: auto; /* ★これ重要！Flexboxで下寄せにするため */

  &__inner {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__logo {
    font-weight: bold;
    font-size: 1.2rem;

    a {
      color: $white;
      text-decoration: none;
      transition: color 0.3s ease-out;

      @include hover {
        color: $yellow;
      }
    }
  }

  &__nav {
    .footer-links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      list-style: none;
      padding: 0;

      a {
        color: $white;
        text-decoration: none;
        font-size: 0.9rem;
        transition: color 0.3s ease-out;

        @include hover {
          color: $yellow;
        }
      }
    }
  }

  &__copyright {
    font-size: 0.8rem;
    color: $white;
  }
}
</style>