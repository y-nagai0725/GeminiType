<template>
  <div
    class="mouse-stalker"
    :class="{ 'is-hovering': isHovering }"
    :style="stalkerStyle"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

/**
 * マウスX座標
 */
const mouseX = ref(0);

/**
 * マウスY座標
 */
const mouseY = ref(0);

/**
 * ホバー状態かどうか
 */
const isHovering = ref(false);

/**
 * ストーカーの位置スタイル
 */
const stalkerStyle = computed(() => {
  return {
    transform: `translate(${mouseX.value}px, ${mouseY.value}px)`,
  };
});

/**
 * マウスが動いたときの処理
 */
const handleMouseMove = (e) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;

  // ホバー判定 (aタグ または buttonタグ)
  const target = e.target;
  if (target.closest("a") || target.closest("button")) {
    isHovering.value = true;
  } else {
    isHovering.value = false;
  }
};

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style lang="scss" scoped>
.mouse-stalker {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: $green;
  opacity: 0.6;
  pointer-events: none;

  /* 中心をマウス座標に合わせるための調整 */
  margin-top: -1rem;
  margin-left: -1rem;

  /* アニメーション設定 */
  transition: transform 0.1s ease-out, width $transition-base,
    height $transition-base, opacity $transition-base, margin $transition-base;

  /* PC以外（タッチデバイス）では非表示にする */
  @media (hover: none) {
    display: none;
  }

  /* ホバー時のスタイル拡大 */
  &.is-hovering {
    width: 5rem;
    height: 5rem;
    margin-top: -2.5rem;
    margin-left: -2.5rem;
    opacity: 0.3;
  }
}
</style>