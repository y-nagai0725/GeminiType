import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
  /**
   * localStorage から値を読み込む
   * (エラーが起きても「デフォルト値」を返すことで、アプリを止めない)
   * @param {string} key 保存キー
   * @param {*} defaultValue 見つからない or 壊れてた時の初期値
   */
  const getSavedValue = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);

      // 保存データがない、または "null" などの変な文字列の場合はデフォルトを返す
      if (saved === null || saved === 'undefined') {
        return defaultValue;
      }

      // JSON形式に変換して返す
      return JSON.parse(saved);
    } catch (error) {
      // 読み込み失敗は注意レベル。デフォルト値で復旧させるので画面での通知はしない。
      console.warn(`設定の読み込みに失敗しました (${key}):`, error);
      return defaultValue;
    }
  };

  /**
   * 1セッションの問題数 (デフォルト: 10)
   */
  const problemCount = ref(getSavedValue('settings_problemCount', 10));

  /**
   * タイプ音を鳴らすかどうか (デフォルト: false)
   */
  const soundEnabled = ref(getSavedValue('settings_soundEnabled', false));

  /**
   * ミス音を鳴らすかどうか (デフォルト: false)
   */
  const missSoundEnabled = ref(getSavedValue('settings_missSoundEnabled', false));

  /**
   * 設定を保存する
   */
  const saveSettings = () => {
    try {
      localStorage.setItem('settings_problemCount', JSON.stringify(problemCount.value));
      localStorage.setItem('settings_soundEnabled', JSON.stringify(soundEnabled.value));
      localStorage.setItem('settings_missSoundEnabled', JSON.stringify(missSoundEnabled.value));
    } catch (error) {
      // 保存失敗も、ユーザー操作をブロックするほどではないのでログのみ。
      console.error('設定の保存に失敗しました:', error);
    }
  };

  /**
   * 設定を全部デフォルトに戻す
   */
  const resetSettings = () => {
    problemCount.value = 10;
    soundEnabled.value = false;
    missSoundEnabled.value = false;
    saveSettings();
  };

  return {
    problemCount,
    soundEnabled,
    missSoundEnabled,
    saveSettings,
    resetSettings
  };
});