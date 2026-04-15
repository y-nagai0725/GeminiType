// =========================================================================
// 定数定義
// =========================================================================

/**
 * PC推奨環境とする最小画面幅 (px)
 * @type {number}
 */
const MIN_DESKTOP_WIDTH_PX = 800;

// =========================================================================
// コンポーザブル
// =========================================================================

/**
 * デバイスのプレイ環境を判定するコンポーザブル
 * @returns {{ checkNeedsWarning: () => boolean }}
 */
export const useDeviceEnvironment = () => {
  /**
   * 警告モーダルを表示する必要がある環境かどうかをチェックする
   * - タッチ対応デバイスであるか
   * - 画面幅がPC推奨サイズ未満であるか
   * * @returns {boolean} 上記のいずれかに該当する場合は true
   */
  const checkNeedsWarning = () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }

    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isNarrowScreen = window.innerWidth < MIN_DESKTOP_WIDTH_PX;

    return isTouchDevice || isNarrowScreen;
  };

  return {
    checkNeedsWarning,
  };
};