<template>
  <div class="not-found-view">
    <div class="not-found-view__content">
      <h1 class="not-found-view__title">404 Not Found</h1>
      <p class="not-found-view__message">
        おっと！お探しのページが見つかりません…💦<br />
        URLが間違っているか、削除された可能性があります。
      </p>

      <div class="not-found-view__actions">
        <RouterLink to="/menu" class="not-found-view__button">
          メインメニューに戻る
        </RouterLink>
        <RouterLink to="/" class="not-found-view__link">
          トップページへ
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* 画面の真ん中くらいに表示 */
  text-align: center;
  font-family: sans-serif;
  color: #333;

  &__content {
    max-width: 500px;
    padding: 2rem;
  }

  &__title {
    font-size: 3rem;
    font-weight: bold;
    color: #dc3545; /* 警告っぽい赤色 */
    margin-bottom: 1rem;
  }

  &__message {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #666;
    margin-bottom: 2rem;
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