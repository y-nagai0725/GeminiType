<template>
  <Transition name="modal-fade">
    <div v-if="show" class="confirm-modal-overlay" @click.self="handleCancel">
      <div class="confirm-modal">
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
  width: 100%;
  max-width: 400px;
  margin-inline: 2rem;
  @include fluid-style(padding, 16, 24);
  border-radius: $radius-md;
  background-color: $white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);

  &__title {
    font-weight: $bold;
    @include fluid-text(14, 16);
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
      @include button-style-fill($black);
    }

    &--confirm {
      @include button-style-fill($red);
    }
  }
}

/* (★) 「入ってくる『前』」と「出ていった『後』」の「状態」 */
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0; /* (★) 「背景（overlay）」は「透明」 */

  .confirm-modal {
    /* (★) 「モーダル本体（box）」は「上」にいる */
    transform: translateY(-20px);
  }
}

/* (★) 「入ってる『間』」と「出ていってる『間』」の「アニメーション」の「設定」 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  /* (★) (★) (★)
       ここが「v10.1」 の「修正」 ポイント！
     (★) (★) (★) */

  /* (★) 「背景（overlay）」は「0.2秒」かけて「透明度（opacity）」を「フワッ」 て変えてね！ */
  transition: opacity 0.2s ease;

  .confirm-modal {
    /* (★) 「モーダル本体（box）」は「0.2秒」かけて「場所（transform）」を「フワッ」 て変えてね！ */
    transition: transform 0.2s ease;
  }
}
</style>