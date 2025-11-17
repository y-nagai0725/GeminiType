<template>
  <div class="test-view">
    <h1 class="test-view__title">TypingCore (v11) 連続＆計測テスト</h1>

    <TypingCore
      v-if="dummyProblems.length > 0"
      :problems="dummyProblems"
      :showDebug="true"
      @complete="handleComplete"
    />

    <p v-else>読み込み中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import TypingCore from "../components/TypingCore.vue";

const dummyProblems = ref([]);

// (★) 結果を受け取る「魔法」
const handleComplete = (results) => {
  console.log("🎉 全問終了！結果が届いたよ！", results);
  //alert("全問終了！コンソールを見てね♡");
};

onMounted(() => {
  // (★) テスト用に「複数」の問題を用意！
  setTimeout(() => {
    dummyProblems.value = [
      { problem_text: "テスト" },
      { problem_text: "札幌市" },
      { problem_text: "プログラミング" },
    ];
  }, 1000);
});
</script>

<style lang="scss" scoped>
.test-view {
  width: 100%;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: sans-serif;
  border: 4px solid #28a745; /* v11だから緑枠にしとくね♡ */

  &__title {
    color: #28a745;
    margin-bottom: 1rem;
  }
}
</style>