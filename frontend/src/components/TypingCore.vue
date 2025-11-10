<template>
  <div class="typing-core" @click="focusInput">
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
        {{ typedRomaji }}
      </span>
      <span class="typing-core__romaji--remaining">
        {{ remainingRomaji }}
      </span>
    </div>

    <input
      type="text"
      class="typing-core__hidden-input"
      ref="typingInputRef"
      @input="handleWanakanaInput"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />

    <div class="typing-core__debug">
      <p>入力されたひらがな: {{ typedHiragana }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import * as wanakana from "wanakana"; // (★) wanakanaちゃんをぜんぶインポート！
import api from "../services/api";

// --- 1. 「外」から受け取る「お仕事リスト」 ---
const props = defineProps({
  problems: {
    // 問題文の『配列』
    type: Array,
    required: true,
  },
});

// --- 2. 「宝箱」たち (State) ---

// (★) 今やってる「問題」（配列の「0番目」だけ使うよ！）
const targetProblem = computed(() => props.problems[0] || null);

// (★) 「答え」になるひらがな (例: "さっぽろし")
const targetHiragana = ref("");

// (★) 「お手本ローマ字」 用の宝箱
const typedRomaji = ref(""); // (例: "sappo")
const remainingRomaji = ref(""); // (例: "rosi")

// (★) 「内部判定」用の宝箱
const typedHiragana = ref(""); // (例: "さっぽ")
const typingInputRef = ref(null); // 「透明な入力ボックス」の本体

// --- 3. 「魔法」たち (Functions) ---

/**
 * (★) wanakana ちゃんが「透明な入力ボックス」を監視するよ！
 */
const handleWanakanaInput = (e) => {
  const currentInputHiragana = e.target.value; // wanakanaが「ひらがな」に変換してくれる！

  // (★) 厳格モード（せいかくモード）！
  // 「答え」の「頭」と「違って」たら…
  if (!targetHiragana.value.startsWith(currentInputHiragana)) {
    // 強制的に「前回の正しいひらがな」に戻す！
    // (例: "さっぽ" の次に "a" (あ) って打っても、"さっぽ" に戻されちゃう♡)
    e.target.value = typedHiragana.value;
    return; // 何も進まない！
  }

  // (★) OK！正しい入力だったよ！
  typedHiragana.value = currentInputHiragana; // 「さっぽ」を「さっぽろ」に更新

  // (★) お手本ローマ字を「動的」に更新するよ！
  updateDisplayRomaji();
};

/**
 * (★) お手本ローマ字 を「更新」する魔法
 */
const updateDisplayRomaji = () => {
  // 1. 「今までに打った『ひらがな』」をローマ字に戻す
  //    (★) ここが「saxtu」とかの「変化」に対応するキモだよ！
  typedRomaji.value = wanakana.toRomaji(typedHiragana.value);

  // 2. 「これから打つ『ひらがな』」を計算する
  const remainingHiragana = targetHiragana.value.substring(
    typedHiragana.value.length
  );

  // 3. 「これから打つ『ローマ字』」（デフォルトのお手本）を計算する
  remainingRomaji.value = wanakana.toRomaji(remainingHiragana);
};

/**
 * (★) 画面をクリックしたら、透明な入力ボックスに「強制フォーカス」
 */
const focusInput = () => {
  if (typingInputRef.value) {
    typingInputRef.value.focus();
  }
};

// --- 4. 「ライフサイクル」 (自動で動く魔法) ---

onMounted(async () => {
  // 1. 「問題」があるかチェック！
  if (!targetProblem.value) return;

  // 2. (★) Backendの「スーパー翻訳機」を呼び出すよ！
  try {
    const response = await api.post("/api/convert-ruby", {
      texts: [targetProblem.value.problem_text], // (★)「配列」で送る
    });

    const result = response.data.results[0]; // { hiragana, roman }

    // 3. (★) 「答え（ひらがな）」をセット！
    targetHiragana.value = result.hiragana;

    // 4. (★) 「お手本（ローマ字）」の「初期状態」をセット！
    // (Yahoo! がくれた `roman` を「初期値」として使うよ！)
    remainingRomaji.value = result.roman;

    // 5. (★) wanakana ちゃんを「透明な入力ボックス」に「合体♡」！
    if (typingInputRef.value) {
      // (★) この「魔法」で、入力が「自動でひらがな」になるんだ！
      wanakana.bind(typingInputRef.value, { IMEMode: true });
      // (★) すぐにタイピングできるように「強制フォーカス」！
      typingInputRef.value.focus();
    }
  } catch (error) {
    console.error("問題の読み込みに失敗しちゃった…", error);
    targetHiragana.value = "（エラー）";
  }
});

// (★) この「部品」が「消える」時に、動くよ！
onUnmounted(() => {
  // 「合体♡」をちゃんと解除する（お片付け♡）
  if (typingInputRef.value) {
    wanakana.unbind(typingInputRef.value);
  }
});
</script>

<style lang="scss" scoped>
/* (BEM) ブロック: .typing-core */
.typing-core {
  border: 2px dashed #ccc;
  padding: 1.5rem;
  font-family: "Courier New", Courier, monospace;
  cursor: text; /* 「ここ、テキスト入力できるよ」っていう見た目にする */

  /* (BEM) エレメント: .typing-core__problem */
  &__problem {
    h2 {
      font-size: 2rem;
      font-weight: bold;
      margin: 0;
      color: #333;
    }
  }

  /* (BEM) エレメント: .typing-core__hiragana (★New!) */
  &__hiragana {
    p {
      font-size: 1.25rem;
      color: #555;
      margin: 0.5rem 0;
    }
  }

  /* (BEM) エレメント: .typing-core__romaji */
  &__romaji {
    font-size: 1.75rem;
    letter-spacing: 2px;
    background-color: #f9f9f9;
    padding: 0.5rem;
    border-radius: 4px;
    min-height: 1.75rem; /* ガタガタしないように */

    /* (BEM) モディファイア: --typed (★打ったところの色！) */
    &--typed {
      color: #007bff; // (仮の青色)
      font-weight: bold;
    }

    /* (BEM) モディファイア: --remaining (★これからのところの色) */
    &--remaining {
      color: #aaa;
    }
  }

  /* (BEM) エレメント: .typing-core__hidden-input (★透明ボックス！) */
  &__hidden-input {
    /* ぜったいに見えないようにする「おまじない」♡ */
    position: absolute;
    top: -9999px;
    left: -9999px;
    opacity: 0;
    width: 0;
    height: 0;
    border: none;
    padding: 0;
  }

  /* (BEM) エレメント: .typing-core__debug (★デバッグ用) */
  &__debug {
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #999;
  }
}
</style>