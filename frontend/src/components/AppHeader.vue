<template>
  <header class="app-header">
    <div class="app-header__inner">
      <div class="app-header__left">
        <RouterLink to="/" class="app-header__logo-link" @click="closeMenu">
          <SiteLogoIcon class="app-header__logo-icon" />
          <span class="app-header__title">GeminiType</span>
        </RouterLink>
      </div>

      <div class="app-header__right">
        <div class="pc-actions">
          <template v-if="!authStore.isLoggedIn">
            <RouterLink to="/login" class="header-btn header-btn--outline"
              >ログイン</RouterLink
            >
            <RouterLink to="/register" class="header-btn header-btn--fill"
              >ユーザー登録</RouterLink
            >
          </template>
          <template v-else>
            <span class="user-name">{{ authStore.user?.name }} さん</span>
            <RouterLink to="/mypage" class="header-btn header-btn--outline"
              >マイページ</RouterLink
            >
          </template>
        </div>

        <button
          class="hamburger-btn"
          :class="{ 'is-active': isMenuOpen }"
          @click="toggleMenu"
          aria-label="メニューを開く"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <nav v-show="isMenuOpen" class="fullscreen-menu">
        <div class="menu-content">
          <ul class="menu-list">
            <li class="menu-item">
              <RouterLink to="/" @click="closeMenu">TOP</RouterLink>
            </li>

            <template v-if="!authStore.isLoggedIn">
              <li class="menu-item">
                <RouterLink to="/login" @click="closeMenu">ログイン</RouterLink>
              </li>
              <li class="menu-item">
                <RouterLink to="/register" @click="closeMenu"
                  >ユーザー登録</RouterLink
                >
              </li>
            </template>

            <template v-else>
              <li class="menu-item">
                <RouterLink to="/mypage" @click="closeMenu"
                  >マイページ</RouterLink
                >
              </li>
              <li class="menu-item" v-if="authStore.isAdmin">
                <RouterLink to="/admin" @click="closeMenu">管理画面</RouterLink>
              </li>
            </template>

            <li class="menu-item">
              <RouterLink to="/menu" @click="closeMenu"
                >MENU (ゲーム選択)</RouterLink
              >
            </li>

            <li class="menu-item" v-if="authStore.isLoggedIn">
              <a href="#" @click.prevent="handleLogout" class="logout-link"
                >ログアウト</a
              >
            </li>
          </ul>
        </div>
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

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();

// メニューの開閉状態
const isMenuOpen = ref(false);

/**
 * メニューの切り替え
 */
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

/**
 * メニューを閉じる (リンククリック時など)
 */
const closeMenu = () => {
  isMenuOpen.value = false;
};

/**
 * ログアウト処理
 */
const handleLogout = () => {
  closeMenu();
  authStore.logout();
  notificationStore.addNotification("ログアウトしました", "success");
  router.push("/login");
};
</script>

<style lang="scss" scoped>
.app-header {
  $parent: &;
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: $green;

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
    padding: 1rem 0;
    display: flex;
    align-items: center;
    @include fluid-style(gap, 8, 16);

    @include hover {
      #{$parent}__logo-icon {
        stroke: $yellow;
        fill: $yellow;
      }

      #{$parent}__title {
        color: $yellow;
      }
    }
  }

  &__logo-icon {
    @include fluid-style(width, 26, 40);
    stroke: $white;
    fill: $white;
    transition: fill 0.3s ease-out, stroke 0.3s ease-out;
  }

  &__title {
    @include fluid-text(20, 30);
    font-family: $roboto-mono;
    font-weight: $bold;
    color: $white;
    letter-spacing: 0.05em;
    transition: color 0.3s ease-out;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}

/* PC用アクションボタン (スマホでは消す) */
.pc-actions {
  display: none; /* デフォルトは非表示(SP) */
  align-items: center;
  gap: 1rem;

  @media (min-width: 768px) {
    display: flex; /* PC以上で表示 */
  }

  .user-name {
    font-size: 0.9rem;
    color: $white;
    margin-right: 0.5rem;
  }
}

/* 共通ボタンのスタイル */
.header-btn {
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 100vmax;
  color: $white;
  transition: color 0.3s ease-out, background-color 0.3s ease-out,
    border 0.3s ease-out;

  &--fill {
    background-color: $white;
    color: $black;

    @include hover {
      color: white;
      background-color: $yellow;
    }
  }

  &--outline {
    border: 1px solid $white;
    color: $white;

    @include hover {
      background-color: $white;
      color: $green;
    }
  }
}

/* ハンバーガーボタン */
.hamburger-btn {
  display: block;
  position: relative;
  width: 30px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1002;

  span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: $white;
    border-radius: 2px;
    transition: all 0.3s;

    &:nth-of-type(1) {
      top: 0;
    }
    &:nth-of-type(2) {
      top: 11px;
    }
    &:nth-of-type(3) {
      bottom: 0;
    }
  }

  /* 開いた時のバッテンアニメーション */
  &.is-active span {
    &:nth-of-type(1) {
      transform: translateY(11px) rotate(45deg);
    }
    &:nth-of-type(2) {
      opacity: 0;
    }
    &:nth-of-type(3) {
      transform: translateY(-11px) rotate(-45deg);
    }
  }
}

/* 全画面メニュー */
.fullscreen-menu {
  position: fixed;
  top: 60px; /* ヘッダーの下から */
  left: 0;
  width: 100%;
  height: calc(100vh - 60px);
  background-color: $green;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;

  .menu-content {
    text-align: center;
    width: 100%;
  }

  .menu-list {
    list-style: none;
    padding: 0;
  }

  .menu-item {
    margin: 1.5rem 0;

    a {
      font-size: 1.5rem;
      font-weight: bold;
      color: $white;
      text-decoration: none;
      display: inline-block;
      transition: color 0.3s ease-out;

      @include hover {
        color: $yellow;
      }
    }

    .logout-link {
      color: $red;
    }
  }
}

/* トランジション（フェード） */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>