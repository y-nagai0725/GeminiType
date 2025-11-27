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
      <div class="typing-core__mode-info" v-if="gameMode !== 'normal'">
        <span v-if="gameMode === 'time_limit'"
          >⏱️ 制限時間: {{ timeLimit }}秒</span
        >
        <span v-if="gameMode === 'sudden_death'">
          💀 ミス許容: {{ missLimit === 0 ? "即死！" : missLimit + "回" }}
        </span>
      </div>
    </div>

    <div v-else class="typing-core__playing">
      <div class="typing-core__hud" v-if="gameMode !== 'normal'">
        <div v-if="gameMode === 'time_limit'" class="hud-item hud-timer">
          <div class="timer-text" :class="{ danger: remainingTime <= 10 }">
            ⏱️ Time: {{ remainingTime }}s
          </div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill"
              :class="timeBarColorClass"
              :style="{ width: timeProgressPercentage + '%' }"
            ></div>
          </div>
        </div>
        <div
          v-if="gameMode === 'sudden_death'"
          :class="{ danger: remainingLives <= 1 }"
        >
          ❤️ Lives: {{ remainingLives }}
        </div>
      </div>

      <div class="typing-core__progress">
        Problem: {{ currentProblemIndex + 1 }} / {{ problems.length }}
      </div>

      <div class="typing-core__problem">
        <h2 v-if="targetProblem">{{ targetProblem.problem_text }}</h2>
      </div>

      <div class="typing-core__hiragana">
        <template v-if="parsedProblem.length > 0">
          <span
            v-for="(unit, index) in parsedProblem"
            :key="index"
            class="hiragana-char"
            :class="{ 'hiragana-typed': index < unitIndex }"
          >
            {{ unit.hiragana }}
          </span>
        </template>
        <p v-else-if="targetHiragana">{{ targetHiragana }}</p>
      </div>

      <div
        class="typing-core__romaji"
        :class="{ 'romaji-hidden': !shouldShowRomaji }"
      >
        <span class="typing-core__romaji--typed">
          {{ typedDisplayRomaji }}
        </span>
        <span class="typing-core__romaji--remaining">
          {{ remainingDisplayRomaji }}
        </span>
      </div>

      <div class="typing-core__stats-container">
        <div class="typing-core__stat-row">
          <span class="stat-label">Current:</span>
          <span class="stat-value">KPM: {{ currentKpm }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-value">Acc: {{ currentAccuracy }}%</span>
        </div>

        <div class="typing-core__stat-row typing-core__stat-row--total">
          <span class="stat-label">Total:</span>
          <span class="stat-value">KPM: {{ sessionAverageKpm }}</span>
          <span class="stat-divider">|</span>
          <span class="stat-value">Acc: {{ sessionAverageAccuracy }}%</span>
        </div>
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
 * Props定義
 */
const props = defineProps({
  // 問題配列
  problems: { type: Array, required: true },
  // デバッグ表示
  showDebug: { type: Boolean, default: false },
  // ゲームモード ('normal', 'time_limit', 'sudden_death')
  gameMode: { type: String, default: "normal" },
  // 制限時間 (秒)
  timeLimit: { type: Number, default: 60 },
  // ミス許容回数
  missLimit: { type: Number, default: 0 },
  // ローマ字ガイド表示
  showRomaji: { type: Boolean, default: true },
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
 * スタートしたかどうか (待機画面用)
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

/**
 * 今の問題でミスをしたかどうか
 */
const hasMissedInCurrentProblem = ref(false);

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

/**
 * 残り時間
 */
const remainingTime = ref(props.timeLimit);

/**
 * セッション通算ミス数
 */
const totalMissCountSession = ref(0);

/**
 * タイマーID
 */
let timerInterval = null;

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

// 残りライフ (Sudden Death用)
const remainingLives = computed(() => {
  if (props.gameMode !== "sudden_death") return null;
  // ミス許容回数 - 現在のミス数 (0未満にはしない)
  return Math.max(0, props.missLimit - totalMissCountSession.value);
});

/**
 * 残り時間の割合 (%)
 */
const timeProgressPercentage = computed(() => {
  if (props.gameMode !== "time_limit") return 0;
  return (remainingTime.value / props.timeLimit) * 100;
});

/**
 * プログレスバーの色クラス
 */
const timeBarColorClass = computed(() => {
  const p = timeProgressPercentage.value;
  if (p <= 25) return "bar-red"; // 25%以下なら赤
  if (p <= 50) return "bar-yellow"; // 50%以下なら黄色
  return "bar-green"; // それ以外は緑
});

/**
 * 通算の平均KPM (リアルタイム)
 */
const sessionAverageKpm = computed(() => {
  // 過去問のデータ集計
  let totalCorrect = 0;
  let totalTimeMs = 0;

  sessionResults.value.forEach((res) => {
    totalCorrect += res.correct_key_count;
    totalTimeMs += res.duration_ms;
  });

  // 今プレイ中のデータも足す
  if (problemStartTime.value > 0) {
    totalCorrect += correctKeyCount.value;
    totalTimeMs += Date.now() - problemStartTime.value; // 今の経過時間
  }

  // 計算 (時間が0なら0を返す)
  if (totalTimeMs === 0) return 0;

  const totalMin = totalTimeMs / 1000 / 60;
  return Math.round(totalCorrect / totalMin);
});

/**
 * 通算の平均正確率 (リアルタイム)
 */
const sessionAverageAccuracy = computed(() => {
  let totalCorrect = 0;
  let totalMiss = 0;

  // 過去問題集計
  sessionResults.value.forEach((res) => {
    totalCorrect += res.correct_key_count;
    totalMiss += res.miss_key_count;
  });

  // 今の問題の分
  totalCorrect += correctKeyCount.value;
  totalMiss += missKeyCount.value;

  const total = totalCorrect + totalMiss;
  if (total === 0) return 100;

  return Math.round((totalCorrect / total) * 100);
});

/**
 * ローマ字ガイドを表示すべきかどうか？
 */
const shouldShowRomaji = computed(() => {
  // 設定が「常に表示(true)」なら無条件で表示
  if (props.showRomaji) return true;

  // 設定が「隠す(false)」なら、ミスしたかどうかで決める
  return hasMissedInCurrentProblem.value;
});

/**
 * 次に入力すべきキー
 * (現在のパターンと入力済みバッファから特定)
 */
const nextExpectedKey = computed(() => {
  // 現在の入力対象パターン (例: "ka")
  const currentPattern = activePatterns.value[unitIndex.value];

  // パターンがない、または完了している場合は null
  if (!currentPattern) return null;

  // バッファの長さ = 次の文字のインデックス
  // 例: pattern="ka", buffer="k" (len=1) -> "a" (index 1) が次のキー
  if (inputBuffer.value.length < currentPattern.length) {
    return currentPattern[inputBuffer.value.length];
  }

  return null;
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
 * ゲームスタート処理
 */
const startGame = () => {
  isStarted.value = true;

  // 時間制限モードならタイマー始動！
  if (props.gameMode === "time_limit") {
    remainingTime.value = props.timeLimit;
    startTimer();
  }
};

/**
 * タイマー処理
 */
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    remainingTime.value--;
    // 時間切れチェック
    if (remainingTime.value <= 0) {
      forceFinishGame("Time Up!");
    }
  }, 1000);
};

/**
 * 強制終了処理 (ゲームオーバー時)
 */
const forceFinishGame = (reason) => {
  if (timerInterval) clearInterval(timerInterval);

  // プレイ中なら、今の問題の結果も（途中だけど）配列に追加する
  if (!isCompleted.value) {
    sessionResults.value.push({
      problem_text: targetProblem.value.problem_text + ` (${reason})`,
      kpm: currentKpm.value,
      accuracy: currentAccuracy.value,
      missed_keys: { ...currentMissedKeys.value },
      miss_count: missKeyCount.value,
      romaji_text: displayRomaji.value,
      correct_key_count: correctKeyCount.value,
      miss_key_count: missKeyCount.value,
    });
  }

  isCompleted.value = true;
  notificationStore.addNotification(`Game Over... ${reason}`, "error");
  emit("complete", sessionResults.value);
};

/**
 * 問題文のひらがなを分割する
 * @param {String} hiragana 問題文のひらがな
 */
const parseHiragana = (hiragana) => {
  try {
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
  } catch (error) {
    console.error("Critical Parsing Error:", error);

    // ユーザーへの通知
    notificationStore.addNotification(
      `問題データの生成に失敗しました（未対応の文字が含まれています）。メニューに戻ります。`,
      "error"
    );

    // メニュー画面へ強制遷移
    router.push("/menu");

    // 空配列を返して終わらせる
    return [];
  }
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

  // セッション通算ミスをカウント
  totalMissCountSession.value++;

  // ミスしたので、ローマ字ガイドを表示させる
  hasMissedInCurrentProblem.value = true;

  // 「本来打つべきキー」を集計
  const expected = nextExpectedKey.value;
  if (expected) {
    if (!currentMissedKeys.value[expected]) {
      currentMissedKeys.value[expected] = 0;
    }
    currentMissedKeys.value[expected]++;
  }

  // Sudden Death判定
  if (props.gameMode === "sudden_death") {
    // ミス許容回数を超えたらアウト
    if (totalMissCountSession.value > props.missLimit) {
      forceFinishGame("Miss Limit Exceeded!");
      return;
    }
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
  // 今の問題にかかった時間 (ミリ秒) を計算
  const durationMs = Date.now() - problemStartTime.value;

  const result = {
    problem_text: targetProblem.value.problem_text,
    kpm: currentKpm.value,
    accuracy: currentAccuracy.value,
    missed_keys: { ...currentMissedKeys.value },
    miss_count: missKeyCount.value,
    romaji_text: displayRomaji.value,
    correct_key_count: correctKeyCount.value,
    miss_key_count: missKeyCount.value,
    duration_ms: durationMs,
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
    // タイマー停止
    if (timerInterval) clearInterval(timerInterval);

    // 全問終了
    isCompleted.value = true;
    emit("complete", sessionResults.value);
  }
};

/**
 * 現在の問題のセットアップ（初期化）
 */
const setupCurrentProblem = () => {
  hasMissedInCurrentProblem.value = false;
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

  // タイマーのお片付け
  if (timerInterval) clearInterval(timerInterval);
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

  /* 待機画面のモード情報 */
  &__mode-info {
    margin-top: 1.5rem;
    font-size: 1.1rem;
    font-weight: bold;
    color: #dc3545;
    background: #fff0f0;
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    border: 1px solid #ffcccc;
  }

  &__progress {
    font-size: 0.9rem;
    color: #888;
    margin-bottom: 1rem;
  }

  &__stats-container {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  &__stat-row {
    font-size: 1.2rem;
    font-weight: bold;
    color: #007bff; /* Currentは青 */
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .stat-label {
      font-size: 0.9rem;
      color: #999;
      text-transform: uppercase;
      margin-right: 0.5rem;
      min-width: 60px; /* 位置を揃える */
      text-align: right;
    }

    .stat-divider {
      color: #ddd;
      margin: 0 0.5rem;
    }

    /* Total行のスタイル */
    &--total {
      color: #28a745; /* Totalは緑！ */
      font-size: 1.1rem; /* ちょっとだけ小さく */

      .stat-label {
        color: #aaa;
      }
    }
  }

  &__problem h2 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #333;
  }

  &__hiragana {
    font-size: 1.2rem;
    color: #666; /* まだ打ってない文字の色 */
    margin: 0.5rem 0;
    min-height: 1.5rem; /* 高さ確保 */

    .hiragana-char {
      display: inline-block; /* これがあると変な隙間ができにくい */
      transition: color 0.1s; /* 色が変わる瞬間をちょっと滑らかに */
    }

    .hiragana-typed {
      color: #007bff; /* 青色（ローマ字とお揃い！） */
      font-weight: bold; /* ちょっと強調してもいいかも？ */
    }
  }

  &__romaji {
    font-size: 1.75rem;
    letter-spacing: 2px;
    background-color: #f9f9f9;
    padding: 0.5rem;
    border-radius: 4px;
    min-height: 1.75rem;
    margin-top: 1rem;
    transition: opacity 0.2s, visibility 0.2s;
    opacity: 1;
    visibility: visible;

    /* 隠す時のクラス */
    &.romaji-hidden {
      opacity: 0;
      visibility: hidden; /* 場所は確保したまま見えなくする */
    }

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

  /* HUD (Head-Up Display) のスタイル */
  &__hud {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1.5rem; /* バーが入る分、少し広げる */
    color: #333;
    width: 100%; /* 幅を確保 */
    max-width: 600px; /* 広がりすぎないように */
    margin-left: auto;
    margin-right: auto;

    .hud-item {
      font-size: 1.5rem;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .hud-timer {
      width: 100%; /* バーのために幅を広げる */
      max-width: 400px;
    }

    .danger {
      color: #dc3545;
      animation: pulse 1s infinite;
    }

    /* ★追加: プログレスバーの背景 */
    .progress-bar-bg {
      width: 100%;
      height: 10px;
      background-color: #e9ecef;
      border-radius: 5px;
      margin-top: 5px;
      overflow: hidden; /* 角丸からはみ出ないように */
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* ★追加: プログレスバーの中身 */
    .progress-bar-fill {
      height: 100%;
      border-radius: 5px;
      /* ★ここがポイント！幅の変化を1秒かけて滑らかにする */
      transition: width 1s linear, background-color 0.3s ease;
    }

    /* ★追加: 色の定義 */
    .bar-green {
      background-color: #28a745;
      box-shadow: 0 0 5px rgba(40, 167, 69, 0.5);
    }
    .bar-yellow {
      background-color: #ffc107;
      box-shadow: 0 0 5px rgba(255, 193, 7, 0.5);
    }
    .bar-red {
      background-color: #dc3545;
      box-shadow: 0 0 5px rgba(220, 53, 69, 0.5);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>