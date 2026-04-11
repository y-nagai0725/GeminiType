// =========================================================================
// 定数定義
// =========================================================================

/**
 * PC推奨環境とする最小画面幅 (px)
 */
const MIN_DESKTOP_WIDTH_PX = 800;

// =========================================================================
// コンポーザブル
// =========================================================================

/**
 * デバイスのプレイ環境を判定するコンポーザブル
 */
export const useDeviceEnvironment = () => {
  /**
   * 警告モーダルを表示する必要がある環境かどうかをチェックする
   * @returns {boolean} タッチデバイス または 指定の画面幅未満なら true
   */
  const checkNeedsWarning = () => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isNarrowScreen = window.innerWidth < MIN_DESKTOP_WIDTH_PX;

    return isTouchDevice || isNarrowScreen;
  };

  return {
    checkNeedsWarning,
  };
};