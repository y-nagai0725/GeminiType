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
import { useRouter } from "vue-router";
import api from "../services/api";
import romaMapData from "@/data/romanTypingParseDictionary.json";
import { useNotificationStore } from "../stores/notificationStore";

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
 * props
 */
const props = defineProps({
  // 問題配列
  problems: { type: Array, required: true },

  // デバッグ部分の表示・非表示
  showDebug: {
    type: Boolean,
    default: false, // デフォルトは非表示
  },
});

/**
 * 問題文(日本語文章)
 */
const targetProblem = computed(() => props.problems[0] || null);

/**
 * 問題文のひらがな
 */
const targetHiragana = ref("");

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
 * 正解入力パターンのローマ字配列
 */
const activePatterns = ref([]);

/**
 * タイプ済みの文字数 (色を変える長さ)
 */
const typedRomajiLength = ref(0);

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
 * お手本ローマ字(全体)
 */
const displayRomaji = computed(() => activePatterns.value.join(""));

/**
 * お手本ローマ字の色が変わった部分
 */
const typedDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(0, typedRomajiLength.value);
});

/**
 * お手本ローマ字の未入力部分
 */
const remainingDisplayRomaji = computed(() => {
  return displayRomaji.value.substring(typedRomajiLength.value);
});

/**
 * 問題文のひらがなを分割する
 * @param {String} hiragana 問題文のひらがな
 */
const parseHiragana = (hiragana) => {
  // 分割ユニット{hiragana, patterns}の配列
  const units = [];

  // 見本ローマ字表示用のパターン配列
  const defaultPatterns = [];

  // ひらがなの位置
  let cursor = 0;

  // ひらがなの最後の文字まで処理を行う
  while (cursor < hiragana.length) {
    // romaMapに存在しているかどうか
    let matched = false;

    // 3文字、2文字、1文字といった順番で検索していく
    for (let len = 3; len >= 1; len--) {
      // 検索対象のひらがな
      const chunk = hiragana.substring(cursor, cursor + len);

      // romaMapに存在する場合
      if (romaMap.has(chunk)) {
        // 正解入力パターンを取得
        const patterns = romaMap.get(chunk);

        // ユニット配列に追加
        units.push({ hiragana: chunk, patterns: patterns });

        // 見本ローマ字配列に追加（入力パターンの1個目を追加する）
        defaultPatterns.push(patterns[0]);

        // 文字位置を進める
        cursor += len;

        // 検索結果をtrueに
        matched = true;

        // for文を抜ける
        break;
      }
    }

    // もし「1文字」でも romaMap に存在しない文字があった場合
    if (!matched) {
      const errorChar = hiragana[cursor];
      console.error(`辞書にない文字が！: ${errorChar}`);
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
 */
const handleKeydown = (e) => {
  // 制御キーは無視
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  // タイピング判定はしない、「ブラウザの動作（戻る）」は止める
  if (e.key === "Backspace" || e.key === "Shift") {
    e.preventDefault();
    return;
  }

  // 「1文字」のキーだけ判定を行う
  if (e.key.length !== 1) return;

  // キーのデフォルトの機能を止める
  e.preventDefault();

  // 全てのユニットの判定が終了している場合は何もしない
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
    console.error("TypingCoreの準備中にエラー:", error);

    //エラー通知を表示
    notificationStore.addNotification(
      error.message || "問題の読み込みに失敗しました…",
      "error"
    );

    // TODO 仮に「/（ホーム）」に戻す！）
    router.push("/");
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