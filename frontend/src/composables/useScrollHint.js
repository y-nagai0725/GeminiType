import { ref } from "vue";

// =========================================================================
// 定数定義
// =========================================================================

/**
 * スクロールヒントを非表示にするスクロール量の閾値 (px)
 */
const HIDE_THRESHOLD_PX = 5;

// =========================================================================
// コンポーザブル
// =========================================================================

/**
 * 横スクロールヒントの表示状態とスクロール位置リセットを管理するコンポーザブル
 */
export const useScrollHint = () => {
  // スクロールヒントが隠れているかどうか
  const isHidden = ref(false);

  // Simplebar（またはスクロール要素）の参照 (templateのrefと紐付ける)
  const scrollRef = ref(null);

  /**
   * スクロールイベントハンドラ
   */
  const handleScroll = (event) => {
    // すでに消えている場合は何もしない
    if (isHidden.value) return;

    const target = event.target;
    // 5px以上スクロールされたらヒントを非表示にする
    if (target && target.scrollLeft > HIDE_THRESHOLD_PX) {
      isHidden.value = true;
    }
  };

  /**
   * スクロール位置とヒント表示を初期状態にリセットする
   */
  const resetScroll = () => {
    isHidden.value = false;

    if (scrollRef.value) {
      // simplebar-vueの場合、scrollElementで内部のスクロール対象要素にアクセスできる
      const scrollElement = scrollRef.value.scrollElement;
      if (scrollElement) {
        scrollElement.scrollLeft = 0;
      } else if (scrollRef.value.scrollLeft !== undefined) {
        // 万が一通常のDOM要素だった場合のフォールバック
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