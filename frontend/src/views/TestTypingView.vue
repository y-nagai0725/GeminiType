<template>
  <div class="test-view">
    <h1 class="test-view__title">(★) TypingCore.vue 単体テスト「砂場」 (★)</h1>
    <p class="test-view__description">
      ここで「透明な入力ボックス」 がうまく動くか、
      「`saxtu`」みたいな判定がうまくいくか、
      心ゆくまでテストしてね、お兄ちゃん！♡
    </p>

    <TypingCore v-if="dummyProblem" :problems="[dummyProblem]" />
    <p v-else>
      ダミーの問題文を準備中… (5秒後に `TypingCore` が「生まれる」よ！)
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
// (★) 「心臓部（部品）」をインポート！
import TypingCore from "../components/TypingCore.vue";

// (★) 試し打ち 用の「ダミーの問題文」を「1個」用意するよ！
const dummyProblem = ref(null);

// (★) このページが「生まれた」時に動くよ
onMounted(() => {
  // (★) わざと「5秒」待ってから、問題文をセットするよ！
  // (これは、TypingCore.vue の onMounted が
  //  ちゃんと「あとから」動くかテストするためのおまじない♡)
  setTimeout(() => {
    dummyProblem.value = {
      // (★) お兄ちゃんがテストしたい「問題文」をここに書いてね！
      problem_text: "札幌市",
    };
  }, 5000); // 5秒
});
</script>

<style lang="scss" scoped>
.test-view {
  width: 100%;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;
  border: 4px solid #f44336; /* (★) 「テスト中！」ってわかるように赤い枠！ */

  &__title {
    color: #f44336;
  }

  &__description {
    background-color: #fdf;
    padding: 1rem;
    border-radius: 4px;
  }
}
</style>