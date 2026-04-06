<template>
  <div class="loading" :class="[`bg-${bgColor}`, `line-${lineColor}`]">
    {{ text }}
  </div>
</template>

<script setup>
const props = defineProps({
  // 何の処理を待っているかのテキスト
  text: { type: String, default: "" },
  // スピナーの軌道（ベースの円）の色
  bgColor: { type: String, default: "gray" },
  // くるくる回る線の色
  lineColor: { type: String, default: "green" },
});
</script>

<style lang="scss" scoped>
.loading {
  @include fluid-style(gap, 10, 16);
  @include fluid-text(12, 16);

  display: flex;
  flex-direction: column;
  align-items: center;

  /* ローディングのくるくる回る円（スピナー）本体 */
  &::after {
    width: 2em;
    aspect-ratio: 1;
    content: "";

    /* 全体の円（軌道）の色。 */
    border-color: $gray;
    border-style: solid;
    border-width: 4px;

    /* 上の1辺だけ色を変えることで、この色の部分がくるくる回るように見せる */
    border-top-color: $green;

    /* どんなサイズに変わっても絶対に真ん丸な円を保つための指定 */
    border-radius: 100vmax;

    /* linearを指定することで、カクカクせず一定の速度で滑らかに回り続けるようにする */
    animation: spin 1s linear infinite;
  }

  /* =======================================================================
   * Propsで渡された色に応じたカラーバリエーション
   * ======================================================================= */
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