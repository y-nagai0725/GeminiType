<template>
  <Transition name="submenu-fade">
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
              <a href="#" class="submenu__link" @click.prevent="handleLogout">
                <span class="submenu__link-title-wrapper">
                  <span class="submenu__link-title-en">LOGOUT</span>
                  <span class="submenu__link-title-jp">ログアウト</span>
                </span>
                <LogoutIcon class="submenu__link-icon" />
              </a>
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
          <template v-if="authStore.isLoggedIn && authStore.canAccessAdmin">
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
  </Transition>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
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

// =========================================================================
// State (状態管理)
// =========================================================================

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
 * サブメニューを表示するルート名（画面一覧）
 * ※全画面で表示するわけではなく、特定の機能画面のフッター手前でのみ表示させるため
 */
const allowedRoutes = [
  "menu",
  "typing-setup",
  "typing-play",
  "typing-result",
  "mypage",
  "session-detail",
  "admin",
  "not-found",
];

// =========================================================================
// Getters (算出状態)
// =========================================================================

/**
 * サブメニューの表示・非表示判定
 * 現在開いている画面のルート名が allowedRoutes に含まれているかチェックします
 */
const isVisible = computed(() => {
  const routeName = route.name;
  return allowedRoutes.includes(routeName);
});

// =========================================================================
// Actions (処理)
// =========================================================================

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
    @include contents-width;
    @include fluid-style(gap, 32, 48);

    display: grid;
    grid-template-columns: 1fr;
    align-items: center;

    /* PC版ではタイトルとリンク一覧を左右に並べるために2カラムにする */
    @include pc {
      grid-template-columns: 1fr 1fr;
      gap: 0;
      align-items: flex-start;
    }
  }

  &__title-wrapper {
    @include fluid-style(gap, 16, 24);

    display: flex;
    flex-direction: column;
    align-items: center;

    @include pc {
      align-items: flex-start;
    }
  }

  &__title-en {
    @include fluid-text(24, 48);

    font-family: $roboto-mono;
    font-weight: $bold;
    line-height: 1;
    letter-spacing: 0.05em;
  }

  &__title-jp {
    @include fluid-text(14, 18);

    font-weight: $bold;
    line-height: 1;
    color: $green;
    letter-spacing: 0.1em;
  }

  &__list {
    @include fluid-style(gap, 24, 40, $max-vw: 1920);

    display: flex;
    flex-direction: column;
    align-items: center;

    /* PC版ではリンクボタンを横並びにして、はみ出したら折り返すようにする */
    @include pc {
      flex-flow: row wrap;
      justify-content: space-between;
    }
  }

  &__link {
    @include fluid-style(width, 240, 280, $max-vw: 1920);
    @include fluid-style(padding, 20, 24);

    display: flex;
    align-items: center;
    justify-content: space-between;

    /* 全体がクリック可能であることをユーザーに直感的に伝える */
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
    @include fluid-style(gap, 12, 16);

    display: flex;
    flex-direction: column;
  }

  &__link-title-en {
    @include fluid-text(12, 16);

    font-family: $roboto-mono;
    font-weight: $bold;
    line-height: 1;
    color: $green;
    letter-spacing: 0.05em;
  }

  &__link-title-jp {
    @include fluid-text(16, 20);

    font-weight: $bold;
    line-height: 1;
    letter-spacing: 0.1em;
  }

  &__link-icon {
    @include fluid-style(width, 30, 40);

    /* アイコンが潰れてしまわないように、確実に完全な正方形を保つ */
    aspect-ratio: 1;
    fill: $green;
  }
}

/* =======================================================================
 * トランジション（アニメーション）の設定
 * ======================================================================= */

// 現れるとき
.submenu-fade-enter-active {
  transition: opacity $transition-base;

  /* メイン部分のフェードアウトアニメーション（0.3秒）が終わるのを待ってから
     サブメニューをフワッと表示させるための遅延 */
  transition-delay: 0.3s;
}

// 消える時
.submenu-fade-leave-active {
  transition: opacity $transition-base;
}

.submenu-fade-enter-from,
.submenu-fade-leave-to {
  opacity: 0;
}
</style>