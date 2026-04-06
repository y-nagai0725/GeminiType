<template>
  <div class="notification">
    <transition-group
      name="notification-fade"
      tag="div"
      class="notification__item-wrapper"
    >
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="[
          'notification__item',
          `notification__item--${notification.type}`,
        ]"
        @click="notificationStore.removeNotification(notification.id)"
      >
        {{ notification.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { useNotificationStore } from "../stores/notificationStore";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();
</script>

<style lang="scss" scoped>
.notification {
  position: fixed;

  /* ヘッダーの高さ＋少しの余白を空けて、画面の右上に固定表示する */
  top: calc($header-height-sp + 3.2rem);
  right: 2rem;

  /* モーダルよりも手前に表示して、大事な通知が隠れないようにする */
  z-index: $z-toast;

  @include tab {
    top: calc($header-height-tab + 3.6rem);
  }

  @include pc {
    top: calc($header-height-pc + 4rem);
  }

  &__item-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    /* 文字の長さに合わせて右揃えで通知を積んでいくための指定 */
    align-items: flex-end;
  }

  &__item {
    @include fluid-text(12, 16);

    /* 親要素の幅に関わらず、文字の長さにぴったり合わせた横幅にする */
    width: max-content;

    /* 長いエラー文などで、スマホの画面幅を突き抜けてしまわないための安全装置 */
    max-width: 90vw;
    padding: 1em;
    font-weight: $bold;
    color: $white;

    /* ユーザーが「押せば消せる」と直感的にわかるようにする */
    cursor: pointer;
    border-radius: $radius-md;

    &--success {
      background-color: $green;
    }

    &--error {
      background-color: $red;
    }
  }
}

/* =======================================================================
 * トランジション（アニメーション）の設定
 * ======================================================================= */

/* 表示・非表示の切り替え中は「透明度」と「位置」を滑らかにアニメーションさせる */
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: opacity $transition-base, transform $transition-base;
}

/* 表示される瞬間（入ってくる前）と、消える瞬間（出ていく時）は、
   右側に30pxずらして透明にしておくことで、スッと横から入ってくる動きを作る */
.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 消える要素がレイアウトから外れる際に、
   下にある通知が「カクッ」と詰まらないようにする */
.notification-fade-leave-active {
  position: absolute;
  right: 0;
}
</style>