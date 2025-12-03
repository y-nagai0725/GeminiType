<template>
  <div
    class="mouse-stalker"
    :class="{ 'is-hovering': isHovering }"
    :style="stalkerStyle"
  ></div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

// マウス座標
const mouseX = ref(0);
const mouseY = ref(0);

// ホバー状態かどうか
const isHovering = ref(false);

// ストーカーの位置スタイル
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

  // ホバー判定 (aタグ または buttonタグの上にあるか？)
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
  /* 基本スタイル */
  position: fixed;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(
    0,
    123,
    255,
    0.5
  ); /* 半透明の青 (お兄ちゃんの好きな色に変えてね！) */
  pointer-events: none; /* マウスイベントを邪魔しないように！これ大事！ */
  z-index: 9999; /* 一番上に表示 */

  /* 中心をマウス座標に合わせるための調整 */
  margin-top: -10px;
  margin-left: -10px;

  /* ★ポイント: アニメーション設定 */
  transition: transform 0.1s ease-out,
    /* ちょっと遅れてついてくる演出 */ width 0.3s, height 0.3s,
    background-color 0.3s, margin 0.3s; /* 大きさ変化用 */

  /* PC以外（タッチデバイス）では非表示にする */
  @media (hover: none) {
    display: none;
  }
}

/* ホバー時のスタイル拡大 */
.mouse-stalker.is-hovering {
  width: 50px;
  height: 50px;
  margin-top: -25px; /* 中心位置の補正 */
  margin-left: -25px;
  background-color: rgba(0, 123, 255, 0.2); /* 少し薄くする */
}
</style>