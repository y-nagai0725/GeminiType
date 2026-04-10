<template>
  <div class="pagination__pagination-container" v-if="totalPages > 1">
    <div class="pagination__pagination">
      <button
        class="pagination__page-button pagination__page-button--prev"
        :class="{ 'is-disabled': currentPage === 1 }"
        @click="onPageChange(currentPage - 1)"
        :disabled="currentPage === 1"
      ></button>

      <template v-for="(item, index) in paginationItems">
        <button
          v-if="item !== '...'"
          :key="`num-${index}`"
          class="pagination__page-button pagination__page-button--number"
          :class="{ 'is-active': item === currentPage }"
          @click="onPageChange(item)"
        >
          {{ item }}
        </button>
        <span v-else :key="`dots-${index}`" class="pagination__page-dots"
          >…</span
        >
      </template>

      <button
        class="pagination__page-button pagination__page-button--next"
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

// 親コンポーネントに送るイベント（ページがクリックされたよ！という通知）
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
.pagination {
  @include pagination-style;
}
</style>