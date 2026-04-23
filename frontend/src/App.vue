<template>
  <div class="app-container">
    <AppHeader class="header" />

    <Simplebar id="app-main-scroll" class="app-scroll-area" ref="scrollAreaRef">
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <Submenu class="submenu" />
      <AppFooter class="footer" />
    </Simplebar>

    <NotificationDisplay />
    <MouseStalker />
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, watch } from "vue";
import { useRoute, RouterView } from "vue-router";
import Simplebar from "simplebar-vue";
import gsap from "gsap";

// コンポーネントの読み込み
import AppHeader from "@/components/AppHeader.vue";
import AppFooter from "@/components/AppFooter.vue";
import Submenu from "@/components/Submenu.vue";
import NotificationDisplay from "@/components/NotificationDisplay.vue";
import MouseStalker from "@/components/MouseStalker.vue";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * 現在のルート情報（URLの変化を検知するため）
 * @type {import('vue-router').RouteLocationNormalizedLoaded}
 */
const route = useRoute();

/**
 * Simplebar要素への参照 (ref)
 * DOMに直接アクセスして、画面遷移時にスクロール位置を操作するために使用
 * @type {import('vue').Ref<any>}
 */
const scrollAreaRef = ref(null);

// =========================================================================
// GSAP アニメーション制御
// =========================================================================

/**
 * アニメーション設定
 * @returns {void}
 */
const setAnimation = () => {
  // timeline作成
  const tl = gsap.timeline();

  // 初期状態で透明にしているのを解除
  tl.set(".app-container", { visibility: "visible" });

  // ヘッダー、メイン、フッターを順番に出現させる
  tl.from(".header", {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out",
  })
    .from(
      ".app-main",
      { opacity: 0, duration: 1, ease: "power2.out" },
      "-=0.65"
    )
    .from(
      [".submenu", ".footer"],
      {
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
      },
      "-=0.2"
    );
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * マウント時処理
 */
onMounted(() => {
  setAnimation();
});

// =========================================================================
// Watchers (監視処理)
// =========================================================================

/**
 * ページ遷移（URLの変化）を監視して、スクロール位置をトップに戻す
 */
watch(
  () => route.path,
  () => {
    /* 前の画面がフェードアウトするアニメーション（0.3秒）が終わるのを待ってから
       スクロール位置を戻すことで、画面遷移中の不自然なガタつきを防ぐ */
    setTimeout(() => {
      // scrollAreaRef が存在しているかチェック
      if (scrollAreaRef.value) {
        // Simplebar独自のスクロール要素を取得する
        const scrollElement = scrollAreaRef.value.SimpleBar?.getScrollElement();

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
  visibility: hidden;
  width: 100%;
  height: 100svh;

  /* 外側は絶対にスクロールさせず、中のSimplebarでスクロールさせる */
  overflow: hidden;
}

.header,
.footer,
.submenu {
  will-change: transform, opacity;
}

/* =========================================================================
 * Simplebarのスクロール領域
 * ========================================================================= */
#app-main-scroll {
  width: 100%;
  height: 100%;

  /* --- スクロールバーのデザインカスタマイズ --- */
  &:deep(> .simplebar-track.simplebar-vertical) {
    @include fluid-style(width, 9, 11);

    /* ヘッダーの下からスクロールバーが始まるように位置を調整 */
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

  /* --- コンテンツラッパーの高さ調整 ---
    コンテンツ量が少ない画面でも、フッターが浮き上がらずに
    画面の一番下に配置する指定 */
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

/* =========================================================================
 * メインコンテンツ部分
 * ========================================================================= */
.app-main {
  /* コンテンツが少なくてもフッターを下に固定する（上のflex-direction: columnとセット） */
  flex-grow: 1;

  /* ヘッダーが上に被さっている分、メインコンテンツの開始位置を押し下げる */
  padding-top: $header-height-sp;

  @include tab {
    padding-top: $header-height-tab;
  }

  @include pc {
    padding-top: $header-height-pc;
  }
}

/* =========================================================================
 * ページ遷移のアニメーション (fade)
 * ========================================================================= */

// 入ってくる時と、出ていく時の動き方
.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

// 入ってくる時の「最初の状態」と、出ていく時の「最後の状態」
.fade-enter-from,
.fade-leave-to {
  opacity: 0; // フワッと透明に消える・現れる
}
</style>