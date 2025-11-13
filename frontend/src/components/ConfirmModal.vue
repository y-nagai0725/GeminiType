<template>
  <Transition name="modal-fade">
    <div v-if="show" class="confirm-modal-overlay" @click.self="handleCancel">
      <div class="confirm-modal">
        <h3 class="confirm-modal__title">{{ title }}</h3>

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
// --- 1. 「外」から受け取る「お仕事リスト」 ---
const props = defineProps({
  show: {
    // (★) 見えるか・隠れるか
    type: Boolean,
    required: true,
  },
  title: {
    // (★) 「何を」しますか？ (例: "ジャンル の削除")
    type: String,
    required: true,
  },
  message: {
    // (★) 「本当に」いいですか？ (例: "本当に「JS」を消す？")
    type: String,
    required: true,
  },
});

// --- 2. 「外」に「叫ぶ（emit）」お仕事リスト ---
const emit = defineEmits(["confirm", "cancel"]);

// --- 3. 「魔法」たち ---
const handleConfirm = () => {
  emit("confirm"); // (★) 「OK」が押されたよ！って叫ぶ！
};
const handleCancel = () => {
  emit("cancel"); // (★) 「キャンセル」が押されたよ！って叫ぶ！
};
</script>

<style lang="scss" scoped>
/* (★) 「AdminView」 のモーダル と「ほぼ」同じスタイルだよ！ */

/* (★) モーダル の「背景（黒いモヤ）」 */
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* (BEM) ブロック: .confirm-modal */
.confirm-modal {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 400px; /* (★) 確認 だから、ちょっと「小さめ」 */
  text-align: center;

  &__title {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }

  &__message {
    font-size: 1rem;
    color: #555;
    margin-bottom: 2rem;
  }

  &__actions {
    display: flex;
    justify-content: space-around; /* (★) 2つのボタンを「両端」に離す */
    gap: 1rem;
  }

  /* (BEM) エレメント: .confirm-modal__button */
  &__button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    flex-grow: 1; /* (★) 2つのボタンが「同じ幅」になるように */

    /* (BEM) モディファイア: --cancel */
    &--cancel {
      background-color: #eee;
      color: #333;
      &:hover {
        background-color: #ddd;
      }
    }

    /* (BEM) モディファイア: --confirm */
    &--confirm {
      background-color: #dc3545; // (★) 削除 ボタン と「同じ赤色」！
      color: white;
      &:hover {
        background-color: #c82333;
      }
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