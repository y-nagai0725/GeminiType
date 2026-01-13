<template>
  <div class="typing-core">
    <div v-if="isLoading" class="typing-core__loading">準備中...</div>

    <div v-else-if="isCompleted" class="typing-core__completed">
      <p>Finish!</p>
      <p>お疲れ様でした！♡</p>
      <p>集計中...</p>
    </div>

    <div v-else-if="!isStarted" class="typing-core__ready">
      <div class="typing-core__mode-info" v-if="gameMode !== 'normal'">
        <template v-if="gameMode === 'time_limit'">
          <span class="typing-core__mode-name">⏱️ 時間制限モード</span>
          <span class="typing-core__mode-time-limit"
            >制限時間:
            <span class="typing-core__mode-count">{{ timeLimit }}秒</span></span
          >
        </template>
        <template v-if="gameMode === 'sudden_death'">
          <span class="typing-core__mode-name">💀 サドンデスモード</span>
          <span class="typing-core__mode-sudden-death"
            >許容ミス数:
            <span class="typing-core__mode-count">{{
              missLimit === 0 ? "即死！" : missLimit + "回"
            }}</span></span
          >
        </template>
      </div>
      <p class="typing-core__ready-title">Ready?</p>
      <p class="typing-core__ready-text">
        <span class="typing-core__ready-highlight">スペースキー</span
        >を押してスタート！
      </p>
    </div>

    <div v-else class="typing-core__playing" :class="gameMode">
      <div class="typing-core__progress">
        {{ currentProblemIndex + 1 }} / {{ problems.length }}
      </div>

      <div class="typing-core__hud" v-if="gameMode !== 'normal'">
        <div v-if="gameMode === 'time_limit'" class="hud-item hud-timer">
          <div class="timer-text" :class="{ danger: remainingTime <= 10 }">
            ⏱️ Time: {{ remainingTime }}s
          </div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :class="timeBarColorClass"
              :style="{ width: timeProgressPercentage + '%' }"
            ></div>
          </div>
        </div>
        <div
          v-if="gameMode === 'sudden_death'"
          :class="{ danger: remainingLives <= 1 }"
        >
          ❤️ Lives: {{ remainingLives }}
        </div>
      </div>

      <div class="typing-core__main-text-wrapper">
        <p v-if="targetProblem" class="typing-core__problem">
          {{ targetProblem.problem_text }}
        </p>

        <div class="typing-core__hiragana">
          <template v-if="parsedProblem.length > 0">
            <span
              v-for="(unit, index) in parsedProblem"
              :key="index"
              class="hiragana-char"
              :class="{ 'hiragana-typed': index < unitIndex }"
            >
              {{ unit.hiragana }}
            </span>
          </template>
          <p v-else-if="targetHiragana">{{ targetHiragana }}</p>
        </div>

        <div
          class="typing-core__romaji"
          :class="{ 'romaji-hidden': !shouldShowRomaji }"
        >
          <span class="typing-core__romaji--typed">
            {{ typedDisplayRomaji }}
          </span>
          <span class="typing-core__romaji--remaining">
            {{ remainingDisplayRomaji }}
          </span>
        </div>
      </div>

      <div class="typing-core__stats-container">
        <div class="typing-core__stat-row">
          <span class="stat-label">Current:</span>
          <span class="stat-value">KPM: {{ currentKpm }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-value">Acc: {{ currentAccuracy }}%</span>
        </div>

        <div class="typing-core__stat-row typing-core__stat-row--total">
          <span class="stat-label">Total:</span>
          <span class="stat-value">KPM: {{ sessionAverageKpm }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-value">Acc: {{ sessionAverageAccuracy }}%</span>
        </div>
      </div>

      <div class="typing-core__debug" v-if="props.showDebug && currentUnit">
        <p>
          ひらがなIndex: {{ unitIndex }} (「{{
            currentUnit.hiragana
          }}」を判定中)
        </p>
        <p>入力バッファ: [ {{ inputBuffer }} ]</p>
        <p>
          （「{{ currentUnit.hiragana }}」のパターン:
          {{ currentUnit.patterns.join(", ") }}）
        </p>
      </div>
    </div>

    <div class="typing-core__keyboard-container">
      <div
        v-for="(row, rowIndex) in keyboardLayout"
        :key="rowIndex"
        class="typing-core__keyboard-row"
      >
        <div
          v-for="keyObj in row"
          :key="keyObj.key"
          class="typing-core__key"
          :class="[keyObj.class, { active: isKeyActive(keyObj) }]"
        >
          {{ keyObj.label }}
        </div>
      </div>
    </div>

    <div class="typing-core__hands-container">
      <div class="typing-core__hand typing-core__hand--left">
        <div
          class="typing-core__finger typing-core__finger--pinky"
          :class="{ active: isFingerActive('left-pinky') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--ring"
          :class="{ active: isFingerActive('left-ring') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--middle"
          :class="{ active: isFingerActive('left-middle') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--index"
          :class="{ active: isFingerActive('left-index') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--thumb"
          :class="{ active: isFingerActive('left-thumb') }"
        ></div>
      </div>
      <div class="typing-core__hand typing-core__hand--right">
        <div
          class="typing-core__finger typing-core__finger--thumb"
          :class="{ active: isFingerActive('right-thumb') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--index"
          :class="{ active: isFingerActive('right-index') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--middle"
          :class="{ active: isFingerActive('right-middle') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--ring"
          :class="{ active: isFingerActive('right-ring') }"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--pinky"
          :class="{ active: isFingerActive('right-pinky') }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import romaMapData from "@/data/romanTypingParseDictionary.json";
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * キーボードレイアウト配列
 */
const keyboardLayout = [
  // 1行目
  [
    { label: "", key: "spacer-1", class: "key-spacer-1" },
    { label: "1", key: "1" },
    { label: "2", key: "2" },
    { label: "3", key: "3" },
    { label: "4", key: "4" },
    { label: "5", key: "5" },
    { label: "6", key: "6" },
    { label: "7", key: "7" },
    { label: "8", key: "8" },
    { label: "9", key: "9" },
    { label: "0", key: "0" },
    { label: "-", key: "-" },
    { label: "^", key: "^" },
    { label: "¥", key: "¥" },
    { label: "", key: "Backspace", class: "key-backspace" },
  ],
  // 2行目
  [
    { label: "", key: "Tab", class: "key-tab" },
    { label: "Q", key: "q" },
    { label: "W", key: "w" },
    { label: "E", key: "e" },
    { label: "R", key: "r" },
    { label: "T", key: "t" },
    { label: "Y", key: "y" },
    { label: "U", key: "u" },
    { label: "I", key: "i" },
    { label: "O", key: "o" },
    { label: "P", key: "p" },
    { label: "@", key: "@" },
    { label: "[", key: "[" },
    { label: "", key: "spacer-2", class: "key-spacer-2" },
  ],
  // 3行目
  [
    { label: "", key: "CapsLock", class: "key-caps" },
    { label: "A", key: "a" },
    { label: "S", key: "s" },
    { label: "D", key: "d" },
    { label: "F", key: "f" },
    { label: "G", key: "g" },
    { label: "H", key: "h" },
    { label: "J", key: "j" },
    { label: "K", key: "k" },
    { label: "L", key: "l" },
    { label: ";", key: ";" },
    { label: ":", key: ":" },
    { label: "]", key: "]" },
    { label: "", key: "spacer-3", class: "key-spacer-3" },
  ],
  // 4行目
  [
    { label: "Shift", key: "ShiftLeft", class: "key-shift" },
    { label: "Z", key: "z" },
    { label: "X", key: "x" },
    { label: "C", key: "c" },
    { label: "V", key: "v" },
    { label: "B", key: "b" },
    { label: "N", key: "n" },
    { label: "M", key: "m" },
    { label: ",", key: "," },
    { label: ".", key: "." },
    { label: "/", key: "/" },
    { label: "\\", key: "\\" },
    { label: "Shift", key: "ShiftRight", class: "key-shift" },
  ],
  // 5行目
  [{ label: "Space", key: " ", class: "key-space" }],
];

/**
 * 記号から、実際に押すべきキーへ変換するマップ
 */
const symbolToKeyMap = {
  "!": "1",
  '"': "2",
  "#": "3",
  $: "4",
  "%": "5",
  "&": "6",
  "'": "7",
  "(": "8",
  ")": "9",
  "=": "-",
  "~": "^",
  "|": "¥",
  "`": "@",
  "{": "[",
  "+": ";",
  "*": ":",
  "}": "]",
  "<": ",",
  ">": ".",
  "?": "/",
  _: "\\",
};

/**
 * Shiftキーを押す必要がある文字のリスト
 */
const shiftRequiredSymbols = "!\"#$%&'()=~|`{+*}<>?_";

/**
 * キー文字から指IDへのマッピング
 */
const keyToFingerMap = {
  // --- 左手 ---
  1: "left-pinky",
  Q: "left-pinky",
  A: "left-pinky",
  Z: "left-pinky",
  2: "left-ring",
  W: "left-ring",
  S: "left-ring",
  X: "left-ring",
  3: "left-middle",
  E: "left-middle",
  D: "left-middle",
  C: "left-middle",
  4: "left-index",
  R: "left-index",
  F: "left-index",
  V: "left-index",
  5: "left-index",
  T: "left-index",
  G: "left-index",
  B: "left-index",
  " ": "left-thumb", //とりあえず左手親指に割り当て

  // --- 右手 ---
  6: "right-index",
  Y: "right-index",
  H: "right-index",
  N: "right-index",
  7: "right-index",
  U: "right-index",
  J: "right-index",
  M: "right-index",
  8: "right-middle",
  I: "right-middle",
  K: "right-middle",
  ",": "right-middle",
  9: "right-ring",
  O: "right-ring",
  L: "right-ring",
  ".": "right-ring",
  0: "right-pinky",
  P: "right-pinky",
  ";": "right-pinky",
  "/": "right-pinky",
  "@": "right-pinky",
  "[": "right-pinky",
  ":": "right-pinky",
  "]": "right-pinky",
  "-": "right-pinky",
  "^": "right-pinky",
  "\\": "right-pinky",
  "¥": "right-pinky",
};

/**
 * ローマ字マップ(検索用にMapオブジェクトにしておく)
 */
const romaMap = new Map(
  romaMapData.map((item) => [item.Pattern, item.TypePattern])
);

/**
 * router
 */
const router = useRouter();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * 設定store
 */
const settingsStore = useSettingsStore();

/**
 * Props定義
 */
const props = defineProps({
  // 問題配列
  problems: { type: Array, required: true },
  // デバッグ表示
  showDebug: { type: Boolean, default: false },
  // ゲームモード ('normal', 'time_limit', 'sudden_death')
  gameMode: { type: String, default: "normal" },
  // 制限時間 (秒)
  timeLimit: { type: Number, default: 60 },
  // ミス許容回数
  missLimit: { type: Number, default: 0 },
  // ローマ字ガイド表示
  showRomaji: { type: Boolean, default: true },
});

/**
 * emits
 */
const emit = defineEmits(["complete"]);

// --- 状態 (State) ---

/**
 * ロード中かどうか
 */
const isLoading = ref(true);

/**
 * 全問完了フラグ
 */
const isCompleted = ref(false);

/**
 * スタートしたかどうか (待機画面用)
 */
const isStarted = ref(false);

/**
 * 全問分のひらがなリスト
 */
const hiraganaList = ref([]);

/**
 * 現在の問題番号 (0始まり)
 */
const currentProblemIndex = ref(0);

/**
 * 今の問題でミスをしたかどうか
 */
const hasMissedInCurrentProblem = ref(false);

// --- エンジン用状態 ---

/**
 * ひらがなを分割した配列
 */
const parsedProblem = ref([]);

/**
 * 分割のユニットindex
 */
const unitIndex = ref(0);

/**
 * 入力中判定用バッファ
 */
const inputBuffer = ref("");

/**
 * 見本ローマ字を構成するための、入力パターンのローマ字配列
 */
const activePatterns = ref([]);

/**
 * タイプ済みの文字数 (色を変える長さ)
 */
const typedRomajiLength = ref(0);

// --- 計測用 ---

/**
 * 問題開始時間 (UNIX timestamp)
 */
const problemStartTime = ref(0);

/**
 * 正解キー数 (今の問題)
 */
const correctKeyCount = ref(0);

/**
 * ミスタイプ数 (今の問題)
 */
const missKeyCount = ref(0);

/**
 * 今の問題でミスしたキーの集計 { key: count }
 */
const currentMissedKeys = ref({});

/**
 * 全問の結果をためる配列
 */
const sessionResults = ref([]);

/**
 * 残り時間
 */
const remainingTime = ref(props.timeLimit);

/**
 * セッション通算ミス数
 */
const totalMissCountSession = ref(0);

/**
 * タイマーID
 */
let timerInterval = null;

// --- Computed ---

/**
 * 現在の問題オブジェクト
 */
const targetProblem = computed(
  () => props.problems[currentProblemIndex.value] || null
);

/**
 * 現在の問題のひらがな
 */
const targetHiragana = computed(
  () => hiraganaList.value[currentProblemIndex.value] || ""
);

/**
 * 現在の（判定中の）ユニット
 */
const currentUnit = computed(
  () => parsedProblem.value[unitIndex.value] || null
);

/**
 * 現在の（判定中の）ユニットの正解入力パターン配列
 */
const currentPatterns = computed(() =>
  currentUnit.value ? currentUnit.value.patterns : []
);

/**
 * 見本ローマ字(全体)
 */
const displayRomaji = computed(() => activePatterns.value.join(""));

/**
 * 見本ローマ字の入力済み部分（文字色が変わった部分）
 */
const typedDisplayRomaji = computed(() =>
  displayRomaji.value.substring(0, typedRomajiLength.value)
);

/**
 * 見本ローマ字の未入力部分
 */
const remainingDisplayRomaji = computed(() =>
  displayRomaji.value.substring(typedRomajiLength.value)
);

/**
 * 現在のKPM (リアルタイム)
 */
const currentKpm = computed(() => {
  if (!problemStartTime.value || correctKeyCount.value === 0) return 0;
  const durationMin = (Date.now() - problemStartTime.value) / 1000 / 60;
  return Math.round(correctKeyCount.value / durationMin);
});

/**
 * 現在の正確率 (リアルタイム)
 */
const currentAccuracy = computed(() => {
  const total = correctKeyCount.value + missKeyCount.value;
  if (total === 0) return 100;
  return Math.round((correctKeyCount.value / total) * 100);
});

// 残りライフ (Sudden Death用)
const remainingLives = computed(() => {
  if (props.gameMode !== "sudden_death") return null;
  // ミス許容回数 - 現在のミス数 (0未満にはしない)
  return Math.max(0, props.missLimit - totalMissCountSession.value);
});

/**
 * 残り時間の割合 (%)
 */
const timeProgressPercentage = computed(() => {
  if (props.gameMode !== "time_limit") return 0;
  return (remainingTime.value / props.timeLimit) * 100;
});

/**
 * プログレスバーの色クラス
 */
const timeBarColorClass = computed(() => {
  const p = timeProgressPercentage.value;
  if (p <= 25) return "bar-red"; // 25%以下なら赤
  if (p <= 50) return "bar-yellow"; // 50%以下なら黄色
  return "bar-green"; // それ以外は緑
});

/**
 * 通算の平均KPM (リアルタイム)
 */
const sessionAverageKpm = computed(() => {
  // 過去問のデータ集計
  let totalCorrect = 0;
  let totalTimeMs = 0;

  sessionResults.value.forEach((res) => {
    totalCorrect += res.correct_key_count;
    totalTimeMs += res.duration_ms;
  });

  // 今プレイ中のデータも足す
  if (problemStartTime.value > 0) {
    totalCorrect += correctKeyCount.value;
    totalTimeMs += Date.now() - problemStartTime.value; // 今の経過時間
  }

  // 計算 (時間が0なら0を返す)
  if (totalTimeMs === 0) return 0;

  const totalMin = totalTimeMs / 1000 / 60;
  return Math.round(totalCorrect / totalMin);
});

/**
 * 通算の平均正確率 (リアルタイム)
 */
const sessionAverageAccuracy = computed(() => {
  let totalCorrect = 0;
  let totalMiss = 0;

  // 過去問題集計
  sessionResults.value.forEach((res) => {
    totalCorrect += res.correct_key_count;
    totalMiss += res.miss_key_count;
  });

  // 今の問題の分
  totalCorrect += correctKeyCount.value;
  totalMiss += missKeyCount.value;

  const total = totalCorrect + totalMiss;
  if (total === 0) return 100;

  return Math.round((totalCorrect / total) * 100);
});

/**
 * ローマ字ガイドを表示すべきかどうか？
 */
const shouldShowRomaji = computed(() => {
  // 設定が「常に表示(true)」なら無条件で表示
  if (props.showRomaji) return true;

  // 設定が「隠す(false)」なら、ミスしたかどうかで決める
  return hasMissedInCurrentProblem.value;
});

/**
 * 次に入力すべきキー
 * (現在のパターンと入力済みバッファから特定)
 */
const nextExpectedKey = computed(() => {
  // 現在の入力対象パターン (例: "ka")
  const currentPattern = activePatterns.value[unitIndex.value];

  // パターンがない、または完了している場合は null
  if (!currentPattern) return null;

  // バッファの長さ = 次の文字のインデックス
  // 例: pattern="ka", buffer="k" (len=1) -> "a" (index 1) が次のキー
  if (inputBuffer.value.length < currentPattern.length) {
    return currentPattern[inputBuffer.value.length];
  }

  return null;
});

// --- watch ---

watch(nextExpectedKey, (newKey, oldKey) => {
  console.log("new: " + newKey);
  console.log("old: " + oldKey);
});

// --- Methods ---

/**
 * 効果音を再生する
 * @param {String} type 'type' or 'miss'
 */
const playSound = (type) => {
  if (type === "type" && !settingsStore.soundEnabled) return;
  if (type === "miss" && !settingsStore.missSoundEnabled) return;

  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.volume = 0.5;
  audio.currentTime = 0;
  audio.play().catch(() => {
    // 音声ファイルがない、再生ポリシーでブロックされた等は無視
  });
};

/**
 * ゲームスタート処理
 */
const startGame = () => {
  isStarted.value = true;

  // 時間制限モードならタイマー始動！
  if (props.gameMode === "time_limit") {
    remainingTime.value = props.timeLimit;
    startTimer();
  }
};

/**
 * タイマー処理
 */
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    remainingTime.value--;
    // 時間切れチェック
    if (remainingTime.value <= 0) {
      forceFinishGame("Time Up!");
    }
  }, 1000);
};

/**
 * 完了通知を送るヘルパー関数
 * (成功・失敗に関わらず、共通の形式で親にデータを渡す)
 */
const emitComplete = (reason = null) => {
  if (timerInterval) clearInterval(timerInterval);
  isCompleted.value = true;

  // 成功したかどうか (reasonがなければ成功)
  const isClear = reason === null;

  // 解けた問題数 (成功なら全問、失敗なら「今の問題」は解けてないから -1)
  const solvedCount = isClear
    ? sessionResults.value.length
    : Math.max(0, sessionResults.value.length - 1);

  // 親コンポーネントへ渡すデータ
  const completeData = {
    results: sessionResults.value, // 今までの結果配列
    info: {
      isClear: isClear,
      reason: reason,
      solvedCount: solvedCount,
      remainingTime: remainingTime.value, // 残り時間
      remainingLives: remainingLives.value, // 残りライフ (computedの値)
    },
  };

  emit("complete", completeData);
};

/**
 * 強制終了処理 (ゲームオーバー時)
 */
const forceFinishGame = (reason) => {
  if (timerInterval) clearInterval(timerInterval);

  // プレイ中なら、今の問題の結果も（途中だけど）配列に追加する
  if (!isCompleted.value) {
    sessionResults.value.push({
      problem_text: targetProblem.value.problem_text + ` (${reason})`,
      kpm: 0,
      accuracy: currentAccuracy.value,
      missed_keys: { ...currentMissedKeys.value },
      miss_count: missKeyCount.value,
      romaji_text: displayRomaji.value,
      correct_key_count: correctKeyCount.value,
      miss_key_count: missKeyCount.value,
      duration_ms: Date.now() - problemStartTime.value,
    });
  }

  isCompleted.value = true;
  notificationStore.addNotification(`Game Over... ${reason}`, "error");
  emitComplete(reason);
};

/**
 * 問題文のひらがなを分割する
 * @param {String} hiragana 問題文のひらがな
 */
const parseHiragana = (hiragana) => {
  try {
    const units = [];
    const defaultPatterns = [];
    let cursor = 0;

    while (cursor < hiragana.length) {
      let matched = false;
      // 3文字、2文字、1文字といった順番で検索していく
      for (let len = 3; len >= 1; len--) {
        const chunk = hiragana.substring(cursor, cursor + len);
        if (romaMap.has(chunk)) {
          const patterns = romaMap.get(chunk);
          units.push({ hiragana: chunk, patterns: patterns });
          defaultPatterns.push(patterns[0]);
          cursor += len;
          matched = true;
          break;
        }
      }
      if (!matched) {
        const errorChar = hiragana[cursor];
        throw new Error(
          `問題文に、辞書にない文字「${errorChar}」が含まれています。`
        );
      }
    }

    return {
      parsedUnits: units,
      defaultActivePatterns: defaultPatterns,
    };
  } catch (error) {
    console.error("Critical Parsing Error:", error);

    // ユーザーへの通知
    notificationStore.addNotification(
      `問題データの生成に失敗しました（未対応の文字が含まれています）。メニューに戻ります。`,
      "error"
    );

    // メニュー画面へ強制遷移
    router.push("/menu");

    // 空配列を返して終わらせる
    return [];
  }
};

/**
 * キー判定処理
 * @param {KeyboardEvent} e キーボードイベントオブジェクト
 */
const handleKeydown = (e) => {
  // ロード中や完了時は操作を受け付けない
  if (isLoading.value || isCompleted.value) return;

  // (★) まだスタートしてない時
  if (!isStarted.value) {
    // スペースキーが押されたらスタート！
    if (e.code === "Space") {
      e.preventDefault(); // スクロール防止
      startGame();
    }
    return; // 他のキーは無視、タイピング判定もしない
  }

  // --- ここから下はプレイ中の判定 ---

  // 制御キーは無視
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "Backspace" || e.key === "Shift") {
    e.preventDefault();
    return;
  }
  // 1文字キー以外は無視
  if (e.key.length !== 1) return;

  e.preventDefault();

  // 最初のキー入力でタイマー開始
  if (problemStartTime.value === 0) {
    problemStartTime.value = Date.now();
  }

  if (!currentUnit.value) return;

  const newBuffer = inputBuffer.value + e.key; // 大文字小文字は区別

  // 1. 完全一致
  const perfectMatch = currentPatterns.value.find(
    (pattern) => pattern === newBuffer
  );
  if (perfectMatch) {
    playSound("type");
    correctKeyCount.value++;
    advanceUnit(perfectMatch);
    return;
  }

  // 2. 前方一致
  const partialMatch = currentPatterns.value.find((pattern) =>
    pattern.startsWith(newBuffer)
  );
  if (partialMatch) {
    playSound("type");
    correctKeyCount.value++;
    handlePartialMatch(partialMatch, newBuffer);
    return;
  }

  // ミスタイプ処理
  handleMiss(e.key);
};

/**
 * ミスタイプ時の処理
 * @param {String} key 入力されたキー
 */
const handleMiss = (key) => {
  playSound("miss");
  missKeyCount.value++;

  // セッション通算ミスをカウント
  totalMissCountSession.value++;

  // ミスしたので、ローマ字ガイドを表示させる
  hasMissedInCurrentProblem.value = true;

  // 「本来打つべきキー」を集計
  const expected = nextExpectedKey.value;
  if (expected) {
    if (!currentMissedKeys.value[expected]) {
      currentMissedKeys.value[expected] = 0;
    }
    currentMissedKeys.value[expected]++;
  }

  // Sudden Death判定
  if (props.gameMode === "sudden_death") {
    // ミス許容回数を超えたらアウト
    if (totalMissCountSession.value > props.missLimit) {
      forceFinishGame("Miss Limit Exceeded!");
      return;
    }
  }
};

/**
 * 「前方一致」判定の時の処理
 * @param {string} partialPattern 前方一致した入力パターン
 * @param {string} newBuffer 最新のバッファ
 */
const handlePartialMatch = (partialPattern, newBuffer) => {
  // 見本を動的に差し替え
  if (activePatterns.value[unitIndex.value] !== partialPattern) {
    activePatterns.value[unitIndex.value] = partialPattern;
  }
  inputBuffer.value = newBuffer;
  updateHighlightingLength();
};

/**
 * 判定をクリアして、次のユニットに進む
 * @param {string} matchedPattern パターンとマッチしたローマ字文字列
 */
const advanceUnit = (matchedPattern) => {
  activePatterns.value[unitIndex.value] = matchedPattern;
  inputBuffer.value = "";
  unitIndex.value++;
  updateHighlightingLength();

  // 全ユニット終了 -> 次の問題へ
  if (unitIndex.value >= parsedProblem.value.length) {
    finishCurrentProblem();
  }
};

/**
 * 文字色を変える長さを再計算
 */
const updateHighlightingLength = () => {
  let newLength = 0;
  for (let i = 0; i < unitIndex.value; i++) {
    newLength += activePatterns.value[i].length;
  }
  newLength += inputBuffer.value.length;
  typedRomajiLength.value = newLength;
};

/**
 * 1問終了時の処理
 */
const finishCurrentProblem = () => {
  // 今の問題にかかった時間 (ミリ秒) を計算
  const durationMs = Date.now() - problemStartTime.value;

  const result = {
    problem_text: targetProblem.value.problem_text,
    kpm: currentKpm.value,
    accuracy: currentAccuracy.value,
    missed_keys: { ...currentMissedKeys.value },
    miss_count: missKeyCount.value,
    romaji_text: displayRomaji.value,
    correct_key_count: correctKeyCount.value,
    miss_key_count: missKeyCount.value,
    duration_ms: durationMs,
  };

  sessionResults.value.push(result);

  // 次の問題へ遷移
  if (currentProblemIndex.value < props.problems.length - 1) {
    // 少し余韻を持たせて次へ
    setTimeout(() => {
      currentProblemIndex.value++;
      setupCurrentProblem();
    }, 200);
  } else {
    // タイマー停止
    if (timerInterval) clearInterval(timerInterval);

    // 全問終了
    isCompleted.value = true;
    emitComplete(null);
  }
};

/**
 * 現在の問題のセットアップ（初期化）
 */
const setupCurrentProblem = () => {
  hasMissedInCurrentProblem.value = false;
  unitIndex.value = 0;
  inputBuffer.value = "";
  typedRomajiLength.value = 0;
  problemStartTime.value = 0;
  correctKeyCount.value = 0;
  missKeyCount.value = 0;
  currentMissedKeys.value = {};

  const hiragana = hiraganaList.value[currentProblemIndex.value];
  // パース処理
  const { parsedUnits, defaultActivePatterns } = parseHiragana(hiragana);
  parsedProblem.value = parsedUnits;
  activePatterns.value = defaultActivePatterns;
};

/**
 *
 */
const isKeyActive = (keyObj) => {
  const target = nextExpectedKey.value; // 次に打つべき文字
  const keyChar = keyObj.key; // キーボード上の文字 ('a', '1', 'Shift' など)

  if (!isStarted.value && keyChar === " ") {
    return true;
  } else if (!isStarted.value) {
    return false;
  }

  if (!target) return false;

  if (!shouldShowRomaji.value) {
    return false;
  }

  // --- A. Shiftキー自体の判定 ---
  if (keyChar === "ShiftLeft" || keyChar === "ShiftRight") {
    // 1. まず、ターゲット文字について情報整理
    let targetBaseKey = target; // 判定に使う「キーの文字」

    // 記号の場合、Shift不要な「元のキー文字」に変換 (例: '!' -> '1')
    // ※ symbolToKeyMap は「!」:「1」のようなマップ
    if (symbolToKeyMap[target]) {
      targetBaseKey = symbolToKeyMap[target];
    }

    // 2. Shiftが必要な文字かチェック
    const isUpperCase = target >= "A" && target <= "Z";
    const isShiftSymbol = shiftRequiredSymbols.includes(target);

    // Shift不要なら、Shiftキーは光らせない
    if (!isUpperCase && !isShiftSymbol) {
      return false;
    }

    // 3. 文字を打つ「指」を取得して、「手」を判別
    // 大文字小文字を吸収してマップ検索
    const fingerId = keyToFingerMap[targetBaseKey.toUpperCase()];

    // 指情報がない（万が一の未定義キー）場合は光らせない
    if (!fingerId) return false;

    // 'left-pinky' -> 'left', 'right-index' -> 'right' を取り出す
    const hand = fingerId.split("-")[0];

    // 4. クロス・シフト判定！ (手と逆のShiftなら正解)
    if (hand === "left" && keyChar === "ShiftRight") {
      return true; // 文字が左手 → 右Shiftを光らせる
    }
    if (hand === "right" && keyChar === "ShiftLeft") {
      return true; // 文字が右手 → 左Shiftを光らせる
    }

    return false;
  }

  // --- B. 通常キーの判定 ---

  // 1. そのまま一致するか？ (小文字に揃えて比較)
  if (target.toLowerCase() === keyChar.toLowerCase()) {
    return true;
  }

  // 2. 記号の対応表で一致するか？ (例: targetが'!'なら、keyCharが'1'かチェック)
  if (symbolToKeyMap[target] === keyChar) {
    return true;
  }

  return false;
};

/**
 *
 */
const isFingerActive = (fingerId) => {
  // 設定で非表示なら光らせない
  if (!shouldShowRomaji.value || !isStarted.value) {
    return false;
  }

  const target = nextExpectedKey.value;
  if (!target) return false;

  // 2. ターゲット文字の「元のキー」を特定
  // (例: '!' -> '1', 'A' -> 'A')
  let targetBaseKey = target;
  if (symbolToKeyMap[target]) {
    targetBaseKey = symbolToKeyMap[target];
  }

  // 3. 文字を打つ指 (charFingerId) を取得
  const charFingerId = keyToFingerMap[targetBaseKey.toUpperCase()];

  // ★判定A：この指は「文字を打つ指」か？
  if (charFingerId === fingerId) {
    return true; // 文字担当の指なら光る！
  }

  // --- ★判定B：この指は「Shiftを押す指」か？ (ここを追加！) ---

  // Shiftが必要かチェック
  const isUpperCase = target >= "A" && target <= "Z";
  const isShiftSymbol = shiftRequiredSymbols.includes(target);

  // Shiftが必要な場合のみ、小指の判定を行う
  if (isUpperCase || isShiftSymbol) {
    // 文字を打つ指が、左右どっちの手か取得 ('left' or 'right')
    // ※万が一 charFingerId が取れない場合はガードする
    if (!charFingerId) return false;
    const charHand = charFingerId.split("-")[0];

    // クロス・シフト判定！
    // 文字が「左手」なら → 「右手の小指」を光らせる
    if (charHand === "left" && fingerId === "right-pinky") {
      return true;
    }
    // 文字が「右手」なら → 「左手の小指」を光らせる
    if (charHand === "right" && fingerId === "left-pinky") {
      return true;
    }
  }

  return false;
};

/**
 * マウント時処理
 */
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  if (!props.problems || props.problems.length === 0) return;

  try {
    // ひらがなリストの準備
    let hiraganas = [];

    // データ内に「problem_hiragana」が含まれているかチェック
    const hasHiraganaData = props.problems.every((p) => p.problem_hiragana);

    if (hasHiraganaData) {
      // --- DBモード (ひらがな有り) ---
      // APIを使わず、持っているデータをそのまま使う
      hiraganas = props.problems.map((p) => p.problem_hiragana);
    } else {
      // --- AIモード (ひらがな無し) ---
      // APIでひらがなを取得する
      const texts = props.problems.map((p) => p.problem_text);
      const response = await api.post("/api/get-hiragana", { texts: texts });
      hiraganas = response.data.hiraganas;
    }

    // データをセット
    hiraganaList.value = hiraganas;

    // ゲーム開始準備
    setupCurrentProblem();
    isLoading.value = false;
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "問題データの読み込みに失敗しました。",
      "error"
    );
    router.push("/menu");
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);

  // タイマーのお片付け
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style lang="scss" scoped>
.typing-core {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 800px;

  &__loading,
  &__completed,
  &__ready {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;
    min-height: 25rem;
    border-radius: $radius-lg;
    background-color: $gray;
  }

  &__ready-title {
    font-family: $roboto-mono;
    font-size: 3.8rem;
    font-weight: $bold;
  }

  &__ready-text {
    font-size: 2.2rem;
    font-weight: $bold;
  }

  &__ready-highlight {
    color: $orange;
  }

  &__mode-info {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    font-size: 1.8rem;
    font-weight: $bold;
  }

  &__mode-name {
    //color: $blue;
  }

  &__mode-time-limit,
  &__mode-sudden-death {
  }

  &__mode-count {
    color: $red;
  }

  &__playing {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1.6rem 3.2rem;
    border-radius: $radius-lg;
    background-color: $gray;

    &.normal {
      min-height: 25rem;
    }

    &.time_limit,
    &.sudden_death {
      min-height: 30rem;
    }
  }

  &__main-text-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.6rem;
  }

  &__progress {
    text-align: center;
    font-weight: $bold;
    font-size: 1.6rem;
    color: $light-black;
  }

  &__stats-container {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  &__stat-row {
    font-size: 1.2rem;
    font-weight: bold;
    color: #007bff; /* Currentは青 */
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .stat-label {
      font-size: 0.9rem;
      color: #999;
      text-transform: uppercase;
      margin-right: 0.5rem;
      min-width: 60px; /* 位置を揃える */
      text-align: right;
    }

    .stat-divider {
      color: #ddd;
      margin: 0 0.5rem;
    }

    /* Total行のスタイル */
    &--total {
      color: #28a745; /* Totalは緑！ */
      font-size: 1.1rem; /* ちょっとだけ小さく */

      .stat-label {
        color: #aaa;
      }
    }
  }

  &__problem {
    font-weight: $bold;
    font-size: 3rem;
    line-height: 1;
  }

  &__hiragana {
    font-weight: $bold;
    font-size: 2rem;
    color: $light-black;
    line-height: 1;

    .hiragana-char {
      display: inline-block;
    }

    .hiragana-typed {
      color: $orange;
    }
  }

  &__romaji {
    min-height: 3rem;
    font-family: $roboto-mono;
    font-weight: $bold;
    font-size: 2.6rem;
    letter-spacing: 0.05em;
    line-height: 1;
    opacity: 1;
    visibility: visible;

    &.romaji-hidden {
      opacity: 0;
      visibility: hidden;
    }

    &--typed {
      color: $orange;
    }

    &--remaining {
      color: $light-black;
    }
  }
  &__debug {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #999;
    background-color: #f0f0f0;
    padding: 0.5rem;
  }

  /* HUD (Head-Up Display) のスタイル */
  &__hud {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1.5rem; /* バーが入る分、少し広げる */
    color: #333;
    width: 100%; /* 幅を確保 */
    max-width: 600px; /* 広がりすぎないように */
    margin-left: auto;
    margin-right: auto;

    .hud-item {
      font-size: 1.5rem;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .hud-timer {
      width: 100%; /* バーのために幅を広げる */
      max-width: 400px;
    }

    .danger {
      color: #dc3545;
      animation: pulse 1s infinite;
    }

    /* ★追加: プログレスバーの背景 */
    .progress-bar-bg {
      width: 100%;
      height: 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      margin-top: 5px;
      overflow: hidden; /* 角丸からはみ出ないように */
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* ★追加: プログレスバーの中身 */
    .progress-bar-fill {
      height: 100%;
      border-radius: 5px;
      /* ★ここがポイント！幅の変化を1秒かけて滑らかにする */
      transition: width 1s linear, background-color 0.3s ease;
    }

    /* ★追加: 色の定義 */
    .bar-green {
      background-color: #28a745;
      box-shadow: 0 0 5px rgba(40, 167, 69, 0.5);
    }
    .bar-yellow {
      background-color: #ffc107;
      box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
    }
    .bar-red {
      background-color: #dc3545;
      box-shadow: 0 0 5px rgba(220, 53, 69, 0.5);
    }
  }

  &__keyboard-container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;
    padding: 2.4rem;
    margin-top: 3.2rem;
    background-color: $light-blue;
    border-radius: $radius-lg;
  }

  &__keyboard-row {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
  }

  &__key {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.5rem;
    height: 4.5rem;
    font-family: $roboto-mono;
    font-size: 1.8rem;
    font-weight: $bold;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: 0 4px 0 #dbe4eb;
    transition: box-shadow $transition-base, transform $transition-base;
    user-select: none;

    &.key-backspace {
      visibility: hidden;
    }

    &.key-tab {
      width: 7.7rem;
      visibility: hidden;
    }

    &.key-caps {
      width: 8.5rem;
      visibility: hidden;
    }

    &.key-shift {
      width: 9.8rem;
    }

    &.key-space {
      width: 25rem;
    }

    &.key-spacer-1 {
      visibility: hidden;
    }

    &.key-spacer-2 {
      width: 6.6rem;
      visibility: hidden;
    }

    &.key-spacer-3 {
      width: 5.8rem;
      visibility: hidden;
    }

    &.active {
      background-color: $orange;
      color: white;
      box-shadow: 0 4px 0 rgba($orange, 0.5);
      transform: translateY(2px);
    }
  }

  &__hands-container {
    display: flex;
    justify-content: center;
    gap: 8rem;
    margin-top: -2rem;
    padding-bottom: 2rem;
  }

  &__hand {
    display: flex;
    align-items: flex-end;
    gap: 0.8rem;
  }

  &__finger {
    width: 4rem;
    height: 8.5rem;
    background-color: $gray;
    border-radius: $radius-lg $radius-lg 0 0;
    transition: background-color $transition-base;

    &--pinky {
      height: 6rem;
    }

    &--middle {
      height: 10rem;
    }

    &--thumb {
      height: 4rem;
    }

    &.active {
      background-color: $orange;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>