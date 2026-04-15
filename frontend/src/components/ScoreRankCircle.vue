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
    <div class="score-rank-circle__info">
      <svg
        class="score-rank-circle__info-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>

      <div class="score-rank-circle__tooltip">
        <p class="score-rank-circle__tooltip-title">スコア算出方法</p>
        <p class="score-rank-circle__tooltip-formula">KPM × (正確率 / 100)³</p>
        <ul class="score-rank-circle__tooltip-list">
          <li>
            <span class="rank-s">S</span> : {{ RANK_SCORE_THRESHOLDS.S }}〜
          </li>
          <li>
            <span class="rank-a">A</span> : {{ RANK_SCORE_THRESHOLDS.A }}〜
          </li>
          <li>
            <span class="rank-b">B</span> : {{ RANK_SCORE_THRESHOLDS.B }}〜
          </li>
          <li>
            <span class="rank-c">C</span> : 〜{{ RANK_SCORE_THRESHOLDS.B - 1 }}
          </li>
        </ul>
      </div>
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
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * スコア上限値
 */
const MAX_SCORE = 350;

/**
 * ランク判定用の割合閾値
 */
const RANK_PERCENTAGE_THRESHOLDS = {
  S: 0.95,
  A: 0.75,
  B: 0.6,
};

/**
 * ランク判定用のスコア閾値
 */
const RANK_SCORE_THRESHOLDS = {
  S: Math.round(MAX_SCORE * RANK_PERCENTAGE_THRESHOLDS.S),
  A: Math.round(MAX_SCORE * RANK_PERCENTAGE_THRESHOLDS.A),
  B: Math.round(MAX_SCORE * RANK_PERCENTAGE_THRESHOLDS.B),
};

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
  const currentPercent = Math.round(
    Math.max(0, (1 - newValue / CIRCUMFERENCE) * 100)
  );

  if (currentPercent === 0) {
    scoreRankClass.value = "rank-none";
    rank.value = "-";
    return;
  }

  // 進行度合いに応じてランクをリアルタイム更新
  if (currentPercent >= RANK_PERCENTAGE_THRESHOLDS.S * 100) {
    scoreRankClass.value = "rank-s";
    rank.value = "S";
  } else if (currentPercent >= RANK_PERCENTAGE_THRESHOLDS.A * 100) {
    scoreRankClass.value = "rank-a";
    rank.value = "A";
  } else if (currentPercent >= RANK_PERCENTAGE_THRESHOLDS.B * 100) {
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

  $parent: &;

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

  &__info {
    position: absolute;
    right: 9rem;
    bottom: -0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    aspect-ratio: 1;
    color: $light-black;
    cursor: help; // カーソルを「？」マークにする
    background-color: $white;
    border-radius: 50%;
    transition: color $transition-base, transform $transition-base;

    @include pc {
      right: -1.6rem;
    }

    &:hover {
      color: $green;
      transform: scale(1.1);

      /* ホバー時にツールチップを表示させる！ */
      #{$parent}__tooltip {
        visibility: visible;
        opacity: 1;
        transform: translate(-50%, 1rem);
      }
    }
  }

  &__info-icon {
    width: 1.8rem;
    aspect-ratio: 1;
  }

  &__tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    visibility: hidden;
    width: max-content;
    padding: 1.6rem;
    background-color: $black;
    border-radius: $radius-md;
    box-shadow: $modal-box-shadow;
    opacity: 0;
    transform: translate(-50%, 0.4rem);
    transition: opacity $transition-base, transform $transition-base,
      visibility $transition-base;

    /* 吹き出しの三角 */
    &::after {
      position: absolute;
      bottom: 100%;
      left: 50%;
      width: 1.6rem;
      height: 0.8rem;
      content: "";
      background-color: $black;
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      transform: translate(-50%, 1px);
    }
  }

  &__tooltip-title {
    margin-bottom: 0.4rem;
    font-size: 1.2rem;
    font-weight: $bold;
    color: $white;
  }

  &__tooltip-formula {
    margin-bottom: 1.6rem;
    font-family: $roboto-mono;
    font-size: 1.4rem;
    font-weight: $bold;
    color: $light-yellow;
    letter-spacing: 0.05em;
  }

  &__tooltip-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-family: $roboto-mono;
    font-size: 1.3rem;
    color: $white;

    li {
      display: flex;
      gap: 0.8rem;
      align-items: center;
    }

    /* ランクの文字色付け */
    span {
      display: inline-block;
      width: 1.8rem;
      font-weight: $bold;
      text-align: center;

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
    }
  }
}
</style>