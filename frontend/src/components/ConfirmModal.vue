<template>
  <Teleport to="body">
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
  </Teleport>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import PlusIcon from "@/components/icons/PlusIcon.vue";

// =========================================================================
// Props & Emits (親コンポーネントとのやり取り)
// =========================================================================

/**
 * 親コンポーネントから受け取るデータ
 */
const props = defineProps({
  // 表示・非表示
  show: {
    type: Boolean,
    required: true,
  },
  // モーダルのタイトル
  title: {
    type: String,
    required: true,
  },
  // モーダルのメッセージ
  message: {
    type: String,
    required: true,
  },
});

/**
 * 親コンポーネントへ送るイベント
 */
const emit = defineEmits(["confirm", "cancel"]);

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * 実行ボタンが押された時の処理
 */
const handleConfirm = () => {
  emit("confirm");
};

/**
 * キャンセルボタン（または背景）が押された時の処理
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

  /* Teleport でbody直下に配置し、ヘッダーより前面に表示させる */
  z-index: $z-modal-overlay;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: $modal-overlay-color;
}

.confirm-modal {
  @include fluid-style(gap, 16, 24);
  @include fluid-style(padding, 16, 24);

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;

  /* スマホなど画面が狭い時に、画面の端にピタッとくっつかないようにするための余白 */
  margin-inline: 2rem;
  background-color: $white;
  border-radius: $radius-md;
  box-shadow: $modal-box-shadow;

  &__close {
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);

    position: absolute;
    color: $black;
    cursor: pointer;

    /* PlusIconを45度回転させて、閉じる用のバツ印（×）にする */
    transform: rotate(45deg);
    transition: color $transition-base;

    @include hover {
      color: $red;
    }
  }

  &__close-icon {
    width: 100%;
    fill: currentcolor;
  }

  &__title {
    @include fluid-text(16, 18);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__message {
    @include fluid-text(12, 14);
  }

  &__actions {
    display: flex;
    gap: 2.4rem;
    justify-content: space-around;
  }

  &__button {
    @include fluid-text(12, 14);

    flex-grow: 1;
    padding: 1em;
    font-weight: $bold;
    cursor: pointer;
    border-radius: $radius-sm;

    &--cancel {
      @include button-style-border($black);
    }

    &--confirm {
      @include button-style-fill($red);
    }
  }
}

/* * トランジション（アニメーション）の設定
 * 背景（オーバーレイ）はフワッと表示されつつ、
 * 中身のモーダル本体は「少し上からフワッと降りてくる」ような動きにする
 */
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