<template>
  <Transition name="fade">
    <div v-if="show" class="scroll-hint">
      <span class="scroll-hint__text">横にスクロールできます</span>
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
// TODO デザインは仮
.scroll-hint {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 4.8rem;
  background: linear-gradient(
    to right,
    rgba($white, 0),
    rgba($white, 0.95) 40%
  );
  pointer-events: none;
  z-index: 5;

  @include pc {
    display: none;
  }

  &__text {
    writing-mode: vertical-rl;
    font-weight: $bold;
    @include fluid-text(12, 14);
    color: $green;
    letter-spacing: 0.1em;
  }

  &__icon {
    width: 2rem;
    fill: $green;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>