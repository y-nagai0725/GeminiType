<template>
  <div v-if="isVisible" class="submenu">
    <div class="submenu__inner">
      <div class="submenu__title-wrapper">
        <span class="submenu__title-en">SUBMENU</span>
        <span class="submenu__title-jp">サブメニュー</span>
      </div>
      <ul class="submenu__list">
        <template v-if="!authStore.isLoggedIn">
          <li class="submenu__item">
            <RouterLink to="/login" class="submenu__link">
              <span class="submenu__link-title-wrapper">
                <span class="submenu__link-title-en">LOGIN</span>
                <span class="submenu__link-title-jp">ログイン</span>
              </span>
              <LoginIcon class="submenu__link-icon" />
            </RouterLink>
          </li>
          <li class="submenu__item">
            <RouterLink to="/register" class="submenu__link">
              <span class="submenu__link-title-wrapper">
                <span class="submenu__link-title-en">REGISTER</span>
                <span class="submenu__link-title-jp">ユーザー登録</span>
              </span>
              <RegisterIcon class="submenu__link-icon" />
            </RouterLink>
          </li>
        </template>
        <template v-else>
          <li class="submenu__item">
            <RouterLink to="/mypage" class="submenu__link">
              <span class="submenu__link-title-wrapper">
                <span class="submenu__link-title-en">MYPAGE</span>
                <span class="submenu__link-title-jp">マイページ</span>
              </span>
              <MyPageIcon class="submenu__link-icon" />
            </RouterLink>
          </li>
          <li class="submenu__item">
            <button class="submenu__link" @click="handleLogout">
              <span class="submenu__link-title-wrapper">
                <span class="submenu__link-title-en">LOGOUT</span>
                <span class="submenu__link-title-jp">ログアウト</span>
              </span>
              <LogoutIcon class="submenu__link-icon" />
            </button>
          </li>
        </template>
        <li class="submenu__item">
          <RouterLink to="/menu" class="submenu__link">
            <span class="submenu__link-title-wrapper">
              <span class="submenu__link-title-en">MAIN MENU</span>
              <span class="submenu__link-title-jp">メインメニュー</span>
            </span>
            <MainMenuIcon class="submenu__link-icon" />
          </RouterLink>
        </li>
        <template v-if="authStore.isLoggedIn && authStore.isAdmin">
          <li class="submenu__item">
            <RouterLink to="/admin" class="submenu__link">
              <span class="submenu__link-title-wrapper">
                <span class="submenu__link-title-en">ADMIN</span>
                <span class="submenu__link-title-jp">管理画面</span>
              </span>
              <AdminIcon class="submenu__link-icon" />
            </RouterLink>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import LoginIcon from "@/components/icons/LoginIcon.vue";
import LogoutIcon from "@/components/icons/LogoutIcon.vue";
import MainMenuIcon from "@/components/icons/MainMenuIcon.vue";
import MyPageIcon from "@/components/icons/MyPageIcon.vue";
import RegisterIcon from "@/components/icons/RegisterIcon.vue";
import AdminIcon from "@/components/icons/AdminIcon.vue";

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * ルート情報
 */
const route = useRoute();

/**
 * サブメニューを表示するルート名
 */
const allowedRoutes = [
  "menu",
  "typing-setup",
  "typing-play",
  "typing-result",
  "mypage",
  "session-detail",
  "admin",
];

/**
 * サブメニューの表示・非表示
 */
const isVisible = computed(() => {
  const routeName = route.name;
  return allowedRoutes.includes(routeName);
});

/**
 * ログアウト処理
 */
const handleLogout = () => {
  // ログアウト
  authStore.logout();

  // ログアウトを通知
  notificationStore.addNotification("ログアウトしました", "success");
};
</script>
<style lang="scss" scoped>
.submenu {
  @include fluid-style(padding-block, 40, 80);
  background-color: $gray;

  &__inner {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr;
    @include fluid-style(gap, 32, 48);
    @include contents-width;

    @include pc {
      align-items: flex-start;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
  }

  &__title-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 16, 24);

    @include pc {
      align-items: flex-start;
    }
  }

  &__title-en {
    font-family: $roboto-mono;
    @include fluid-text(24, 48);
    font-weight: $bold;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  &__title-jp {
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
    color: $green;
  }

  &__list {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 24, 40, $max-vw: 1920);

    @include pc {
      flex-wrap: wrap;
      flex-direction: row;
      justify-content: space-between;
    }
  }

  &__link {
    display: flex;
    justify-content: space-between;
    align-items: center;
    @include fluid-style(width, 240, 280, $max-vw: 1920);
    @include fluid-style(padding, 20, 24);
    cursor: pointer;
    background-color: $white;
    border: 2px solid $green;
    border-radius: $radius-lg;
    transition: background-color $transition-base;

    @include hover {
      background-color: $light-green;
    }
  }

  &__link-title-wrapper {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 12, 16);
  }

  &__link-title-en {
    font-family: $roboto-mono;
    @include fluid-text(12, 16);
    font-weight: $bold;
    letter-spacing: 0.05em;
    line-height: 1;
    color: $green;
  }

  &__link-title-jp {
    @include fluid-text(16, 20);
    font-weight: $bold;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  &__link-icon {
    @include fluid-style(width, 30, 40);
    aspect-ratio: 1;
    fill: $green;
  }
}
</style>