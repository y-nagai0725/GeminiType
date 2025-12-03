<template>
  <RouterView />

  <NotificationDisplay />

  <MouseStalker />
</template>

<script setup>
import { RouterView } from "vue-router";
import NotificationDisplay from './components/NotificationDisplay.vue';
import MouseStalker from './components/MouseStalker.vue';
</script>

<style lang="scss" scoped>
/* ここに「アプリ全体」に当てたいスタイル（背景色とか）を書けるよ！
  でも、いったんカラっぽでもOK！
*/
</style>