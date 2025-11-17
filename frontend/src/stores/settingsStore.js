import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
  // --- State (宝箱の中身) ---

  // (★) localStorage から初期値を読み込むよ！ (なければデフォルト値)
  // JSON.parse を使うときは try-catch しておくと安全だよ♡

  const getSavedValue = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  }

  const problemCount = ref(getSavedValue('settings_problemCount', 10)); // 問題数
  const soundEnabled = ref(getSavedValue('settings_soundEnabled', true)); // タイプ音
  const missSoundEnabled = ref(getSavedValue('settings_missSoundEnabled', true)); // ミス音

  // (★) 他にも「フォントサイズ」とか「キーボード表示」とか、
  // お兄ちゃんが後で追加したくなったらここに増やせばOK！

  // --- Actions (魔法) ---

  /**
   * 設定を保存する魔法
   * (値が変わるたびに呼んでもいいし、画面遷移時に呼んでもいいよ！)
   */
  const saveSettings = () => {
    localStorage.setItem('settings_problemCount', JSON.stringify(problemCount.value));
    localStorage.setItem('settings_soundEnabled', JSON.stringify(soundEnabled.value));
    localStorage.setItem('settings_missSoundEnabled', JSON.stringify(missSoundEnabled.value));
  }

  /**
   * 設定を全部デフォルトに戻す魔法（あると便利かも？）
   */
  const resetSettings = () => {
    problemCount.value = 10;
    soundEnabled.value = true;
    missSoundEnabled.value = true;
    saveSettings();
  }

  return {
    problemCount,
    soundEnabled,
    missSoundEnabled,
    saveSettings,
    resetSettings
  };
});