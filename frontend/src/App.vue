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
  min-height: 100svh;

  @include pc {
    min-height: 100vh;
  }
}

.main-content {
  flex: 1;
  width: 100%;
  padding-top: 60px;

  @include tab {
    padding-top: 70px;
  }

  @include pc {
    padding-top: 80px;
  }
}
</style>