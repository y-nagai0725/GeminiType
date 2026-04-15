import { ref } from "vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * スクロールヒントを非表示にするスクロール量の閾値 (px)
 * @type {number}
 */
const HIDE_THRESHOLD_PX = 5;

// =========================================================================
// コンポーザブル
// =========================================================================

/**
 * 横スクロールヒントの表示状態とスクロール位置リセットを管理するコンポーザブル
 * @returns {{
 * isHidden: import('vue').Ref<boolean>,
 * scrollRef: import('vue').Ref<any>,
 * handleScroll: (event: Event) => void,
 * resetScroll: () => void
 * }}
 */
export const useScrollHint = () => {
  /**
   * スクロールヒントが非表示になっているかどうかの状態フラグ
   * @type {import('vue').Ref<boolean>}
   */
  const isHidden = ref(false);

  /**
   * スクロール対象要素の参照 (template内のrefと紐付ける)
   * ※ simplebar-vue コンポーネント、または通常のDOM要素を想定
   * @type {import('vue').Ref<any>}
   */
  const scrollRef = ref(null);

  /**
   * スクロールイベントを検知し、一定量スクロールされたらヒントを非表示にする
   * @param {Event} event - スクロールイベントオブジェクト
   * @returns {void}
   */
  const handleScroll = (event) => {
    // すでにヒントが非表示の場合は処理をスキップ
    if (isHidden.value) return;

    const target = event.target;
    if (target && target.scrollLeft > HIDE_THRESHOLD_PX) {
      isHidden.value = true;
    }
  };

  /**
   * スクロール位置を左端(0)に戻し、ヒント表示を初期状態にリセットする
   * @returns {void}
   */
  const resetScroll = () => {
    isHidden.value = false;

    if (scrollRef.value) {
      // simplebar-vue コンポーネントでの使用を想定しています
      // simplebar-vue の場合、内部の実スクロール要素には .scrollElement 経由でアクセス可能
      const scrollElement = scrollRef.value.scrollElement;

      if (scrollElement) {
        scrollElement.scrollLeft = 0;
      } else if (scrollRef.value.scrollLeft !== undefined) {
        // 通常のDOM要素（divなど）に直接紐付けられた場合のフォールバック処理
        scrollRef.value.scrollLeft = 0;
      }
    }
  };

  return {
    isHidden,
    scrollRef,
    handleScroll,
    resetScroll,
  };
};