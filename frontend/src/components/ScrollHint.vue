<template>
  <Transition name="fade">
    <div v-if="show" class="scroll-hint">
      <span class="scroll-hint__text">スワイプできます</span>
      <ArrowIcon class="scroll-hint__icon" />
    </div>
  </Transition>
</template>

<script setup>
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

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
  transform: translateY(-50%);

  display: flex;
  align-items: center;
  gap: 0.8rem;

  padding: 0.8rem 1.6rem;
  border-radius: 100vmax;
  background-color: rgba($black, 0.65); // 半透明の黒背景
  box-shadow: 0 2px 8px rgba($black, 0.15); // 少しだけ影をつける

  pointer-events: none;
  z-index: 5;

  @include pc {
    display: none;
  }

  &__text {
    font-weight: $bold;
    @include fluid-text(12, 14);
    color: $white;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  &__icon {
    width: 1.2rem;
    fill: $white;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base, transform $transition-base;
}

// 少し右からフワッとスライドしてくるアニメーション
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(10px, -50%);
}
</style>