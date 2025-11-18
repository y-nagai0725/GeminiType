<template>
  <div class="typing-core">
    <div v-if="isLoading" class="typing-core__loading">準備中...</div>

    <div v-else-if="isCompleted" class="typing-core__completed">
      <h2>Finish!</h2>
      <p>お疲れ様でした！♡</p>
      <p>少々お待ちください...</p>
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
        WPM: {{ currentWpm }} | Accuracy: {{ currentAccuracy }}%
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
import { useSettingsStore } from "../stores/settingsStore"; // (★) 設定ストアを追加

// --- 設定＆辞書 ---
const settingsStore = useSettingsStore();
const romaMap = new Map(
  romaMapData.map((item) => [item.Pattern, item.TypePattern])
);

// --- Router & Store ---
const router = useRouter();
const notificationStore = useNotificationStore();

// --- Props & Emits ---
const props = defineProps({
  // 問題配列
  problems: { type: Array, required: true },

  // デバッグ部分の表示・非表示
  showDebug: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["complete"]); // (★) 全問終わったら親に知らせる！

// --- 状態 (State) ---
const isLoading = ref(true); // (★) 初期ロード中
const isCompleted = ref(false); // (★) 全問完了フラグ

// 問題管理
const hiraganaList = ref([]); // (★) 全問分のひらがなリスト
const currentProblemIndex = ref(0); // (★) 今何問目？
const targetProblem = computed(
  () => props.problems[currentProblemIndex.value] || null
);
const targetHiragana = computed(
  () => hiraganaList.value[currentProblemIndex.value] || ""
); // (★) computedに変更

// エンジン用 (v10.3と同じ)
const parsedProblem = ref([]);
const unitIndex = ref(0);
const inputBuffer = ref("");
const activePatterns = ref([]);
const typedRomajiLength = ref(0);

// 計測用 (★New!)
const problemStartTime = ref(0); // 1問ごとの開始時間
const correctKeyCount = ref(0); // 正解キー数
const missKeyCount = ref(0); // ミスタイプ数
const sessionResults = ref([]); // 全問の結果をためる配列

const currentMissedKeys = ref({});

// --- Computed (エンジン用) ---
const currentUnit = computed(
  () => parsedProblem.value[unitIndex.value] || null
);
const currentPatterns = computed(() =>
  currentUnit.value ? currentUnit.value.patterns : []
);
const displayRomaji = computed(() => activePatterns.value.join(""));
const typedDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(0, typedRomajiLength.value);
});
const remainingDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(typedRomajiLength.value);
});

// --- Computed (リアルタイム表示用) ---
const currentWpm = computed(() => {
  if (!problemStartTime.value || correctKeyCount.value === 0) return 0;
  const durationMin = (Date.now() - problemStartTime.value) / 1000 / 60;
  return Math.round(correctKeyCount.value / durationMin);
});
const currentAccuracy = computed(() => {
  const total = correctKeyCount.value + missKeyCount.value;
  if (total === 0) return 100;
  return Math.round((correctKeyCount.value / total) * 100);
});

// --- 効果音 ---
const playSound = (type) => {
  // 設定でOFFなら鳴らさない
  if (type === "type" && !settingsStore.soundEnabled) return;
  if (type === "miss" && !settingsStore.missSoundEnabled) return;

  const audio = new Audio(`/sounds/${type}.mp3`); // public/sounds/type.mp3
  audio.volume = 0.5;
  audio.currentTime = 0;
  audio.play().catch(() => {}); // ファイルがない等のエラーは無視
};

// --- エンジン処理 (v10.3ベース) ---

/**
 * 問題文のひらがなを分割する (v10.3)
 */
const parseHiragana = (hiragana) => {
  const units = [];
  const defaultPatterns = [];
  let cursor = 0;
  while (cursor < hiragana.length) {
    let matched = false;
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
 * キー判定処理 (v10.3 + 計測＆音)
 */
const handleKeydown = (e) => {
  if (isLoading.value || isCompleted.value) return; // (★) プレイ中以外は無視

  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "Backspace" || e.key === "Shift") {
    e.preventDefault();
    return;
  }
  if (e.key.length !== 1) return;

  e.preventDefault();

  // (★) 開始時間が未設定なら今セット（最初の1打）
  if (problemStartTime.value === 0) {
    problemStartTime.value = Date.now();
  }

  if (!currentUnit.value) return;

  const newBuffer = inputBuffer.value + e.key; // (★) 大文字対応済みなのでそのまま！

  // 1. 完全一致
  const perfectMatch = currentPatterns.value.find(
    (pattern) => pattern === newBuffer
  );
  if (perfectMatch) {
    playSound("type"); // (★) 正解音
    correctKeyCount.value++; // (★) カウント
    advanceUnit(perfectMatch);
    return;
  }

  // 2. 前方一致
  const partialMatch = currentPatterns.value.find((pattern) =>
    pattern.startsWith(newBuffer)
  );
  if (partialMatch) {
    playSound("type"); // (★) 正解音
    correctKeyCount.value++; // (★) カウント
    handlePartialMatch(partialMatch, newBuffer);
    return;
  }

  // ミスタイプ
  playSound("miss"); // (★) ミス音
  missKeyCount.value++; // (★) ミスカウント
  console.log("ミスタイプ！");

  const currentActivePattern = activePatterns.value[unitIndex.value]

  // 今のバッファの長さの場所にある文字が「打つべきキー」！
  // (例: inputBufferが "s" (1文字) なら、次は pattern[1] の文字)
  if (currentActivePattern && currentActivePattern.length > inputBuffer.value.length) {
    const expectedKey = currentActivePattern[inputBuffer.value.length];

    // 集計箱にカウントアップ！
    if (!currentMissedKeys.value[expectedKey]) {
      currentMissedKeys.value[expectedKey] = 0;
    }
    currentMissedKeys.value[expectedKey]++;

    console.log(`惜しい！次は「${expectedKey}」だよ！`); // デバッグ用
  }
};

/**
 * 「前方一致」判定の時の処理 (v10.3)
 */
const handlePartialMatch = (partialPattern, newBuffer) => {
  if (activePatterns.value[unitIndex.value] !== partialPattern) {
    activePatterns.value[unitIndex.value] = partialPattern;
  }
  inputBuffer.value = newBuffer;
  updateHighlightingLength();
};

/**
 * 判定をクリアして、次のユニットに進む (v10.3 + 全問終了判定)
 */
const advanceUnit = (matchedPattern) => {
  activePatterns.value[unitIndex.value] = matchedPattern;
  inputBuffer.value = "";
  unitIndex.value++;
  updateHighlightingLength();

  // (★) もし全ユニット終わったら？ -> 次の問題へ！
  if (unitIndex.value >= parsedProblem.value.length) {
    finishCurrentProblem();
  }
};

/**
 * 文字色を変える長さを再計算 (v10.3)
 */
const updateHighlightingLength = () => {
  let newLength = 0;
  for (let i = 0; i < unitIndex.value; i++) {
    newLength += activePatterns.value[i].length;
  }
  newLength += inputBuffer.value.length;
  typedRomajiLength.value = newLength;
};

// --- 問題切り替え処理 (★New!) ---

// 1問終了時の処理
const finishCurrentProblem = () => {
  // 結果を記録
  const result = {
    problem_text: targetProblem.value.problem_text,
    wpm: currentWpm.value,
    accuracy: currentAccuracy.value,
    missed_keys: { ...currentMissedKeys.value },
  };
  sessionResults.value.push(result);

  // 次の問題へ
  if (currentProblemIndex.value < props.problems.length - 1) {
    // 少し待ってから次へ（余韻）
    setTimeout(() => {
      currentProblemIndex.value++;
      setupCurrentProblem(); // 次の問題をセットアップ
    }, 200);
  } else {
    // 全問終了！
    isCompleted.value = true;
    emit("complete", sessionResults.value); // 親に結果を渡す
  }
};

// 現在の問題のセットアップ（初期化）
const setupCurrentProblem = () => {
  // 各種カウンタのリセット
  unitIndex.value = 0;
  inputBuffer.value = "";
  typedRomajiLength.value = 0;
  problemStartTime.value = 0; // タイマーは最初のキーを押したときに開始
  correctKeyCount.value = 0;
  missKeyCount.value = 0;
  currentMissedKeys.value = {};

  // v10.3エンジンの起動
  const hiragana = hiraganaList.value[currentProblemIndex.value];
  const { parsedUnits, defaultActivePatterns } = parseHiragana(hiragana);
  parsedProblem.value = parsedUnits;
  activePatterns.value = defaultActivePatterns;
};

/**
 * マウント時処理
 */
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  // 問題文が存在しない場合は何もしない
  if (!props.problems || props.problems.length === 0) return;

  try {
    // (★) 全問分の「ひらがな」を一括取得！
    const texts = props.problems.map((p) => p.problem_text);
    const response = await api.post("/api/get-hiragana", {
      texts: texts,
    });

    hiraganaList.value = response.data.hiraganas; // 全問分のひらがな保持

    // 1問目をセットアップ
    setupCurrentProblem();

    isLoading.value = false; // 準備完了！
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.message || "問題の読み込みに失敗しました。",
      "error"
    );
    // TODO 仮に「/（ホーム）」に戻す！
    router.push("/");
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
/* 基本スタイルは同じ */
.typing-core {
  /* ... */
  border: 2px solid #eee;
  padding: 2rem;
  text-align: center;

  &__loading,
  &__completed {
    font-size: 1.5rem;
    color: #555;
    padding: 2rem;
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

  /* ... 既存のスタイル ... */
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