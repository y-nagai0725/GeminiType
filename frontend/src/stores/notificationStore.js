// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================

import { ref } from 'vue';
import { defineStore } from 'pinia';

// =========================================================================
// Storeの定義
// =========================================================================

export const useNotificationStore = defineStore('notification', () => {

  // =======================================================================
  // State (状態管理)
  // =======================================================================

  /**
   * お知らせ配列
   */
  const notifications = ref([]);


  // =======================================================================
  // Actions (状態更新)
  // =======================================================================

  /**
   * 新しい「お知らせ」を追加する
   * @param {string} message 表示したいメッセージ
   * @param {string} type 'success' (緑) か 'error' (赤) か
   * @param {number} duration 何秒くらい表示するか（ミリ秒）
   */
  const addNotification = (message, type = 'success', duration = 3000) => {
    // お知らせに「ユニークID」を付ける
    const id = Date.now() + Math.random();

    // 新しいお知らせを追加する
    notifications.value.push({ id, message, type });

    // 「duration」秒経ったら、自動で消えるように
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }

  /**
   * IDを指定して「お知らせ」を消す
   */
  const removeNotification = (id) => {
    // そのID「以外」のもので、配列を作り直す
    notifications.value = notifications.value.filter(n => n.id !== id);
  }


  // =======================================================================
  // 外部に公開する変数・関数
  // =======================================================================

  return {
    notifications,
    addNotification,
    removeNotification
  };
});