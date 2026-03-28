<template>
  <div class="app-container">
    <AppHeader />

    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <Submenu />
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
import Submenu from "./components/Submenu.vue";
</script>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
  overflow: hidden;

  @include pc {
    min-height: 100vh;
  }
}

.main-content {
  flex: 1;
  width: 100%;
  padding-top: $header-height-sp;
  overflow: hidden;

  @include tab {
    padding-top: $header-height-tab;
  }

  @include pc {
    padding-top: $header-height-pc;
  }
}

// --- ページ遷移のアニメーション (fade) ---
// 入ってくる時と、出ていく時の動き方
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

// 入ってくる時の「最初の状態」と、出ていく時の「最後の状態」
.fade-enter-from,
.fade-leave-to {
  opacity: 0; // 透明にする
}
</style>