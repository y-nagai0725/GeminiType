<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="warning-modal__overlay">
        <div
          class="warning-modal__content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="warning-modal-title"
          aria-describedby="warning-modal-desc"
        >
          <h2 id="warning-modal-title" class="warning-modal__title">
            プレイ環境について
          </h2>

          <div id="warning-modal-desc" class="warning-modal__message">
            <p>
              このゲームは<strong>物理キーボード</strong>でのプレイを想定しています。
            </p>
            <p>
              また、スマートフォンなど画面の狭い端末では、表示が崩れる場合があります。
            </p>
            <p class="warning-modal__highlight">
              PC環境でのプレイを強く推奨します。
            </p>
          </div>

          <div class="warning-modal__actions">
            <button
              type="button"
              @click="$emit('cancel')"
              class="warning-modal__button warning-modal__button--cancel"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              @click="$emit('play')"
              class="warning-modal__button warning-modal__button--play"
            >
              そのままプレイ
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// =========================================================================
// Props & Emits
// =========================================================================

/**
 * Props定義
 * @type {import('vue').DefineProps<{
 * show: boolean,
 * cancelText?: string
 * }>}
 */
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  cancelText: {
    type: String,
    default: "キャンセル",
  },
});

/**
 * Emits定義
 * @type {import('vue').DefineEmits<{(e: 'cancel'): void, (e: 'play'): void}>}
 */
defineEmits(["cancel", "play"]);
</script>

<style lang="scss" scoped>
.warning-modal {
  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: $z-modal-overlay;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: $modal-overlay-color;
  }

  &__content {
    @include fluid-style(gap, 24, 32);
    @include fluid-style(padding, 24, 32);

    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 50rem;
    margin-inline: 2rem;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
  }

  &__title {
    @include fluid-text(18, 22);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__message {
    @include fluid-style(gap, 12, 16);
    @include fluid-text(14, 16);

    display: flex;
    flex-direction: column;
    line-height: 1.6;
    text-align: center;
  }

  &__highlight {
    font-weight: $bold;
    color: $red;
  }

  &__actions {
    display: flex;
    gap: 1.6rem;
    justify-content: space-around;
  }

  &__button {
    @include fluid-text(12, 14);

    flex-grow: 1;
    padding: 1em;
    font-weight: $bold;
    text-align: center;
    cursor: pointer;
    border-radius: $radius-sm;

    &--cancel {
      @include button-style-border($black, $hover-action: "none");
    }

    &--play {
      @include button-style-fill($green, $hover-action: "none");
    }
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  /* stylelint-disable-next-line selector-class-pattern */
  .warning-modal__content {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  /* stylelint-disable-next-line selector-class-pattern */
  .warning-modal__content {
    transition: transform $transition-base;
  }
}
</style>