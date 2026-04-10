<template>
  <div class="pagination-wrapper" v-if="totalPages > 1">
    <div class="pagination">
      <button
        class="page-button is-prev"
        :class="{ 'is-disabled': currentPage === 1 }"
        @click="onPageChange(currentPage - 1)"
        :disabled="currentPage === 1"
      ></button>

      <template v-for="(item, index) in paginationItems">
        <button
          v-if="item !== '...'"
          :key="`num-${index}`"
          class="page-button"
          :class="{ 'is-active': item === currentPage }"
          @click="onPageChange(item)"
        >
          {{ item }}
        </button>
        <span v-else :key="`dots-${index}`" class="page-dots">…</span>
      </template>

      <button
        class="page-button is-next"
        :class="{ 'is-disabled': currentPage === totalPages }"
        @click="onPageChange(currentPage + 1)"
        :disabled="currentPage === totalPages"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

// 親コンポーネントから受け取るデータ
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

// 親コンポーネントに送るイベント
const emit = defineEmits(["page-change"]);

// =========================================================================
// 計算ロジック
// =========================================================================

/**
 * ページネーションの配列を計算 (例: [1, 2, 3, "...", 10])
 */
const paginationItems = computed(() => {
  const current = props.currentPage;
  const total = props.totalPages;

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sortedPages = Array.from(pages)
    .filter((page) => page > 0 && page <= total)
    .sort((a, b) => a - b);

  const result = [];
  for (let i = 0; i < sortedPages.length; i++) {
    const page = sortedPages[i];
    if (i > 0) {
      const prevPage = sortedPages[i - 1];
      if (page - prevPage > 1) {
        if (page - prevPage === 2) {
          result.push(prevPage + 1);
        } else {
          result.push("...");
        }
      }
    }
    result.push(page);
  }
  return result;
});

// =========================================================================
// アクション
// =========================================================================

/**
 * ページ変更ボタンが押された時の処理
 */
const onPageChange = (page) => {
  // 無効なクリック（「...」や現在のページなど）はガードする
  if (
    page === "..." ||
    page === props.currentPage ||
    page < 1 ||
    page > props.totalPages
  )
    return;

  // 親コンポーネントに「このページ番号を取得してね！」と通知する
  emit("page-change", page);
};
</script>

<style lang="scss" scoped>
/* =========================================================================
 * ページネーション コンポーネントスタイル
 * ========================================================================= */

.pagination-wrapper {
  display: flex;
  justify-content: center;
}

.pagination {
  @include fluid-style(gap, 10, 16);

  display: flex;
  align-items: center;
}

/* --- 各ボタンのベーススタイル --- */
.page-button {
  @include fluid-style(width, 32, 40);
  @include fluid-style(height, 32, 40);
  @include fluid-text(12, 14);

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: $roboto-mono;
  cursor: pointer;
  background-color: transparent;
  border: 1px solid $light-black;
  border-radius: $radius-sm;
  transition: background-color $transition-base, color $transition-base,
    border-color $transition-base;

  /* ホバー時 */
  @include hover {
    background-color: $light-green;
  }

  /* 現在のページ（アクティブ） */
  &.is-active {
    color: $white;
    pointer-events: none;
    cursor: default;
    background-color: $green;
    border-color: $green;
  }

  /* 無効化状態（1ページ目の「前へ」など） */
  &.is-disabled {
    color: $light-black;
    cursor: not-allowed;
    background-color: $gray;
    border-color: $gray;
  }
}

/* --- 前へ / 次へ ボタンの矢印アイコン（CSSで描画） --- */
.is-prev::before,
.is-next::before {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20%;
  height: 20%;
  content: "";
  border-top: 2px solid currentcolor;
  border-right: 2px solid currentcolor;
}

.is-prev::before {
  transform: translate(-30%, -50%) rotate(-135deg);
}

.is-next::before {
  transform: translate(-70%, -50%) rotate(45deg);
}

/* --- 省略記号（...） --- */
.page-dots {
  @include fluid-text(12, 14);

  font-family: $roboto-mono;
  color: $light-black;
}
</style>