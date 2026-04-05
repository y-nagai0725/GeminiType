<template>
  <div class="app-container">
    <AppHeader />

    <Simplebar id="app-main-scroll" class="app-scroll-area" ref="scrollAreaRef">
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <Submenu />
      <AppFooter />
    </Simplebar>

    <NotificationDisplay />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute, RouterView } from "vue-router";
import Simplebar from "simplebar-vue";

// コンポーネントの読み込み
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import Submenu from "@/components/Submenu.vue";
import NotificationDisplay from "@/components/NotificationDisplay.vue";

/**
 * 現在のルート情報
 */
const route = useRoute();

/**
 * Simplebar要素への参照 (ref)
 */
const scrollAreaRef = ref(null);

/**
 * ページ遷移（URLの変化）を監視して、スクロール位置をトップに戻す
 */
watch(
  () => route.path,
  () => {
    // 前の画面がフェードアウトするのを待つ (300ms)
    setTimeout(() => {
      // scrollAreaRef がちゃんと存在しているかチェック
      if (scrollAreaRef.value) {
        // Simplebarのスクロール要素を取得する
        const scrollElement = scrollAreaRef.value.SimpleBar.getScrollElement();

        if (scrollElement) {
          // スクロール位置を一番上（0）に戻す
          scrollElement.scrollTop = 0;
        }
      }
    }, 300);
  }
);
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden; /* 外側は絶対にスクロールさせない */
}

/* Simplebarのスクロール領域 */
#app-main-scroll {
  width: 100%;
  height: 100%;

  /* =======================================================
   * スクロールバーのデザインカスタマイズ
   * ======================================================= */
  &:deep(> .simplebar-track.simplebar-vertical) {
    @include fluid-style(width, 9, 11);
    top: $header-height-sp;

    @include tab {
      top: $header-height-tab;
    }
    @include pc {
      top: $header-height-pc;
    }

    .simplebar-scrollbar::before {
      background-color: $blue;
    }
  }

  /* =======================================================
   * コンテンツラッパーの高さ調整
   * フッターを画面の一番下に押しやるために高さを100%確保する
   * ======================================================= */
  &:deep(
      > .simplebar-wrapper
        > .simplebar-mask
        > .simplebar-offset
        > .simplebar-content-wrapper
        > .simplebar-content
    ) {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
}

/* メインコンテンツ部分 */
.app-main {
  flex-grow: 1; /* コンテンツが少なくてもフッターを下に固定する */
  /* ヘッダーの高さ分の余白を開ける */
  padding-top: $header-height-sp;

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