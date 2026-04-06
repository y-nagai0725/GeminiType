<template>
  <div
    class="mouse-stalker"
    :class="{ 'is-hovering': isHovering }"
    :style="stalkerStyle"
  ></div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, computed, onMounted, onUnmounted } from "vue";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * マウスX座標
 */
const mouseX = ref(0);

/**
 * マウスY座標
 */
const mouseY = ref(0);

/**
 * ホバー状態かどうか (ボタン等に乗っているか)
 */
const isHovering = ref(false);

// =========================================================================
// Getters (算出状態)
// =========================================================================

/**
 * ストーカーの位置スタイルを動的に生成
 * (マウスの現在位置に translate で移動させる)
 */
const stalkerStyle = computed(() => {
  return {
    transform: `translate(${mouseX.value}px, ${mouseY.value}px)`,
  };
});

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * マウスが動いたときの処理 (座標の更新とホバー判定)
 * @param {MouseEvent} e - マウスイベント
 */
const handleMouseMove = (e) => {
  // マウスの現在座標を更新
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;

  // ホバー判定 (a, button, label, input, select, textarea のどれかに触れたらホバー状態にする)
  const target = e.target;
  if (target.closest("a, button, label, input, select, textarea")) {
    isHovering.value = true;
  } else {
    isHovering.value = false;
  }
};

// =========================================================================
// ライフサイクル
// =========================================================================

/**
 * コンポーネントが画面に表示された時
 */
onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
});

/**
 * コンポーネントが破棄される時
 */
onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style lang="scss" scoped>
.mouse-stalker {
  position: fixed;
  top: 0;
  left: 0;
  z-index: $z-mouse-stalker;
  width: 2rem;
  height: 2rem;

  /* 中心をマウス座標に合わせるための調整 */
  margin-top: -1rem;
  margin-left: -1rem;
  pointer-events: none; // ストーカー自身がクリックを邪魔しないように透過する
  background-color: $green;
  border-radius: 50%;
  opacity: 0.6;

  /* アニメーション設定 */
  transition: transform 0.1s ease-out, width $transition-base,
    height $transition-base, opacity $transition-base, margin $transition-base;

  /* PC以外（タッチデバイス）では非表示にする */
  @media (hover: none) {
    display: none;
  }

  /* ホバー時のスタイル（大きくして少し薄くする） */
  &.is-hovering {
    width: 5rem;
    height: 5rem;
    margin-top: -2.5rem;
    margin-left: -2.5rem;
    opacity: 0.3;
  }
}
</style>