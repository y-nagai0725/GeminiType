<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__left">
        <RouterLink to="/" class="header__logo-link" @click="closeMenu">
          <SiteLogoIcon class="header__logo-icon" />
          <span class="header__title">GeminiType</span>
        </RouterLink>
      </div>

      <div class="header__right">
        <div class="header__pc-actions">
          <template v-if="!authStore.isLoggedIn">
            <RouterLink to="/login" class="header__button" @click="closeMenu"
              >ログイン</RouterLink
            >
            <RouterLink to="/register" class="header__button" @click="closeMenu"
              >ユーザー登録</RouterLink
            >
          </template>
          <template v-else>
            <span class="header__user-name"
              ><UserIcon class="header__user-icon" /> {{ authStore.user?.name
              }}<span class="header__honorific-title">さん</span></span
            >
            <RouterLink to="/mypage" class="header__button" @click="closeMenu"
              >マイページ</RouterLink
            >
          </template>
        </div>

        <button
          class="header__hamburger-button"
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMenu"
          aria-label="メニューを開く"
        >
          <span class="header__line-wrapper">
            <span class="header__line header__line--top"></span>
            <span class="header__line header__line--middle"></span>
            <span class="header__line header__line--bottom"></span>
          </span>
          <span class="header__hamburger-button-text">MENU</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <nav v-show="isMenuOpen" class="header__fullscreen-menu">
        <span v-if="authStore.isLoggedIn" class="header__menu-user-name"
          ><UserIcon class="header__menu-user-icon" /> {{ authStore.user?.name
          }}<span class="header__menu-honorific-title">さん</span></span
        >
        <ul class="header__menu-list">
          <li class="header__menu-item">
            <RouterLink
              to="/"
              class="header__menu-link header__menu-link--roboto"
              @click="closeMenu"
              >TOP</RouterLink
            >
          </li>

          <li class="header__menu-item">
            <RouterLink to="/menu" class="header__menu-link" @click="closeMenu"
              >メインメニュー</RouterLink
            >
          </li>

          <template v-if="!authStore.isLoggedIn">
            <li class="header__menu-item">
              <RouterLink
                to="/login"
                class="header__menu-link"
                @click="closeMenu"
                >ログイン</RouterLink
              >
            </li>
            <li class="header__menu-item">
              <RouterLink
                to="/register"
                class="header__menu-link"
                @click="closeMenu"
                >ユーザー登録</RouterLink
              >
            </li>
          </template>

          <template v-else>
            <li class="header__menu-item">
              <RouterLink
                to="/mypage"
                class="header__menu-link"
                @click="closeMenu"
                >マイページ</RouterLink
              >
            </li>
            <li class="header__menu-item" v-if="authStore.isAdmin">
              <RouterLink
                to="/admin"
                class="header__menu-link"
                @click="closeMenu"
                >管理画面</RouterLink
              >
            </li>
          </template>

          <li class="header__menu-item" v-if="authStore.isLoggedIn">
            <a href="#" @click.prevent="handleLogout" class="header__menu-link"
              >ログアウト</a
            >
          </li>
        </ul>
      </nav>
    </transition>
  </header>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import SiteLogoIcon from "@/components/icons/SiteLogoIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * router
 */
const router = useRouter();

/**
 * メニューの開閉状態
 */
const isMenuOpen = ref(false);

/**
 * メニューの切り替え
 */
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

/**
 * メニューを閉じる
 */
const closeMenu = () => {
  isMenuOpen.value = false;
};

/**
 * ログアウト処理
 */
const handleLogout = () => {
  // メニューを閉じる
  closeMenu();

  // ログアウト
  authStore.logout();

  // ログアウトを通知
  notificationStore.addNotification("ログアウトしました", "success");
};
</script>

<style lang="scss" scoped>
.header {
  $parent: &;
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: $green;

  @include tab {
    height: 70px;
  }

  @include pc {
    height: 80px;
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1001;
    @include contents-width;
    height: 100%;
  }

  &__logo-link {
    display: flex;
    align-items: center;
    @include fluid-style(gap, 8, 16);
    padding: 1rem 0;
    color: $white;
    transition: color 0.3s ease-out;

    @include hover {
      color: $yellow;
    }
  }

  &__logo-icon {
    @include fluid-style(width, 26, 40);
    stroke: currentColor;
    fill: currentColor;
    transition: fill 0.3s ease-out, stroke 0.3s ease-out;
  }

  &__title {
    @include fluid-text(20, 30);
    font-family: $roboto-mono;
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 2.4rem;
  }

  &__pc-actions {
    display: none;

    @include pc {
      display: flex;
      align-items: center;
      gap: 2.4rem;
    }
  }

  &__button {
    @include button-style-border($white, $green);
    padding: 1.6rem 3.2rem;
    font-size: 1.4rem;
    line-height: 1;
  }

  &__user-name,
  &__menu-user-name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.4rem;
    color: $white;
  }

  &__user-icon,
  &__menu-user-icon {
    width: 1.7rem;
    aspect-ratio: 1;
    fill: $white;
  }

  &__honorific-title,
  &__menu-honorific-title {
    font-size: 1.2rem;
    color: $white;
  }

  &__hamburger-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    position: relative;
    z-index: 1002;
    @include fluid-style(width, 40, 48);
    aspect-ratio: 1;
    cursor: pointer;

    &.is-active {
      #{$parent}__line--top {
        top: 50%;
        transform: translateY(-50%) rotate(45deg);
      }
      #{$parent}__line--middle {
        transform: translate(7px, -50%);
        opacity: 0;
      }
      #{$parent}__line--bottom {
        bottom: 50%;
        transform: translateY(50%) rotate(-45deg);
      }
    }

    @include hover {
      #{$parent}__line {
        background-color: $yellow;
      }

      #{$parent}__hamburger-button-text {
        color: $yellow;
      }
    }
  }

  &__line-wrapper {
    display: block;
    position: relative;
    width: 50%;
    aspect-ratio: 5 / 4;
  }

  &__line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: $white;
    border-radius: 2px;
    transition: top 0.3s ease-out, bottom 0.3s ease-out, opacity 0.3s ease-out,
      transform 0.3s ease-out, background-color 0.3s ease-out;

    &--top {
      top: 0;
    }

    &--middle {
      top: 50%;
      transform: translateY(-50%);
    }

    &--bottom {
      bottom: 0;
    }
  }

  &__hamburger-button-text {
    font-family: $roboto-mono;
    @include fluid-text(10, 11);
    color: $white;
    transition: color 0.3s ease-out;
  }

  &__fullscreen-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5.6rem;
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    height: calc(100svh - 60px);
    background-color: $green;

    @include tab {
      top: 70px;
      height: calc(100svh - 70px);
    }

    @include pc {
      top: 80px;
      height: calc(100vh - 80px);
    }
  }

  &__menu-user-name {
    @include pc {
      display: none;
    }
  }

  &__menu-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 12, 28);
  }

  &__menu-link {
    display: block;
    padding: 1rem 0;
    @include fluid-text(18, 24);
    font-weight: $bold;
    letter-spacing: 0.1em;
    color: $white;
    transition: color 0.3s ease-out;

    @include hover {
      color: $yellow;
    }

    &--roboto {
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>