<template>
  <div class="notification-container">
    <transition-group name="notification-fade" tag="div">
      <div
        v-for="notification in store.notifications"
        :key="notification.id"
        :class="['notification-item', `notification-item--${notification.type}`]"
        @click="store.removeNotification(notification.id)"
      >
        {{ notification.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../stores/notificationStore';

const store = useNotificationStore();
</script>

<style lang="scss" scoped>
/* (BEM) ブロック: .notification-container */
.notification-container {
  /* 画面の「右上」に固定するよ！ */
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999; /* ぜったい一番「上」に来るように！ */
  display: flex;
  flex-direction: column;
  gap: 10px; /* お知らせ同士の間隔 */
}

/* (BEM) エレメント: .notification-item */
.notification-item {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer; /* クリックで消せるように */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  /* (BEM) モディファイア: --success (成功の緑色♡) */
  &--success {
    background-color: #4CAF50;
  }

  /* (BEM) モディファイア: --error (失敗の赤色♡) */
  &--error {
    background-color: #F44336;
  }
}

/* --- フワッて動かす「アニメーション」 --- */
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: all 0.5s ease;
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