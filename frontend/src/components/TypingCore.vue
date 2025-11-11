<template>
  <div class="typing-core">
    <div class="typing-core__problem">
      <h2 v-if="targetProblem">{{ targetProblem.problem_text }}</h2>
      <p v-else>問題文を読み込み中…</p>
    </div>

    <div class="typing-core__hiragana">
      <p v-if="targetHiragana">{{ targetHiragana }}</p>
      <p v-else>（ひらがなを変換中…）</p>
    </div>

    <div class="typing-core__romaji">
      <span class="typing-core__romaji--typed">
        {{ typedDisplayRomaji }}
      </span>
      <span class="typing-core__romaji--remaining">
        {{ remainingDisplayRomaji }}
      </span>
    </div>

    <div class="typing-core__debug">
      <p>
        ひらがなIndex: {{ currentIndex }} (「{{
          targetHiragana[currentIndex]
        }}」を判定中)
      </p>
      <p>入力バッファ: [ {{ inputBuffer }} ]</p>
      <p>お手本ローマ字: {{ displayRomaji }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import api from "../services/api";

// (★) (★) (★)
// お兄ちゃんの「ひらめき」 の「核（コア）」！「ローマ字マップ」！
// (★) (★) (★)
const romaMap = {
  さ: ["sa"],
  し: ["si", "shi", "ci"],
  す: ["su"],
  せ: ["se"],
  そ: ["so"],
  た: ["ta"],
  ち: ["ti", "chi"],
  つ: ["tu", "tsu"],
  て: ["te"],
  と: ["to"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["fu", "hu"],
  へ: ["he"],
  ほ: ["ho"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo"],
  ん: ["n", "nn", "n'"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  ざ: ["za"],
  じ: ["zi", "ji"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  だ: ["da"],
  ぢ: ["di"],
  づ: ["du"],
  で: ["de"],
  ど: ["do"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  あ: ["a"],
  い: ["i"],
  う: ["u"],
  え: ["e"],
  お: ["o"],
  か: ["ka", "ca"],
  き: ["ki"],
  く: ["ku", "cu", "qu"],
  け: ["ke"],
  こ: ["ko", "co"],

  // (★) 拗音（ちいさい「ゃ」とか）
  きゃ: ["kya"],
  きゅ: ["kyu"],
  きょ: ["kyo"],
  しゃ: ["sya", "sha"],
  しゅ: ["syu", "shu"],
  しょ: ["syo", "sho"],
  ちゃ: ["tya", "cha"],
  ちゅ: ["tyu", "chu"],
  ちょ: ["tyo", "cho"],
  にゃ: ["nya"],
  にゅ: ["nyu"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひゅ: ["hyu"],
  ひょ: ["hyo"],
  みゃ: ["mya"],
  みゅ: ["myu"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りゅ: ["ryu"],
  りょ: ["ryo"],
  ぎゃ: ["gya"],
  ぎゅ: ["gyu"],
  ぎょ: ["gyo"],
  じゃ: ["ja", "zya"],
  じゅ: ["ju", "zyu"],
  じょ: ["jo", "zyo"],
  ぢゃ: ["dya"],
  ぢゅ: ["dyu"],
  ぢょ: ["dyo"],
  びゃ: ["bya"],
  びゅ: ["byu"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴゅ: ["pyu"],
  ぴょ: ["pyo"],

  // (★) 特殊（「っ」は、ルールが「別」だから、ここには「入れない」よ！）
  ぁ: ["la", "xa"],
  ぃ: ["li", "xi"],
  ぅ: ["lu", "xu"],
  ぇ: ["le", "xe"],
  ぉ: ["lo", "xo"],
  ゔ: ["vu"],
  ふぁ: ["fa"],
  ふぃ: ["fi"],
  ふぇ: ["fe"],
  ふぉ: ["fo"],

  // (★) 記号（仮）
  ー: ["-"],
  "、": [","],
  "。": ["."],
};

// (★) 「っ」の「特別ルール」！
const tsuSpecialPatterns = ["xtu", "ltu", "xtsu", "ltsu"];

// --- 1. 「外」から受け取る「お仕事リスト」 ---
const props = defineProps({
  problems: { type: Array, required: true },
});

// --- 2. 「宝箱」たち (State) ---
const targetProblem = computed(() => props.problems[0] || null);

// (★) 「エンジン」 の「状態（ステータス）」
const targetHiragana = ref(""); // 答えのひらがな (例: "さっぽろし")
const displayRomaji = ref(""); // お手本ローマ字 (例: "sapporosi")
const currentIndex = ref(0); // 今、ひらがな の何文字目？
const inputBuffer = ref(""); // 今、入力途中のローマ字 (例: "s", "sh")

// (★) 「見た目」のための「計算結果」
const typedDisplayRomaji = ref(""); // お手本の「色が変わった」部分
const remainingDisplayRomaji = ref(""); // お手本の「まだ」の部分

// --- 3. 「魔法」たち (Functions) ---

/**
 * (★) (★) (★)
 * これが「v7作戦」 の「心臓部」！ `handleKeydown` ！
 * (★) (★) (★)
 */
const handleKeydown = (e) => {
  // 1. 「a」とか「b」みたいな「1文字」のキーと「記号」だけを拾うよ
  if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) {
    // (Shiftキーは「OK」にする（"S"とか"?"とか打つため）)
    if (e.key === "Shift") return;

    // (Backspace の処理は、いったん「後！」)
    if (e.key === "Backspace") return;

    // (その他の制御キーはぜんぶ「無視」！)
    if (e.key.length !== 1) return;
  }

  // (★) ブラウザの「/」キー（検索）とかが動かないようにする！
  e.preventDefault();

  // 2. 「今、判定してる『ひらがな』」を取得
  const currentHiragana = targetHiragana.value[currentIndex.value];
  if (!currentHiragana) {
    console.log("ぜんぶ打ち終わってるよ！♡");
    return; // ぜんぶ終わってたら、何もしない
  }

  // 3. 「入力バッファ」 に「今押したキー」を追加
  const newBuffer = inputBuffer.value + e.key.toLowerCase();

  // 4. (★) お兄ちゃんの「ひらめき」！「『っ』の特別ルール」 から先にチェック！
  if (currentHiragana === "っ") {
    // 4-A. 「xtu」 みたいな「特別パターン」？
    const specialMatch = tsuSpecialPatterns.find(
      (pattern) => pattern === newBuffer
    );
    if (specialMatch) {
      console.log("「っ」を(xtu) でクリア！");
      clearBufferAndAdvance(); // (↓ 「魔法」を下でまとめるよ！)
      return;
    }
    // 4-B. 「xtu」 の「途中」？
    const partialSpecialMatch = tsuSpecialPatterns.find((pattern) =>
      pattern.startsWith(newBuffer)
    );
    if (partialSpecialMatch) {
      console.log('「っ」の(xtu) の途中… (例: "xt")');
      inputBuffer.value = newBuffer; // 「xt」を「バッファ」 にためる
      return;
    }

    // 4-C. 「子音重ね」？
    const nextHiragana = targetHiragana.value[currentIndex.value + 1];
    if (nextHiragana && romaMap[nextHiragana]) {
      const nextConsonant = romaMap[nextHiragana][0][0]; // (例: "ぽ"('po')の'p')
      if (newBuffer === nextConsonant) {
        console.log(`「っ」を(子音重ね ${nextConsonant}) でクリア！`);
        // (★) 「っ」はクリアするけど、バッファ は「リセットしない」！
        advanceIndex(); // (↓ 「魔法」を下でまとめるよ！)
        inputBuffer.value = newBuffer; // 「p」のまま、次の「ぽ」の判定にいく
        return;
      }
    }
  } // (「っ」のチェックおわり)

  // 5. (★) 「普通のひらがな」 のチェック
  const patterns = romaMap[currentHiragana] || [];

  // 5-A. 「完全一致」？ (例: "si" や "shi")
  const perfectMatch = patterns.find((pattern) => pattern === newBuffer);
  if (perfectMatch) {
    console.log(`「${currentHiragana}」を(${perfectMatch})でクリア！`);
    clearBufferAndAdvance();
    return;
  }

  // 5-B. 「前方一致」？ (例: "s" や "sh")
  const partialMatch = patterns.find((pattern) =>
    pattern.startsWith(newBuffer)
  );
  if (partialMatch) {
    console.log(`「${currentHiragana}」の途中… (例: "s")`);
    inputBuffer.value = newBuffer; // 「バッファ」 にためる
    return;
  }

  // 6. (★) 「ぜんぶダメ」＝「入力ミス」！
  // (「っ」の子音重ね の「2文字目」の判定も、ここに来るよ)
  // (例: "ぽ"('po')の判定で、バッファ が "p" + "o" = "po" になる)
  if (currentHiragana !== "っ" && inputBuffer.value !== "") {
    // (★) バッファ がある状態（例: "p"）から、もう一回「5」の判定をしてみる！
    const retryPatterns = romaMap[currentHiragana] || [];
    const retryPerfectMatch = retryPatterns.find(
      (pattern) => pattern === newBuffer
    );
    if (retryPerfectMatch) {
      console.log(
        `(子音重ね後)「${currentHiragana}」を(${retryPerfectMatch})でクリア！`
      );
      clearBufferAndAdvance();
      return;
    }
    const retryPartialMatch = retryPatterns.find((pattern) =>
      pattern.startsWith(newBuffer)
    );
    if (retryPartialMatch) {
      console.log(`(子音重ね後)「${currentHiragana}」の途中…`);
      inputBuffer.value = newBuffer;
      return;
    }
  }

  // (★) ここに来たら、ぜんぶ「ダメ」！
  console.log("ミスタイプ！");
  // (★) TODO: ミスした時の「音」を鳴らしたりする
};

/**
 * (★) 判定を「クリア」して「次」に進む「魔法」
 */
const clearBufferAndAdvance = () => {
  // (★) TODO: ここで「打ったローマ字」をお手本 に反映させる
  // (「動的差し替え」 は、いったん「後！」)
  // (まずは「色を変える」 ところから！)

  // (★) 色を変えるロジック（仮）
  // (Yahoo! がくれたお手本 の「頭」から、打った分だけ「色」をつける)
  const typedLength = typedDisplayRomaji.value.length;
  const currentPatternLength = inputBuffer.value.length || 1; // (子音重ね の時、inputBuffer が "p" になってる)
  const newTypedLength = typedLength + currentPatternLength; // (★) ちょっとロジック が甘いかも！

  // (★) TODO: 「お手本」の「動的差し替え」 をやらないと、
  // (「sapporosi」と「saxtu」の「文字数」が合わなくて、ここが「破綻（はたん）」するね！)

  // (★) いったん「v7作戦」 の「キモ」だけ！
  inputBuffer.value = ""; // バッファ を「カラ」に！
  currentIndex.value++; // 「次」のひらがな へ！
};
/**
 * (★) 「ひらがなIndex」だけを進める「魔法」（子音重ね用）
 */
const advanceIndex = () => {
  currentIndex.value++; // 「次」のひらがな へ！
};

// --- 4. 「ライフサイクル」 (自動で動く魔法) ---
onMounted(async () => {
  // 1. (★) `window` で「見張る」！
  window.addEventListener("keydown", handleKeydown);

  // 2. 「問題」があるかチェック！
  if (!targetProblem.value) return;

  // 3. (★) Backendの「スーパー翻訳機」を呼び出すよ！
  try {
    const response = await api.post("/api/convert-ruby", {
      texts: [targetProblem.value.problem_text],
    });

    const result = response.data.results[0]; // { hiragana, roman }

    // (★) 「答え（ひらがな）」をセット！
    targetHiragana.value = result.hiragana; // "さっぽろし"

    // (★) 「お手本（ローマ字）」の「初期状態」をセット！
    displayRomaji.value = result.roman; // "sapporosi"
    remainingDisplayRomaji.value = result.roman; // (★) 色変わり用
  } catch (error) {
    console.error("問題の読み込みに失敗しちゃった…", error);
    targetHiragana.value = "（エラー）";
  }
});

onUnmounted(() => {
  // 「見張り番」をちゃんと解除する（お片付け♡）
  window.removeEventListener("keydown", handleKeydown);
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