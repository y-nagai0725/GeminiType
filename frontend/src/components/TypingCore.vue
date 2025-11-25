<template>
  <div class="typing-core">
    <div v-if="isLoading" class="typing-core__loading">準備中...</div>

    <div v-else-if="isCompleted" class="typing-core__completed">
      <h2>Finish!</h2>
      <p>お疲れ様でした！♡</p>
      <p>集計中...</p>
    </div>

    <div v-else-if="!isStarted" class="typing-core__ready" @click="startGame">
      <h2>Ready?</h2>
      <p>スペースキーを押してスタート！</p>
      <p class="typing-core__sub-text">（または画面をクリック）</p>
    </div>

    <div v-else class="typing-core__playing">
      <div class="typing-core__progress">
        Problem: {{ currentProblemIndex + 1 }} / {{ problems.length }}
      </div>

      <div class="typing-core__problem">
        <h2 v-if="targetProblem">{{ targetProblem.problem_text }}</h2>
      </div>

      <div class="typing-core__hiragana">
        <p v-if="targetHiragana">{{ targetHiragana }}</p>
      </div>

      <div class="typing-core__romaji">
        <span class="typing-core__romaji--typed">
          {{ typedDisplayRomaji }}
        </span>
        <span class="typing-core__romaji--remaining">
          {{ remainingDisplayRomaji }}
        </span>
      </div>

      <div class="typing-core__stats">
        KPM: {{ currentKpm }} | Accuracy: {{ currentAccuracy }}%
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import romaMapData from "@/data/romanTypingParseDictionary.json";
import { useNotificationStore } from "../stores/notificationStore";
import { useSettingsStore } from "../stores/settingsStore";

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
 * props
 */
const props = defineProps({
  // 問題配列
  problems: { type: Array, required: true },

  // デバッグ部分の表示・非表示
  showDebug: {
    type: Boolean,
    default: false,
  },
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
 * (★) スタートしたかどうか (待機画面用)
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
 * (★) ゲームスタート処理
 */
const startGame = () => {
  isStarted.value = true;
  // 最初の問題のタイマー開始は、実際にキーを打った時（handleKeydown内）に行う
};

/**
 * 問題文のひらがなを分割する
 * @param {String} hiragana 問題文のひらがな
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
  console.log("ミスタイプ！");

  // 本来打つべきだったキーを集計
  const currentActivePattern = activePatterns.value[unitIndex.value];
  if (
    currentActivePattern &&
    currentActivePattern.length > inputBuffer.value.length
  ) {
    const expectedKey = currentActivePattern[inputBuffer.value.length];

    if (!currentMissedKeys.value[expectedKey]) {
      currentMissedKeys.value[expectedKey] = 0;
    }
    currentMissedKeys.value[expectedKey]++;
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
  const result = {
    problem_text: targetProblem.value.problem_text,
    kpm: currentKpm.value,
    accuracy: currentAccuracy.value,
    missed_keys: { ...currentMissedKeys.value },
    correct_key_count: correctKeyCount.value,
    miss_key_count: missKeyCount.value,
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
    // 全問終了
    isCompleted.value = true;
    emit("complete", sessionResults.value);
  }
};

/**
 * 現在の問題のセットアップ（初期化）
 */
const setupCurrentProblem = () => {
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
 * マウント時処理
 */
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  if (!props.problems || props.problems.length === 0) return;

  try {
    // ひらがなを一括取得
    const texts = props.problems.map((p) => p.problem_text);
    const response = await api.post("/api/get-hiragana", {
      texts: texts,
    });

    hiraganaList.value = response.data.hiraganas;

    // 1問目をセットアップ
    setupCurrentProblem();

    isLoading.value = false;
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "問題の読み込みに失敗しました。",
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
});
</script>

<style lang="scss" scoped>
.typing-core {
  border: 2px dashed #ccc;
  padding: 1.5rem;
  font-family: "Courier New", Courier, monospace;
  text-align: center;

  /* ローディング・完了・待機画面の共通スタイル */
  &__loading,
  &__completed,
  &__ready {
    font-size: 1.5rem;
    color: #555;
    padding: 3rem 0;
    cursor: default;
  }

  /* (★) 待機画面特有のスタイル */
  &__ready {
    cursor: pointer; /* クリックできる感 */

    h2 {
      font-size: 2.5rem;
      color: #007bff;
      margin-bottom: 1rem;
    }

    .typing-core__sub-text {
      font-size: 1rem;
      color: #888;
      margin-top: 0.5rem;
    }
  }

  &__progress {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 1rem;
  }

  &__stats {
    margin-top: 2rem;
    font-weight: bold;
    color: #007bff;
  }

  &__problem h2 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #333;
  }

  &__hiragana p {
    font-size: 1.2rem;
    color: #666;
    margin: 0.5rem 0;
  }

  &__romaji {
    font-size: 1.75rem;
    letter-spacing: 2px;
    background-color: #f9f9f9;
    padding: 0.5rem;
    border-radius: 4px;
    min-height: 1.75rem;
    margin-top: 1rem;

    &--typed {
      color: #007bff;
      font-weight: bold;
    }
    &--remaining {
      color: #aaa;
    }
  }
  &__debug {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #999;
    background-color: #f0f0f0;
    padding: 0.5rem;
  }
}
</style>