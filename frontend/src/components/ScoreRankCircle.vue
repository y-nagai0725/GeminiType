<template>
  <div class="score-rank-circle">
    <div class="score-rank-circle__svg-wrapper">
      <svg class="score-rank-circle__svg" viewBox="0 0 100 100">
        <circle
          class="score-rank-circle__background"
          stroke-width="10"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          class="score-rank-circle__progress"
          :class="scoreRankClass"
          stroke-width="10"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="progressCircleDashoffset"
        />
      </svg>
    </div>
    <div class="score-rank-circle__text-wrapper">
      <span class="score-rank-circle__rank" :class="scoreRankClass">{{
        rank
      }}</span>
      <span class="score-rank-circle__title">Rank</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import gsap from "gsap";

const props = defineProps({
  // 親から受け取るスコア値
  score: {
    type: [Number, String],
    required: true,
  },
  // trueにすると、コンポーネントが表示された瞬間に自動でアニメーションする（結果画面用）
  autoPlay: {
    type: Boolean,
    default: false,
  },
});

// =========================================================================
// 定数・計算ロジック
// =========================================================================
const MAX_SCORE = 350;
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// アニメーションで変化する値 (GSAPで操作)
const progressCircleDashoffset = ref(CIRCUMFERENCE);

const scoreRankClass = ref("rank-none");
const rank = ref("-");

// スコアの最終的な割合 (0〜100%)
const scorePercent = computed(() => {
  if (!props.score || props.score === "-") return 0;
  return Math.round((props.score / MAX_SCORE) * 100);
});

// 最終的な描画位置 (Dashoffset)
const resultDashoffset = computed(() => {
  const validPercent = Math.min(100, Math.max(0, scorePercent.value));
  return CIRCUMFERENCE - (validPercent / 100) * CIRCUMFERENCE;
});

// =========================================================================
// アニメーション連動処理
// =========================================================================

/**
 * プログレスバーのアニメーション中の値を監視して、
 * リアルタイムにランクテキストと色（クラス）を変化させる！
 */
watch(progressCircleDashoffset, (newValue) => {
  // 現在の描画位置から、今何%までアニメーションが進んでいるかを逆算する
  const currentPercent = Math.max(0, (1 - newValue / CIRCUMFERENCE) * 100);

  if (currentPercent === 0) {
    scoreRankClass.value = "rank-none";
    rank.value = "-";
    return;
  }

  // 進行度合いに応じてランクをリアルタイム更新！
  if (currentPercent >= 95) {
    scoreRankClass.value = "rank-s";
    rank.value = "S";
  } else if (currentPercent >= 75) {
    scoreRankClass.value = "rank-a";
    rank.value = "A";
  } else if (currentPercent >= 60) {
    scoreRankClass.value = "rank-b";
    rank.value = "B";
  } else {
    scoreRankClass.value = "rank-c";
    rank.value = "C";
  }
});

// =========================================================================
// アニメーション制御
// =========================================================================

/**
 * 外部（親コンポーネント）から自由に呼び出せるアニメーション発火関数！
 */
const playAnimation = () => {
  // 常に初期位置（0%）から目標値へアニメーションさせる
  gsap.fromTo(
    progressCircleDashoffset,
    { value: CIRCUMFERENCE },
    { value: resultDashoffset.value, duration: 1.5, ease: "power3.out" }
  );
};

// defineExposeを使うと、親コンポーネントから playAnimation() を直接叩ける
defineExpose({
  playAnimation,
});

// マウント時に autoPlay が true なら自動実行
onMounted(() => {
  if (props.autoPlay) {
    playAnimation();
  }
});
</script>

<style lang="scss" scoped>
.score-rank-circle {
  @include fluid-style(width, 90, 108);
  @include fluid-style(height, 90, 108);

  position: relative;
  display: grid;
  place-content: center;

  &__svg-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  &__svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__background {
    stroke: $light-green;
  }

  &__progress {
    stroke-linecap: round;
    transition: stroke $transition-base;

    &.rank-c {
      stroke: $blue;
    }

    &.rank-b {
      stroke: $green;
    }

    &.rank-a {
      stroke: $orange;
    }

    &.rank-s {
      stroke: $yellow;
    }
  }

  &__text-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__rank {
    @include fluid-text(40, 50);

    font-family: $roboto-mono;
    font-weight: $bold;
    line-height: 1;
    transition: color $transition-base;

    &.rank-s {
      color: $yellow;
    }

    &.rank-a {
      color: $orange;
    }

    &.rank-b {
      color: $green;
    }

    &.rank-c {
      color: $blue;
    }

    &.rank-none {
      color: $light-black;
    }
  }

  &__title {
    @include fluid-text(13, 16);

    font-family: $roboto-mono;
    font-weight: $bold;
    line-height: 1;
    letter-spacing: 0.05em;
  }
}
</style>