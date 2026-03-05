<template>
  <Transition name="modal-fade">
    <div v-if="show" class="confirm-modal-overlay" @click.self="handleCancel">
      <div class="confirm-modal">
        <button @click="handleCancel" class="confirm-modal__close">
          <PlusIcon class="confirm-modal__close-icon" />
        </button>
        <p class="confirm-modal__title">{{ title }}</p>

        <p class="confirm-modal__message">{{ message }}</p>

        <div class="confirm-modal__actions">
          <button
            class="confirm-modal__button confirm-modal__button--cancel"
            @click="handleCancel"
          >
            キャンセル
          </button>
          <button
            class="confirm-modal__button confirm-modal__button--confirm"
            @click="handleConfirm"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import PlusIcon from "@/components/icons/PlusIcon.vue";
/**
 * props定義
 */
const props = defineProps({
  show: {
    // 表示・非表示
    type: Boolean,
    required: true,
  },
  title: {
    // モーダルのタイトル
    type: String,
    required: true,
  },
  message: {
    // モーダルのメッセージ
    type: String,
    required: true,
  },
});

/**
 * emit定義
 */
const emit = defineEmits(["confirm", "cancel"]);

/**
 * confirm
 */
const handleConfirm = () => {
  emit("confirm");
};

/**
 * キャンセル
 */
const handleCancel = () => {
  emit("cancel");
};
</script>

<style lang="scss" scoped>
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.33);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  display: flex;
  flex-direction: column;
  @include fluid-style(gap, 16, 24);
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-inline: 2rem;
  @include fluid-style(padding, 16, 24);
  border-radius: $radius-md;
  background-color: $white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);

  &__close {
    position: absolute;
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);
    cursor: pointer;
    color: $black;
    transform: rotate(45deg);
    transition: color $transition-base;

    @include hover {
      color: $red;
    }
  }

  &__close-icon {
    width: 100%;
    fill: currentColor;
  }

  &__title {
    font-weight: $bold;
    @include fluid-text(16, 18);
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__message {
    @include fluid-text(12, 14);
  }

  &__actions {
    display: flex;
    justify-content: space-around;
    gap: 2.4rem;
  }

  &__button {
    flex-grow: 1;
    padding: 1em;
    font-weight: $bold;
    @include fluid-text(12, 14);
    border-radius: $radius-sm;
    cursor: pointer;

    &--cancel {
      @include button-style-border($black);
    }

    &--confirm {
      @include button-style-fill($red);
    }
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .confirm-modal {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  .confirm-modal {
    transition: transform $transition-base;
  }
}
</style>