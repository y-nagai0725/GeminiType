// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================

import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useNotificationStore } from './notificationStore';

// =========================================================================
// Storeの定義
// =========================================================================

export const useSettingsStore = defineStore('settings', () => {

  // =======================================================================
  // 定数定義
  // =======================================================================

  /**
   * 選択可能な問題数リスト
   * @type {number[]}
   */
  const PROBLEM_COUNTS = [5, 10, 20, 30];

  /**
   * 選択可能な制限時間リスト (秒)
   * @type {number[]}
   */
  const TIME_LIMIT_OPTIONS = [30, 60, 90, 120];

  /**
   * 選択可能な許容ミス数リスト (回)
   * @type {number[]}
   */
  const MISS_LIMIT_OPTIONS = [0, 1, 3, 5, 10];

  /**
   * 選択可能なゲームモードリスト (定数)
   * @type {{ NORMAL: string, TIME_LIMIT: string, SUDDEN_DEATH: string }}
   */
  const GAME_MODES = {
    NORMAL: 'normal',
    TIME_LIMIT: 'time_limit',
    SUDDEN_DEATH: 'sudden_death'
  };

  // =======================================================================
  // State (状態管理) , 初期化ロジック
  // =======================================================================

  /**
   * localStorage から値を読み込む
   * @param {string} key 保存キー
   * @param {*} defaultValue 見つからない or 壊れてた時の初期値
   * @returns {*}
   */
  const getSavedValue = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null || saved === 'undefined') {
        return defaultValue;
      }
      return JSON.parse(saved);
    } catch (error) {
      console.warn(`設定の読み込みに失敗しました (${key}):`, error);
      return defaultValue;
    }
  };

  /**
   * 1セッションの問題数
   * @type {import('vue').Ref<number>}
   */
  const problemCount = ref(getSavedValue('settings_problemCount', 10));

  /**
   * タイプ音を鳴らすかどうか
   * @type {import('vue').Ref<boolean>}
   */
  const soundEnabled = ref(getSavedValue('settings_soundEnabled', false));

  /**
   * ミス音を鳴らすかどうか
   * @type {import('vue').Ref<boolean>}
   */
  const missSoundEnabled = ref(getSavedValue('settings_missSoundEnabled', false));

  /**
   * ゲームモード
   * @type {import('vue').Ref<string>}
   */
  const gameMode = ref(getSavedValue('settings_gameMode', GAME_MODES.NORMAL));

  /**
   * 制限時間 (秒)
   * @type {import('vue').Ref<number>}
   */
  const timeLimit = ref(getSavedValue('settings_timeLimit', 60));

  /**
   * ミス許容回数
   * @type {import('vue').Ref<number>}
   */
  const missLimit = ref(getSavedValue('settings_missLimit', 0));

  /**
   * ローマ字ガイドの表示設定
   * @type {import('vue').Ref<boolean>}
   */
  const showRomaji = ref(getSavedValue('settings_showRomaji', true));


  // =======================================================================
  // Actions (状態更新)
  // =======================================================================

  /**
   * 設定をlocalStorageに保存する
   * @returns {void}
   */
  const saveSettings = () => {
    try {
      localStorage.setItem('settings_problemCount', JSON.stringify(problemCount.value));
      localStorage.setItem('settings_soundEnabled', JSON.stringify(soundEnabled.value));
      localStorage.setItem('settings_missSoundEnabled', JSON.stringify(missSoundEnabled.value));
      localStorage.setItem('settings_gameMode', JSON.stringify(gameMode.value));
      localStorage.setItem('settings_timeLimit', JSON.stringify(timeLimit.value));
      localStorage.setItem('settings_missLimit', JSON.stringify(missLimit.value));
      localStorage.setItem('settings_showRomaji', JSON.stringify(showRomaji.value));
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  };

  /**
   * 設定を全部デフォルトに戻す
   * @returns {void}
   */
  const resetSettings = () => {
    problemCount.value = 10;
    soundEnabled.value = false;
    missSoundEnabled.value = false;
    gameMode.value = GAME_MODES.NORMAL;
    timeLimit.value = 60;
    missLimit.value = 0;
    showRomaji.value = true;
    saveSettings();
  };

  // =======================================================================
  // Watcher (自動保存 ＆ バリデーション機能)
  // =======================================================================

  watch(
    [problemCount, soundEnabled, missSoundEnabled, gameMode, timeLimit, missLimit, showRomaji],
    () => {
      let isInvalid = false;

      // バリデーション:選択肢の中に存在しない値がセットされたらデフォルトに戻す
      if (!PROBLEM_COUNTS.includes(problemCount.value)) {
        problemCount.value = 10;
        isInvalid = true;
      }
      if (!Object.values(GAME_MODES).includes(gameMode.value)) {
        gameMode.value = GAME_MODES.NORMAL;
        isInvalid = true;
      }
      if (!TIME_LIMIT_OPTIONS.includes(timeLimit.value)) {
        timeLimit.value = 60;
        isInvalid = true;
      }
      if (!MISS_LIMIT_OPTIONS.includes(missLimit.value)) {
        missLimit.value = 0;
        isInvalid = true;
      }

      // 不正な値が検出された場合、通知を出す
      if (isInvalid) {
        const notificationStore = useNotificationStore();
        notificationStore.addNotification('不正な設定値が検出されたため、初期値にリセットしました。', 'error');
      }

      // バリデーションを通過した（またはリセットされた）安全な値を自動保存する
      saveSettings();
    }
  );

  // =======================================================================
  // 外部に公開する変数・関数
  // =======================================================================

  return {
    PROBLEM_COUNTS,
    TIME_LIMIT_OPTIONS,
    MISS_LIMIT_OPTIONS,
    GAME_MODES,
    problemCount,
    soundEnabled,
    missSoundEnabled,
    gameMode,
    timeLimit,
    missLimit,
    showRomaji,
    saveSettings,
    resetSettings
  };
});