<template>
  <div class="not-found-view">
    <h1 class="not-found-view__title">
      <span class="en">NOT FOUND</span>
      <span class="ja">ページが見つかりません</span>
    </h1>
    <div class="not-found-view__contents-wrapper">
      <p class="not-found-view__message">
        お探しのページが見つかりません<br />
        URLが間違っているか、削除された可能性があります。
      </p>

      <div class="not-found-view__actions">
        <RouterLink to="/menu" class="not-found-view__link-button not-found-view__link-button--menu"
        >メインメニューに戻る<ArrowIcon class="not-found-view__arrow-icon"
      /></RouterLink>
        <RouterLink to="/" class="not-found-view__link">
          トップページへ
        </RouterLink>
      </div>
    </div>
  </div>
</template>

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
    align-items: center;
    gap: 1rem;
  }

  &__button {
    display: inline-block;
    padding: 0.8rem 2rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    font-weight: bold;
    border-radius: 50px;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
      background-color: #0056b3;
    }
  }

  &__link {
    color: #666;
    text-decoration: none;
    font-size: 0.9rem;

    &:hover {
      text-decoration: underline;
      color: #007bff;
    }
  }
}
</style>