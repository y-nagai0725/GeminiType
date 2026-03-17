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
import { useNotificationStore } from "../stores/notificationStore";

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();
</script>

<style lang="scss" scoped>
.notification {
  position: fixed;
  top: calc($header-height-sp + 3.2rem);
  right: 2rem;
  z-index: 9999;

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
  }

  &__item {
    padding: 1em;
    font-weight: $bold;
    @include fluid-text(12, 16);
    color: $white;
    border-radius: $radius-md;
    cursor: pointer;

    // 成功時の通知
    &--success {
      background-color: $green;
    }

    // エラー時の通知
    &--error {
      background-color: $red;
    }
  }
}

// TODO 通知のアニメーション、最後の一つが消えるときへんなかんじになるのを解決したい
/* --- フワッて動かす「アニメーション」 --- */
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(30px); /* 右からスライドイン */
}
.notification-fade-leave-active {
  position: absolute; /* 消えるとき、下のが「ガクッ」てならないように！ */
}
</style>