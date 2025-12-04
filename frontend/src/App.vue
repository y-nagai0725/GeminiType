<template>
  <div class="app-container">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>

    <AppFooter />

    <NotificationDisplay />
    <MouseStalker />
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import NotificationDisplay from "./components/NotificationDisplay.vue";
import MouseStalker from "./components/MouseStalker.vue";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 画面いっぱいの高さを確保 */
}

.main-content {
  flex: 1; /* ★ここ重要！余ったスペースを全部埋める！ */
  padding-top: 60px; /* ヘッダーの高さ分 */
  width: 100%;
  box-sizing: border-box;
}
</style>