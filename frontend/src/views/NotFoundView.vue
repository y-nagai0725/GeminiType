<template>
  <div class="not-found-view">
    <h1 class="not-found-view__title">
      <span class="en">NOT FOUND</span>
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
          >メインメニューに戻る<ArrowIcon class="not-found-view__arrow-icon"
        /></RouterLink>
        <RouterLink
          to="/"
          class="not-found-view__link-button not-found-view__link-button--top"
        >
          トップページに戻る<ArrowIcon class="not-found-view__arrow-icon" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import ArrowIcon from "@/components/icons/ArrowIcon.vue";
</script>

<style lang="scss" scoped>
.not-found-view {
  @include contents-width;

  @include pc {
    max-width: 1000px;
  }

  &__title {
    @include page-title;

    .en {
      color: $red;
    }
  }

  &__contents-wrapper {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
    @include contents-padding;
    max-width: 600px;
    margin-inline: auto;

    @include pc {
      max-width: none;
      margin-inline: 0;
    }
  }

  &__message {
    font-weight: $bold;
    @include fluid-text(12, 16);
    line-height: 2;
    text-align: center;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    @include fluid-style(gap, 24, 32);
  }

  &__link-button {
    @include fluid-style(width, 240, 350);
    @include fluid-style(padding-block, 17, 22);
    margin-inline: auto;
    @include fluid-text(14, 18);

    &--menu {
      @include button-style-fill($green);
    }

    &--top {
      @include button-style-fill($blue);
    }
  }

  &__arrow-icon {
    @include button-arrow-icon-style;
  }
}
</style>