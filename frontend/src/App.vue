<template>
  <RouterView />

  <NotificationDisplay />
</template>

<script setup>
import { RouterView } from "vue-router";
import NotificationDisplay from './components/NotificationDisplay.vue';
</script>

<style lang="scss" scoped>
/* ここに「アプリ全体」に当てたいスタイル（背景色とか）を書けるよ！
  でも、いったんカラっぽでもOK！
*/
</style>