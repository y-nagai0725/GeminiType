import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', () => {
  /**
   * お知らせ配列
   */
  const notifications = ref([]);

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

  return {
    notifications,
    addNotification,
    removeNotification
  };
});