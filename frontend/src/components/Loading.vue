<template>
  <div class="loading" :class="[`bg-${bgColor}`, `line-${lineColor}`]">
    {{ text }}
  </div>
</template>
<script setup>
/**
 * Props定義
 */
const props = defineProps({
  // 表示テキスト
  text: { type: String, required: true },
  // 背景色
  bgColor: { type: String, default: "gray" },
  // 線の色
  lineColor: { type: String, default: "green" },
});
</script>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  @include fluid-style(gap, 10, 16);
  @include fluid-text(12, 16);

  &::after {
    content: "";
    width: 2em;
    aspect-ratio: 1;
    border-radius: 100vmax;
    border-width: 4px;
    border-style: solid;
    border-color: $gray;
    border-top-color: $green;
    animation: spin 1s linear infinite;
  }

  &.bg-white::after {
    border-color: $white;
  }

  &.bg-gray::after {
    border-color: $gray;
  }

  &.bg-black::after {
    border-color: $black;
  }

  &.line-green::after {
    border-top-color: $green;
  }

  &.line-blue::after {
    border-top-color: $blue;
  }

  &.line-orange::after {
    border-top-color: $orange;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>