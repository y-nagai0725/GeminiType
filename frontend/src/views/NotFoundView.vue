<template>
  <div class="not-found-view">
    <h1 class="not-found-view__title">
      <span class="en" aria-hidden="true">NOT FOUND</span>
      <span class="ja">ページが見つかりません</span>
    </h1>

    <div class="not-found-view__contents-wrapper">
      <p class="not-found-view__message">
        お探しのページが見つかりません。<br />
        URLが間違っているか、削除された可能性があります。
      </p>

      <div class="not-found-view__actions">
        <RouterLink
          to="/menu"
          class="not-found-view__link-button not-found-view__link-button--menu"
        >
          メインメニューに戻る
          <ArrowIcon class="not-found-view__arrow-icon" aria-hidden="true" />
        </RouterLink>

        <RouterLink
          to="/"
          class="not-found-view__link-button not-found-view__link-button--top"
        >
          トップページに戻る
          <ArrowIcon class="not-found-view__arrow-icon" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { RouterLink } from "vue-router";
import ArrowIcon from "@/components/icons/ArrowIcon.vue";

</script>

<style lang="scss" scoped>
/* =========================================================================
 * NotFound 画面のスタイル
 * ========================================================================= */
.not-found-view {
  @include contents-width;

  @include pc {
    max-width: 100rem;
  }

  /* --- タイトル部分 --- */
  &__title {
    @include page-title;

    .en {
      /* エラー（見つからない）であることを直感的に伝えるための赤色 */
      color: $red;
    }
  }

  /* --- コンテンツラッパー --- */
  &__contents-wrapper {
    @include fluid-style(gap, 24, 32);
    @include contents-padding;

    display: flex;
    flex-direction: column;
    max-width: 60rem;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  /* --- メッセージテキスト --- */
  &__message {
    @include fluid-text(12, 16);

    font-weight: $bold;
    line-height: 2;
    text-align: center;
  }

  /* --- ボタン領域 --- */
  &__actions {
    @include fluid-style(gap, 24, 32);

    display: flex;
    flex-direction: column;
  }

  &__link-button {
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    @include fluid-text(14, 18);

    margin-inline: auto;

    /* メインメニューへ戻るボタン（優先度が高いプライマリーアクションなので塗りつぶし） */
    &--menu {
      @include button-style-fill($green);
    }

    /* トップページへ戻るボタン（優先度が低いセカンダリーアクションなので枠線） */
    &--top {
      @include button-style-border($blue);
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }
}
</style>