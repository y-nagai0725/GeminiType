<template>
  <div class="typing-core">
    <div v-if="isLoading" class="typing-core__loading">
      <Loading :text="'問題準備中…'" :bgColor="'white'" :lineColor="'blue'" />
    </div>

    <div v-else-if="errorMessage" class="typing-core__error">
      <p class="typing-core__error-title">Error</p>
      <p class="typing-core__error-message">{{ errorMessage }}</p>
      <RouterLink to="/menu" class="typing-core__back-button">
        メインメニューに戻る<ArrowIcon class="typing-core__arrow-icon" />
      </RouterLink>
    </div>

    <div v-else-if="isCompleted" class="typing-core__completed">
      <p class="typing-core__completed-title">Finish!</p>
      <p class="typing-core__completed-message">お疲れ様でした！</p>

      <Loading
        v-if="!isTryMode"
        :text="'結果集計中…'"
        :bgColor="'white'"
        :lineColor="'blue'"
      />

      <div v-if="isTryMode" class="typing-core__stats">
        <span class="typing-core__stat-label">Stats</span>
        <span class="typing-core__stat-label">
          KPM:
          <span class="typing-core__stat-value typing-core__stat-value--kpm">
            {{ sessionAverageKpm }}
          </span>
        </span>
        <span class="typing-core__stat-label">
          Acc:
          <span class="typing-core__stat-value typing-core__stat-value--acc">
            {{
              sessionAverageAccuracy === "-"
                ? "-"
                : sessionAverageAccuracy + "%"
            }}
          </span>
        </span>
        <span class="typing-core__stat-label">
          Miss:
          <span class="typing-core__stat-value typing-core__stat-value--miss">
            {{ totalMissCountSession }}
          </span>
        </span>
      </div>
    </div>

    <div v-else-if="!isStarted" class="typing-core__ready">
      <div class="typing-core__mode-info" v-if="gameMode !== 'normal'">
        <template v-if="gameMode === 'time_limit'">
          <span class="typing-core__mode-name">
            <TimerIcon class="typing-core__timer-icon" />時間制限モード
          </span>
          <span class="typing-core__mode-time-limit">
            制限時間:
            <span class="typing-core__mode-count">{{ timeLimit }}秒</span>
          </span>
        </template>
        <template v-if="gameMode === 'sudden_death'">
          <span class="typing-core__mode-name">
            <SuddenDeathIcon
              class="typing-core__sudden-death-icon"
            />サドンデスモード
          </span>
          <span class="typing-core__mode-sudden-death">
            許容ミス数:
            <span class="typing-core__mode-count">
              {{ missLimit === 0 ? "ミスったら即終了!" : missLimit + "回" }}
            </span>
          </span>
        </template>
      </div>

      <p class="typing-core__ready-title">Ready?</p>
      <p class="typing-core__ready-text">
        <span class="typing-core__ready-highlight">スペースキー</span
        >を押してスタート！
      </p>
    </div>

    <div
      v-else
      class="typing-core__playing"
      :class="gameMode.replace('_', '-')"
    >
      <div class="typing-core__progress" v-if="!showDebug">
        {{ currentProblemIndex + 1 }} / {{ problems.length }}
      </div>

      <div class="typing-core__circular-indicator" v-if="gameMode !== 'normal'">
        <svg viewBox="0 0 60 60">
          <circle
            class="typing-core__indicator-bg"
            cx="30"
            cy="30"
            :r="INDICATOR_RADIUS"
          />
          <circle
            class="typing-core__indicator-progress"
            :class="indicatorClass"
            cx="30"
            cy="30"
            :r="INDICATOR_RADIUS"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="indicatorOffset"
          />
        </svg>

        <div
          class="typing-core__indicator-content"
          :class="{
            'is-danger':
              indicatorClass.includes('is-danger') && gameMode === 'time_limit',
          }"
        >
          <template v-if="gameMode === 'time_limit'">
            <span class="typing-core__indicator-time">{{ remainingTime }}</span>
          </template>
          <template v-else-if="gameMode === 'sudden_death'">
            <HeartIcon class="typing-core__indicator-heart" />
            <span class="typing-core__indicator-life">{{
              remainingLives
            }}</span>
          </template>
        </div>
      </div>

      <div class="typing-core__main-text-wrapper">
        <p v-if="targetProblem" class="typing-core__problem">
          {{ formatSpaceForDisplay(targetProblem.problem_text) }}
        </p>

        <div class="typing-core__hiragana">
          <template v-if="parsedProblem.length > 0">
            <span
              v-for="(unit, index) in parsedProblem"
              :key="index"
              class="hiragana-char"
              :class="{ 'hiragana-typed': index < unitIndex }"
            >
              {{ formatSpaceForDisplay(unit.hiragana) }}
            </span>
          </template>
          <p v-else-if="targetHiragana">
            {{ formatSpaceForDisplay(targetHiragana) }}
          </p>
        </div>

        <div
          class="typing-core__romaji"
          :class="{ 'romaji-hidden': !shouldShowRomaji }"
        >
          <span class="typing-core__romaji--typed">
            {{ formatSpaceForDisplay(typedDisplayRomaji) }}
          </span>
          <span class="typing-core__romaji--remaining">
            {{ formatSpaceForDisplay(remainingDisplayRomaji) }}
          </span>
        </div>
      </div>

      <div class="typing-core__stats">
        <span class="typing-core__stat-label">Stats</span>
        <span class="typing-core__stat-label">
          KPM:
          <span class="typing-core__stat-value typing-core__stat-value--kpm">
            {{ sessionAverageKpm }}
          </span>
        </span>
        <span class="typing-core__stat-label">
          Acc:
          <span class="typing-core__stat-value typing-core__stat-value--acc">
            {{
              sessionAverageAccuracy === "-"
                ? "-"
                : sessionAverageAccuracy + "%"
            }}
          </span>
        </span>
        <span class="typing-core__stat-label">
          Miss:
          <span class="typing-core__stat-value typing-core__stat-value--miss">
            {{ totalMissCountSession }}
          </span>
        </span>
      </div>

      <div class="typing-core__debug" v-if="showDebug && currentUnit">
        <p class="typing-core__debug-text">
          ひらがな分割：
          <span
            v-for="(item, index) in parsedProblem"
            :key="`hiragana-${index}`"
          >
            <span :class="{ 'is-active': index === unitIndex }">{{
              item.hiragana
            }}</span>
            <span>/</span>
          </span>
          「{{ currentUnit.hiragana }}」を判定中
        </p>
        <p class="typing-core__debug-text">
          入力バッファ: [ {{ inputBuffer }} ]
        </p>
        <p class="typing-core__debug-text">
          「{{ currentUnit.hiragana }}」のパターン:
          {{ currentUnit.patterns.join(", ") }}
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
          :class="[
            keyObj.class,
            { 'is-active': isKeyActive(keyObj) },
            { 'is-miss-flash': isKeyActive(keyObj) && isMissAnimating },
          ]"
        >
          {{ keyObj.label }}
        </div>
      </div>
    </div>

    <div class="typing-core__hands-container">
      <div class="typing-core__hand typing-core__hand--left">
        <div
          class="typing-core__finger typing-core__finger--pinky"
          :class="[
            { 'is-active': isFingerActive('left-pinky') },
            {
              'is-miss-flash': isFingerActive('left-pinky') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--ring"
          :class="[
            { 'is-active': isFingerActive('left-ring') },
            {
              'is-miss-flash': isFingerActive('left-ring') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--middle"
          :class="[
            { 'is-active': isFingerActive('left-middle') },
            {
              'is-miss-flash': isFingerActive('left-middle') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--index"
          :class="[
            { 'is-active': isFingerActive('left-index') },
            {
              'is-miss-flash': isFingerActive('left-index') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--thumb"
          :class="[
            { 'is-active': isFingerActive('left-thumb') },
            {
              'is-miss-flash': isFingerActive('left-thumb') && isMissAnimating,
            },
          ]"
        ></div>
      </div>
      <div class="typing-core__hand typing-core__hand--right">
        <div
          class="typing-core__finger typing-core__finger--thumb"
          :class="[
            { 'is-active': isFingerActive('right-thumb') },
            {
              'is-miss-flash': isFingerActive('right-thumb') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--index"
          :class="[
            { 'is-active': isFingerActive('right-index') },
            {
              'is-miss-flash': isFingerActive('right-index') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--middle"
          :class="[
            { 'is-active': isFingerActive('right-middle') },
            {
              'is-miss-flash':
                isFingerActive('right-middle') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--ring"
          :class="[
            { 'is-active': isFingerActive('right-ring') },
            {
              'is-miss-flash': isFingerActive('right-ring') && isMissAnimating,
            },
          ]"
        ></div>
        <div
          class="typing-core__finger typing-core__finger--pinky"
          :class="[
            { 'is-active': isFingerActive('right-pinky') },
            {
              'is-miss-flash': isFingerActive('right-pinky') && isMissAnimating,
            },
          ]"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter, RouterLink } from "vue-router";
import api from "../services/api";
import romajiMapData from "@/data/romajiDictionary.json";
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";
import TimerIcon from "@/components/icons/TimerIcon.vue";
import SuddenDeathIcon from "@/components/icons/SuddenDeathIcon.vue";
import HeartIcon from "@/components/icons/HeartIcon.vue";
import Loading from "@/components/Loading.vue";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

// =========================================================================
// 定数・マッピングデータ (変更されない静的なデータ)
// =========================================================================

/**
 * キーボードレイアウト配列
 * 描画順（行ごと）にキーのラベルと判定用のキーコード、CSSクラスを定義
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
 * 記号から「実際に押すべき物理キー」へ変換するマップ
 * 例: "!" を打つためにはキーボードの "1" を光らせる必要があるため
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
 * Shiftキーを同時に押す必要がある文字のリスト（大文字以外）
 */
const shiftRequiredSymbols = "!\"#$%&'()=~|`{+*}<>?_";

/**
 * キー文字から「担当する指ID」へのマッピング
 * キーボードガイドの手のグラフィックを光らせるために使用
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
  " ": "left-thumb", // ベースポジションとして左手親指に割り当て

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
 * ローマ字マップ（高速アクセスできるMapオブジェクトに変換）
 */
const romajiMap = new Map(
  romajiMapData.map((item) => [item.Pattern, item.TypePattern])
);

/**
 * ローディングの最低表示時間 (ミリ秒)
 * 処理が速すぎた時に画面が一瞬だけチラつくのを防ぐためのバッファ時間
 */
const MIN_LOADING_MS = 300;

/**
 * 円形インジケーター用の半径
 */
const INDICATOR_RADIUS = 25;

/**
 * 円形インジケーター用の円周
 */
const CIRCUMFERENCE = 2 * Math.PI * INDICATOR_RADIUS;

// =========================================================================
// Props & Emits
// =========================================================================

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
  // 試し打ちモード
  isTryMode: { type: Boolean, default: false },
});

/**
 * Emits定義
 */
const emit = defineEmits(["complete"]);

// =========================================================================
// State (状態管理)
// =========================================================================

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
 * エラーメッセージ
 */
const errorMessage = ref("");

/**
 * 全問のひらがなリスト
 */
const hiraganaList = ref([]);

/**
 * 全問のパース（分割）結果を保持する配列
 */
const parsedProblemsList = ref([]);

/**
 * 現在の問題番号 (0始まり)
 */
const currentProblemIndex = ref(0);

/**
 * 今の問題でミスをしたかどうか
 */
const hasMissedInCurrentProblem = ref(false);

/**
 * ひらがなを分割した配列 (現在の問題)
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
 * ミスした瞬間の点滅アニメーション用フラグ
 */
const isMissAnimating = ref(false);

/**
 * タイマーID
 */
let timerInterval = null;

// =========================================================================
// Getters (算出状態)
// =========================================================================

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

/**
 * 残りライフ (Sudden Death用)
 */
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
 * インジケーターの色クラスとアニメーション種類
 */
const indicatorClass = computed(() => {
  if (props.gameMode === "time_limit") {
    if (remainingTime.value >= 15) return "is-safe time-mode";
    if (remainingTime.value >= 10) return "is-warning time-mode";
    return "is-danger time-mode";
  } else if (props.gameMode === "sudden_death") {
    if (remainingLives.value >= 4) return "is-safe life-mode";
    if (remainingLives.value >= 2) return "is-warning life-mode";
    return "is-danger life-mode";
  }
  return "";
});

/**
 * インジケーターの破線オフセット（減り具合）
 */
const indicatorOffset = computed(() => {
  if (props.gameMode === "time_limit") {
    const progress = timeProgressPercentage.value / 100;
    // 100%の時に0、0%の時に円周と同じ長さ（隠れる）になる
    return CIRCUMFERENCE * (1 - progress);
  } else if (props.gameMode === "sudden_death") {
    let progress = 0;
    if (props.missLimit > 0) {
      progress = remainingLives.value / props.missLimit;
    }
    return CIRCUMFERENCE * (1 - progress);
  }
  return 0;
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

  // 計算 (時間が0なら '-' を返す)
  if (totalTimeMs === 0) return "-";

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
    totalMiss += res.miss_count;
  });

  // 今の問題の分
  totalCorrect += correctKeyCount.value;
  totalMiss += missKeyCount.value;

  const total = totalCorrect + totalMiss;

  // 1キーも打っていない場合は '-' を返す
  if (total === 0) return "-";

  return Math.round((totalCorrect / total) * 100);
});

/**
 * ローマ字ガイドを表示すべきかどうか
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

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * 表示用にスペースをオープンボックスに変換する
 * @param {String} text 変換したい文字列
 * @returns {String} 変換後の文字列
 */
const formatSpaceForDisplay = (text) => {
  if (!text) return "";
  // 半角スペースと全角スペースの両方をオープンボックスに変換する
  return text.replace(/[ 　]/g, "␣");
};

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

  // 時間制限モードならタイマー始動
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
 * @param {String|null} reason 終了理由（成功時はnull）
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
      remainingLives: remainingLives.value, // 残りライフ
    },
  };

  emit("complete", completeData);
};

/**
 * 強制終了処理 (ゲームオーバー時)
 * @param {String} reason 終了理由
 */
const forceFinishGame = (reason) => {
  if (timerInterval) clearInterval(timerInterval);

  // プレイ中なら、今の問題の結果も（途中だけど）配列に追加する
  if (!isCompleted.value) {
    sessionResults.value.push({
      problem_text: targetProblem.value.problem_text + ` (${reason})`,
      problem_hiragana: targetHiragana.value,
      kpm: 0, // 途中終了なので0とする
      accuracy: currentAccuracy.value,
      missed_keys: { ...currentMissedKeys.value },
      miss_count: missKeyCount.value,
      romaji_text: displayRomaji.value,
      correct_key_count: correctKeyCount.value,
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
 * @returns {Object} パースされたユニット配列とデフォルトの入力パターン配列
 */
const parseHiragana = (hiragana) => {
  const units = [];
  const defaultPatterns = [];
  let cursor = 0;

  while (cursor < hiragana.length) {
    let matched = false;
    // 3文字、2文字、1文字といった順番で検索していく
    for (let len = 3; len >= 1; len--) {
      const chunk = hiragana.substring(cursor, cursor + len);
      if (romajiMap.has(chunk)) {
        const patterns = romajiMap.get(chunk);
        units.push({ hiragana: chunk, patterns: patterns });
        defaultPatterns.push(patterns[0]);
        cursor += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const errorChar = hiragana[cursor];
      throw new Error(`未対応の文字「${errorChar}」が含まれています。`);
    }
  }

  return {
    parsedUnits: units,
    defaultActivePatterns: defaultPatterns,
  };
};

/**
 * キー判定処理（メインロジック）
 * @param {KeyboardEvent} e キーボードイベントオブジェクト
 */
const handleKeydown = (e) => {
  // ロード中や完了時は操作を受け付けない
  if (isLoading.value || isCompleted.value) return;

  // まだスタートしてない時
  if (!isStarted.value) {
    // スペースキーが押されたらスタート
    if (e.code === "Space") {
      e.preventDefault(); // スクロール防止
      startGame();
    }
    return; // 他のキーは無視、タイピング判定もしない
  }

  // --- ここからはタイピングプレイ中の判定 ---

  // 制御キーは無視
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "Backspace" || e.key === "Shift") {
    e.preventDefault();
    return;
  }

  // 1文字キー以外は無視（F1キーなども弾く）
  if (e.key.length !== 1) return;

  e.preventDefault();

  // 最初のキー入力でタイマー開始
  if (problemStartTime.value === 0) {
    problemStartTime.value = Date.now();
  }

  // 判定中の問題がない場合は何もしない
  if (!currentUnit.value) return;

  // 入力判定バッファにキーを加える
  const newBuffer = inputBuffer.value + e.key;

  // 完全一致
  const perfectMatch = currentPatterns.value.find(
    (pattern) => pattern === newBuffer
  );
  if (perfectMatch) {
    playSound("type");
    correctKeyCount.value++;
    advanceUnit(perfectMatch);
    return;
  }

  // 前方一致
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

  // ミスアニメーションを発火させる
  isMissAnimating.value = true;
  // 0.3秒(アニメーションと同じ長さ)後にフラグを戻す
  setTimeout(() => {
    isMissAnimating.value = false;
  }, 300);

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
    problem_hiragana: targetHiragana.value,
    kpm: currentKpm.value,
    accuracy: currentAccuracy.value,
    missed_keys: { ...currentMissedKeys.value },
    miss_count: missKeyCount.value,
    romaji_text: displayRomaji.value,
    correct_key_count: correctKeyCount.value,
    duration_ms: durationMs,
  };

  sessionResults.value.push(result);

  // 次の問題へ遷移
  if (currentProblemIndex.value < props.problems.length - 1) {
    // 最後の文字を打ち終わったことを(視覚的に色変化で)見せるために、0.2秒だけ待つ
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

  // 事前に用意したリストから取得
  const currentParsedData = parsedProblemsList.value[currentProblemIndex.value];
  parsedProblem.value = currentParsedData.parsedUnits;

  // activePatternsはユーザーのタイピングによって動的に変化するので新たに配列を生成して代入
  activePatterns.value = [...currentParsedData.defaultActivePatterns];
};

/**
 * タイピング対象キーであるか（キーボードのハイライト判定）
 * @param {Object} keyObj キーボードレイアウトのキーオブジェクト
 * @returns {Boolean} 光らせるべきならtrue
 */
const isKeyActive = (keyObj) => {
  const target = nextExpectedKey.value; // 次に打つべき文字
  const keyChar = keyObj.key; // キーボード上の文字 ('a', '1', 'Shift' など)

  // スタート前はスペースキーだけ光らせる
  if (!isStarted.value && keyChar === " ") {
    return true;
  } else if (!isStarted.value) {
    return false;
  }

  if (!target) return false;

  // ローマ字ガイドが非表示の時はキーボードも光らせない
  if (!shouldShowRomaji.value) {
    return false;
  }

  // --- A. Shiftキー自体の判定 ---
  if (keyChar === "ShiftLeft" || keyChar === "ShiftRight") {
    // 1. まず、ターゲット文字について情報整理
    let targetBaseKey = target; // 判定に使う「キーの文字」

    // 記号の場合、Shift不要な「元のキー文字」に変換 (例: '!' -> '1')
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
    const fingerId = keyToFingerMap[targetBaseKey.toUpperCase()];

    // 指情報がない（万が一の未定義キー）場合は光らせない
    if (!fingerId) return false;

    // 'left-pinky' -> 'left', 'right-index' -> 'right' を取り出す
    const hand = fingerId.split("-")[0];

    // 4. クロスハンドの原則：手と逆のShiftキーを光らせる
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
 * タイピング対象キーの対応している指であるか（ガイドハンドのハイライト判定）
 * @param {String} fingerId 指のID (例: 'left-index')
 * @returns {Boolean} 光らせるべきならtrue
 */
const isFingerActive = (fingerId) => {
  // 設定で非表示なら光らせない
  if (!shouldShowRomaji.value || !isStarted.value) {
    return false;
  }

  const target = nextExpectedKey.value;
  if (!target) return false;

  // ターゲット文字の「元のキー」を特定
  let targetBaseKey = target;
  if (symbolToKeyMap[target]) {
    targetBaseKey = symbolToKeyMap[target];
  }

  // 文字を打つ指 (charFingerId) を取得
  const charFingerId = keyToFingerMap[targetBaseKey.toUpperCase()];

  // --- 判定A：この指は「文字を打つ指」か？ ---
  if (charFingerId === fingerId) {
    return true; // 文字担当の指なら光る！
  }

  // --- 判定B：この指は「Shiftを押す指」か？ ---

  // Shiftが必要かチェック
  const isUpperCase = target >= "A" && target <= "Z";
  const isShiftSymbol = shiftRequiredSymbols.includes(target);

  // Shiftが必要な場合のみ、小指の判定を行う
  if (isUpperCase || isShiftSymbol) {
    // 文字を打つ指が、左右どっちの手か取得 ('left' or 'right')
    if (!charFingerId) return false;
    const charHand = charFingerId.split("-")[0];

    // 小指判定 (クロスハンドの原則)
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

// =========================================================================
// ライフサイクル
// =========================================================================

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

      // 一瞬で画面が切り替わってチラつくのを防ぐために待つ
      await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS));
    } else {
      // --- AIモード (ひらがな無し) ---
      const texts = props.problems.map((p) => p.problem_text);
      // APIでひらがなを取得、最低待機時間（ローディング表示用）
      const [response] = await Promise.all([
        api.post("/api/get-hiragana", { texts: texts }),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      hiraganas = response.data.hiraganas;
    }

    // データをセット
    hiraganaList.value = hiraganas;

    // 全問まとめてパースする
    const parsedList = [];
    for (let i = 0; i < hiraganas.length; i++) {
      const parsed = parseHiragana(hiraganas[i]);
      parsedList.push(parsed);
    }
    parsedProblemsList.value = parsedList;

    // ゲーム開始準備
    setupCurrentProblem();
  } catch (error) {
    // APIエラーの場合は error.response?.data?.message
    // parseHiragana でのエラーの場合は error.message
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "問題データの読み込みに失敗しました。";

    notificationStore.addNotification(errorMessage.value, "error");
  } finally {
    isLoading.value = false;
  }
});

/**
 * アンマウント時処理
 */
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);

  // タイマーの削除
  if (timerInterval) clearInterval(timerInterval);
});
</script>
<style lang="scss" scoped>
/* =========================================================================
 * パッケージ・変数の読み込み
 * ========================================================================= */
@use "sass:color";

/* =========================================================================
 * メインスタイル
 * ========================================================================= */
.typing-core {
  display: flex;
  flex-direction: column;
  width: 100%;

  /* 画面が縮んでも、キーボードのレイアウトが崩れないように最低幅を保証する */
  min-width: 80rem;

  &__loading,
  &__error,
  &__completed,
  &__ready {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    align-items: center;
    justify-content: center;

    /* 中身の量が違っても、画面がガタガタ動かないように最低高さを確保 */
    min-height: 25rem;
    background-color: $gray;
    border-radius: $radius-lg;
  }

  &__completed-title,
  &__ready-title {
    font-family: $roboto-mono;
    font-size: 3.8rem;
    font-weight: $bold;
  }

  &__completed-message,
  &__ready-text {
    font-size: 2.2rem;
    font-weight: $bold;
  }

  &__error-title {
    font-family: $roboto-mono;
    font-size: 3.8rem;
    font-weight: $bold;
    color: $red;
  }

  &__error-message {
    font-size: 1.8rem;
    font-weight: $bold;
    color: $red;
  }

  &__back-button {
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include button-style-fill($green);
    @include fluid-text(14, 18);
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }

  &__ready-highlight {
    color: $orange;
  }

  &__mode-info {
    display: flex;
    gap: 1.6rem;
    align-items: center;
    font-size: 1.8rem;
    font-weight: $bold;
  }

  &__mode-name {
    display: flex;
    align-items: center;
  }

  &__timer-icon,
  &__sudden-death-icon {
    height: 1em;
    margin-right: 0.5em;
    fill: currentcolor;
  }

  &__mode-count {
    color: $red;
  }

  &__playing {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    justify-content: space-between;
    min-height: 25rem;
    padding: 1.6rem 3.2rem;
    background-color: $gray;
    border-radius: $radius-lg;

    /* 特殊モード時はUI（ゲージ等）が増えるため、
       少しだけ高さを広げてあげることでレイアウトの窮屈さを防ぐ */
    &.time-limit,
    &.sudden-death {
      min-height: 30rem;
    }
  }

  &__progress {
    font-family: $roboto-mono;
    font-size: 1.6rem;
    font-weight: $bold;
    line-height: 1;
    color: $light-black;
    text-align: center;
  }

  /* --- 円形インジケーター --- */
  &__circular-indicator {
    position: absolute;
    top: 1.6rem;
    right: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 6.4rem;
    aspect-ratio: 1;
  }

  &__indicator-bg {
    fill: none;
    stroke: $white; // 背景色($gray)より一段明るい色でトラックを作る
    stroke-width: 5;
  }

  &__indicator-progress {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;

    /* 12時の方向からスタートさせるため -90度回転 */
    transform: rotate(-90deg);
    transform-origin: 50% 50%;

    &.is-safe {
      stroke: $green;
    }

    &.is-warning {
      stroke: $yellow;
    }

    &.is-danger {
      stroke: $red;
    }

    /* 時間制限モード：滑らかに減る */
    &.time-mode {
      transition: stroke-dashoffset 1s linear, stroke $transition-base;
    }

    /* サドンデスモード：ミス時にカクッと減る */
    &.life-mode {
      transition: stroke-dashoffset 0.2s ease-out, stroke $transition-base;
    }
  }

  &__indicator-content {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $roboto-mono;
    font-weight: $bold;
    line-height: 1;
    color: $light-black;

    &.is-danger {
      color: $red;

      /* 時間が少ない時の鼓動アニメーション */
      animation: pulse 1s infinite;
    }
  }

  &__indicator-time {
    font-size: 1.8rem;
    color: inherit;
  }

  &__indicator-heart {
    width: 1.6rem;
    aspect-ratio: 1;
    margin-right: 0.2rem;
    fill: $red;
  }

  &__indicator-life {
    font-size: 1.6rem;
  }

  /* --- メインテキスト（問題・ふりがな・ローマ字）関連 --- */
  &__main-text-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    justify-content: center;

    /* 問題文が特殊モードのインジケーターに被さらないように */
    padding-right: 4rem;
  }

  &__problem {
    font-size: 3rem;
    font-weight: $bold;
    line-height: 1.4;
  }

  &__hiragana {
    font-size: 2rem;
    font-weight: $bold;
    line-height: 1.4;
    color: $light-black;

    .hiragana-char {
      display: inline-block;
    }

    .hiragana-typed {
      color: $orange;
    }
  }

  &__romaji {
    /* visibility と opacity を組み合わせることで、
       「見えないけどそこに存在している（高さが保たれる）」状態を作り、画面のガタつきを防ぐ */
    visibility: visible;
    min-height: 3rem;
    font-family: $roboto-mono;
    font-size: 2.6rem;
    font-weight: $bold;
    line-height: 1.4;
    letter-spacing: 0.05em;
    opacity: 1;

    &.romaji-hidden {
      visibility: hidden;
      opacity: 0;
    }

    &--typed {
      color: $orange;
    }

    &--remaining {
      color: $light-black;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1.2fr 1.2fr;
    width: 37rem;
    padding: 1.4rem 2rem;
    margin-inline: auto;
    font-family: $roboto-mono;
    font-size: 1.4rem;
    font-weight: $bold;
    background-color: $white;
    border-radius: 100vmax;
  }

  &__stat-label {
    position: relative;
    display: inline-block;

    /* 「Stats」という最初のラベルの右側にだけ、区切りの縦線を引く */
    &:first-of-type::after {
      position: absolute;
      top: 50%;
      right: 1.4rem;
      width: 1px;
      height: 2rem;
      content: "";
      background-color: $light-black;
      transform: translateY(-50%);
    }
  }

  &__stat-value {
    display: inline-block;

    &--kpm {
      color: $blue;
    }

    &--acc {
      color: $green;
    }

    &--miss {
      color: $red;
    }
  }

  &__debug {
    display: flex;
    flex-direction: column;
    padding: 1.2rem;
    background-color: $white;
    border-radius: $radius-md;
  }

  &__debug-text {
    font-size: 1.2rem;

    .is-active {
      color: $blue;
    }
  }

  /* --- キーボード関連 --- */
  &__keyboard-container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;
    padding: 2.4rem;
    margin-top: 2.4rem;
    background-color: $light-blue;
    border-radius: $radius-lg;
  }

  &__keyboard-row {
    display: flex;
    gap: 0.8rem;
    justify-content: center;
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

    /* キーを連続でクリックしても文字が青く選択されないようにする */
    user-select: none;
    background-color: $white;
    border-radius: $radius-md;
    box-shadow: $key-shadow;

    &.key-backspace {
      visibility: hidden;
    }

    &.key-tab {
      visibility: hidden;
      width: 7.7rem;
    }

    &.key-caps {
      visibility: hidden;
      width: 8.5rem;
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
      visibility: hidden;
      width: 6.6rem;
    }

    &.key-spacer-3 {
      visibility: hidden;
      width: 5.8rem;
    }

    &.is-active {
      color: $white;
      background-color: $orange;
      box-shadow: 0 4px 0 color.adjust($orange, $lightness: -10%);
      transform: translateY(2px);
    }

    &.is-miss-flash {
      animation: miss-flash 0.3s ease-out;
    }
  }

  /* --- ガイドハンド（指）関連 --- */
  &__hands-container {
    display: flex;
    gap: 8rem;
    justify-content: center;

    /* キーボードの下に少し入り込むようにマイナスマージンで調整 */
    margin-top: -3rem;
  }

  &__hand {
    display: flex;
    gap: 0.8rem;
    align-items: flex-end;
  }

  &__finger {
    width: 4rem;
    height: 8.5rem;
    background-color: $gray;
    border-radius: $radius-lg $radius-lg 0 0;

    &--pinky {
      height: 6rem;
    }

    &--middle {
      height: 10rem;
    }

    &--thumb {
      height: 4rem;
    }

    &.is-active {
      background-color: $orange;
    }

    &.is-miss-flash {
      animation: miss-flash 0.3s ease-out;
    }
  }
}

/* =========================================================================
 * @keyframes (アニメーションの定義)
 * ========================================================================= */
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

@keyframes miss-flash {
  0% {
    background-color: $orange;
  }

  /* ミスしたら一瞬だけ赤く光らせる */
  30% {
    background-color: $red;
    box-shadow: 0 4px 0 color.adjust($red, $lightness: -10%);
    transform: translateY(2px) scale(1.05);
  }

  100% {
    background-color: $orange;
  }
}
</style>