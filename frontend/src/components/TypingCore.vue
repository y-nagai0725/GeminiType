<template>
  <div class="typing-core">
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

    <div class="typing-core__debug" v-if="props.showDebug && currentUnit">
      <p>
        ひらがなIndex: {{ unitIndex }} (「{{ currentUnit.hiragana }}」を判定中)
      </p>
      <p>入力バッファ: [ {{ inputBuffer }} ]</p>
      <p>
        （「{{ currentUnit.hiragana }}」のパターン:
        {{ currentUnit.patterns.join(", ") }}）
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import api from "../services/api";
import romaMapData from "@/data/romanTypingParseDictionary.json";

// (★) JSON を「高速なMap」に変換！
const romaMap = new Map(
  romaMapData.map((item) => [item.Pattern, item.TypePattern])
);

// --- 1. 「外」から受け取る「お仕事リスト」 ---
const props = defineProps({
  problems: { type: Array, required: true },
  showDebug: {
    type: Boolean,
    default: false, // (★) デフォルトは「無し（見せない）」 だね！
  },
});

// --- 2. 「宝箱」たち (State) ---
const targetProblem = computed(() => props.problems[0] || null);
const targetHiragana = ref("");
const parsedProblem = ref([]);
const unitIndex = ref(0);
const inputBuffer = ref("");
const activePatterns = ref([]); // (★) 「答え」のローマ字配列
const typedRomajiLength = ref(0); // (★) 「色を変える」 長さ

// --- 3. 「計算結果」たち (Computed) ---
const currentUnit = computed(
  () => parsedProblem.value[unitIndex.value] || null
);
const currentPatterns = computed(() =>
  currentUnit.value ? currentUnit.value.patterns : []
);

// (★) お手本ローマ字「全体」 (v9 と同じ！)
const displayRomaji = computed(() => activePatterns.value.join(""));
// (★) 「色が変わった」 部分 (v9 と同じ！)
const typedDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(0, typedRomajiLength.value);
});
// (★) 「まだ」の部分 (v9 と同じ！)
const remainingDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(typedRomajiLength.value);
});

// --- 4. 「魔法」たち (Functions) ---

/**
 * (★) 「ひらがな」を「パース（分割）」する「専用エンジン」！ (v8 と同じ！)
 */
const parseHiragana = (hiragana) => {
  /* ... (v8 とまったく同じ) ... */
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
      console.error(`辞書 にない文字が！: ${hiragana[cursor]}`);
      units.push({ hiragana: hiragana[cursor], patterns: [hiragana[cursor]] });
      defaultPatterns.push(hiragana[cursor]);
      cursor++;
    }
  }
  return {
    parsedUnits: units,
    defaultActivePatterns: defaultPatterns,
  };
};

/**
 * (★) (★) (★)
 * 「v10」 の「心臓部」！ `handleKeydown` ！
 * (★) (★) (★)
 */
const handleKeydown = (e) => {
  // 1. 制御キーは「無視」
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  // (★) 「Backspace」と「Shift」は、
  // 「キー入力（e.key）」としては「無視」するけど、
  // 「ブラウザの動作（戻る）」は「止めて」ほしい！
  if (e.key === "Backspace" || e.key === "Shift") {
    e.preventDefault();
    return; // (★) でも、タイピング判定は「しない」よ！
  }

  // (★) 「1文字」のキー（"a", "S", "/", "?" とか）だけを拾う！
  if (e.key.length !== 1) return;

  e.preventDefault();

  if (!currentUnit.value) return;

  // (★) (★) (★)
  // 「.toLowerCase()」を「削除」する！
  // (★) (★) (★)
  const newBuffer = inputBuffer.value + e.key;

  // 1. (★) 「完全一致」？
  const perfectMatch = currentPatterns.value.find(
    (pattern) => pattern === newBuffer
  );
  if (perfectMatch) {
    advanceUnit(perfectMatch); // (★)「次」のユニットへ！
    return;
  }

  // 2. (★) 「前方一致」？
  const partialMatch = currentPatterns.value.find((pattern) =>
    pattern.startsWith(newBuffer)
  );
  if (partialMatch) {
    // (★) (★) (★)
    // お兄ちゃんの「もう一声」 を、ここで「魔法」にするよ！
    // (★) (★) (★)
    handlePartialMatch(partialMatch, newBuffer);
    return;
  }

  // 3. (★) 「ん」の特別ルール（v8 と同じ！）
  if (currentUnit.value.hiragana === "ん" && inputBuffer.value === "n") {
    const nextUnit = parsedProblem.value[unitIndex.value + 1];
    const nextFirstChar = nextUnit ? nextUnit.patterns[0][0] : null;
    if (
      nextFirstChar &&
      !["a", "i", "u", "e", "o", "n", "y"].includes(nextFirstChar)
    ) {
      advanceUnit("n");
      handleKeydown(e);
      return;
    }
  }
  console.log("ミスタイプ！");
};

/**
 * (★) 「前方一致」 の「途中」の時の「魔法」
 * @param {string} partialPattern - 新しく「採用」されたローマ字 (例: "xtu")
 * @param {string} newBuffer - 「今」のバッファ (例: "x")
 */
const handlePartialMatch = (partialPattern, newBuffer) => {
  // 1. (★) お手本 が違うパターン だったら「差し替える」！
  if (activePatterns.value[unitIndex.value] !== partialPattern) {
    activePatterns.value[unitIndex.value] = partialPattern;
  }
  // 2. (★) バッファ を更新
  inputBuffer.value = newBuffer;

  // 3. (★) 「色」 を更新！
  updateHighlightingLength(); // (★) 魔法を呼ぶ！
};

/**
 * (★) 判定を「クリア」して「次」の「ユニット」に進む「魔法」
 * @param {string} matchedPattern - 成立したローマ字 (例: "shi", "xtu")
 */
const advanceUnit = (matchedPattern) => {
  // 1. (★)「答え」配列を「確定」させる
  activePatterns.value[unitIndex.value] = matchedPattern;

  // 2. (★) バッファ を「カラ」にして「次」のユニットへ！
  inputBuffer.value = "";
  unitIndex.value++;

  // 3. (★)「色」 を更新！
  updateHighlightingLength(); // (★) 魔法を呼ぶ！
};

/**
 * (★) (★) (★)
 * 「色を変える」「長さ」を「再計算」する「魔法」！
 * (★) (★) (★)
 */
const updateHighlightingLength = () => {
  let newLength = 0;

  // 1. (★)「ぜんぶ『完成』した」ユニットの「長さ」を足す
  for (let i = 0; i < unitIndex.value; i++) {
    newLength += activePatterns.value[i].length;
  }

  // 2. (★)「今、打ってる『途中』」のバッファ の「長さ」を足す
  newLength += inputBuffer.value.length;

  // 3. (★)「色変わり」 の「長さ」を、ぜんぶ「更新」！
  typedRomajiLength.value = newLength;
};

// --- 5. 「ライフサイクル」 (自動で動く魔法) ---
onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);

  if (!targetProblem.value) return;
  try {
    const response = await api.post("/api/convert-ruby", {
      texts: [targetProblem.value.problem_text],
    });
    const result = response.data.results[0];

    targetHiragana.value = result.hiragana;

    // (★) 「v10エンジン」 の「起動」！
    const { parsedUnits, defaultActivePatterns } = parseHiragana(
      result.hiragana
    );

    parsedProblem.value = parsedUnits;
    activePatterns.value = defaultActivePatterns; // (★)「デフォルトのお手本」 配列をセット！

    typedRomajiLength.value = 0; // (★)「色変わり」 の「初期状態」は 0 ！
  } catch (error) {
    /* ... */
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown); // お片付け♡
});
</script>

<style lang="scss" scoped>
.typing-core {
  border: 2px dashed #ccc;
  padding: 1.5rem;
  font-family: "Courier New", Courier, monospace;

  &__problem {
    h2 {
      font-size: 2rem;
      font-weight: bold;
      margin: 0;
      color: #333;
    }
  }

  &__hiragana {
    p {
      font-size: 1.25rem;
      color: #555;
      margin: 0.5rem 0;
    }
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