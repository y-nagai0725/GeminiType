<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="try-modal__overlay" @click.self="handleClose">
        <div
          class="try-modal__content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="try-modal-title"
        >
          <button
            type="button"
            @click="handleClose"
            class="try-modal__close"
            aria-label="モーダルを閉じる"
          >
            <PlusIcon class="try-modal__close-icon" aria-hidden="true" />
          </button>

          <h2 id="try-modal-title" class="try-modal__title">試し打ち</h2>

          <div class="try-modal__sound-settings">
            <label class="try-modal__sound-label">
              <input
                type="checkbox"
                class="try-modal__sound-checkbox"
                v-model="settingsStore.soundEnabled"
                @change="settingsStore.saveSettings"
              />
              タイプ音
            </label>
            <label class="try-modal__sound-label">
              <input
                type="checkbox"
                class="try-modal__sound-checkbox"
                v-model="settingsStore.missSoundEnabled"
                @change="settingsStore.saveSettings"
              />
              ミス音
            </label>
          </div>

          <TypingCore
            v-if="problem"
            :problems="[problem]"
            :showDebug="showDebug"
            :isTryMode="true"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from "vue";
import { useSettingsStore } from "@/stores/settingsStore";
import TypingCore from "@/components/TypingCore.vue";
import PlusIcon from "@/components/icons/PlusIcon.vue";

// =========================================================================
// Props & Emits
// =========================================================================

/**
 * Props定義
 * @type {import('vue').DefineProps<{
 * show: boolean,
 * problem: Object|null,
 * showDebug: boolean
 * }>}
 */
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  problem: {
    type: Object,
    default: null,
  },
  showDebug: {
    type: Boolean,
    default: false,
  },
});

/**
 * Emits定義
 * @type {import('vue').DefineEmits<{(e: 'close'): void}>}
 */
const emit = defineEmits(["close"]);

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * 設定管理用のストア
 */
const settingsStore = useSettingsStore();

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * モーダルを閉じるイベントを発火する
 * @returns {void}
 */
const handleClose = () => {
  emit("close");
};

/**
 * ESCキーが押下された際にモーダルを閉じる
 * @param {KeyboardEvent} e - キーボードイベント
 * @returns {void}
 */
const handleEscClose = (e) => {
  if (e.key === "Escape") {
    handleClose();
  }
};

// =========================================================================
// ライフサイクル & ウォッチャー
// =========================================================================

// モーダルが開いている時のみ、ESCキーのイベントリスナーを登録する
watch(
  () => props.show,
  (isShown) => {
    if (isShown) {
      window.addEventListener("keydown", handleEscClose);
    } else {
      window.removeEventListener("keydown", handleEscClose);
    }
  }
);

// コンポーネント破棄時にイベントリスナーを確実に削除する
onUnmounted(() => {
  window.removeEventListener("keydown", handleEscClose);
});
</script>

<style lang="scss" scoped>
.try-modal {
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
    @include fluid-style(padding, 16, 24);

    position: relative;
    z-index: $z-modal-content;
    width: 100%;
    max-width: 90rem; /* TypingCoreが崩れないように十分な幅を確保 */
    margin-inline: 2rem;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
  }

  &__close {
    @include fluid-style(top, 16, 24);
    @include fluid-style(right, 16, 24);
    @include fluid-style(width, 16, 24);
    @include fluid-style(height, 16, 24);

    position: absolute;
    color: $black;
    cursor: pointer;
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
    @include fluid-style(margin-bottom, 10, 16);
    @include fluid-text(16, 18);

    font-weight: $bold;
    text-align: center;
    letter-spacing: 0.1em;
  }

  &__sound-settings {
    @include fluid-style(gap, 16, 24);
    @include fluid-style(margin-bottom, 10, 16);

    display: flex;
    justify-content: flex-end;
  }

  &__sound-label {
    @include fluid-text(12, 14);

    display: flex;
    align-items: center;
    font-weight: $bold;
    cursor: pointer;
    user-select: none;
    transition: opacity $transition-base;

    @include hover {
      opacity: 0.7;
    }
  }

  &__sound-checkbox {
    position: relative;
    display: inline-block;
    width: 1em;
    aspect-ratio: 1;
    margin-right: 1em;
    background-color: $gray;
    border: 1px solid $black;
    border-radius: $radius-sm;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 40%;
      content: "";
      border-bottom: 2px solid $green;
      border-left: 2px solid $green;
      opacity: 0;
      transform: translate(-50%, calc(-50% - 1px)) rotate(-45deg);
      transition: opacity $transition-base;
    }

    &:checked::after {
      opacity: 1;
    }
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  /* stylelint-disable-next-line selector-class-pattern */
  .try-modal__content {
    transform: translateY(-20px);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity $transition-base;

  /* stylelint-disable-next-line selector-class-pattern */
  .try-modal__content {
    transition: transform $transition-base;
  }
}
</style>