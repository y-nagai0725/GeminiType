<template>
  <Transition name="fade">
    <div v-if="show" class="scroll-hint">
      <span class="scroll-hint__text">スワイプできます</span>
      <ArrowIcon class="scroll-hint__icon" />
    </div>
  </Transition>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// =========================================================================
// Props & Emits
// =========================================================================
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.scroll-hint {
  position: absolute;
  top: 50%;
  right: 1.6rem;
  display: flex;
  gap: 0.8rem;
  align-items: center;
  padding: 0.8rem 1.6rem;

  /* ヒントの上を指でスワイプしても、
     後ろにある要素がスクロールするように操作を透過させるため */
  pointer-events: none;

  /* 背景の画像や文字と同化して見えなくなるのを防ぐために、少し透ける黒を敷く */
  background-color: rgba($black, 0.65);
  border-radius: 100vmax;
  box-shadow: 0 2px 8px rgba($black, 0.15);
  transform: translateY(-50%);

  /* PCでは横スクロールを発生させないデザインなので、ヒント自体を隠す */
  @include pc {
    display: none;
  }

  &__text {
    @include fluid-text(12, 14);

    font-weight: $bold;
    line-height: 1;
    color: $white;
    letter-spacing: 0.05em;
  }

  &__icon {
    width: 1.2rem;
    fill: $white;
  }
}

/* =======================================================================
 * トランジション（アニメーション）の設定
 * ======================================================================= */

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base, transform $transition-base;
}

/* 少し右側からフワッとスライドしてくるアニメーション。 */
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(10px, -50%);
}
</style>