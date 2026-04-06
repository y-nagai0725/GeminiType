<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__top-box">
        <div class="footer__logo-box">
          <RouterLink to="/" class="footer__logo-link">
            <SiteLogoIcon class="footer__logo-icon" />
            <span class="footer__title">GeminiType</span>
          </RouterLink>
        </div>

        <nav class="footer__nav">
          <ul class="footer__list">
            <li class="footer__item">
              <RouterLink to="/" class="footer__link footer__link--roboto"
                >TOP</RouterLink
              >
            </li>
            <li class="footer__item">
              <RouterLink to="/menu" class="footer__link"
                >メインメニュー</RouterLink
              >
            </li>

            <template v-if="!authStore.isLoggedIn">
              <li class="footer__item">
                <RouterLink to="/login" class="footer__link"
                  >ログイン</RouterLink
                >
              </li>
              <li class="footer__item">
                <RouterLink to="/register" class="footer__link"
                  >ユーザー登録</RouterLink
                >
              </li>
            </template>

            <template v-else>
              <li class="footer__item">
                <RouterLink to="/mypage" class="footer__link"
                  >マイページ</RouterLink
                >
              </li>
              <li v-if="authStore.canAccessAdmin" class="footer__item">
                <RouterLink to="/admin" class="footer__link"
                  >管理画面</RouterLink
                >
              </li>
              <li class="footer__item">
                <a href="#" class="footer__link" @click.prevent="handleLogout"
                  >ログアウト</a
                >
              </li>
            </template>
          </ul>
        </nav>
      </div>
      <div class="footer__bottom-box">
        <ul class="footer__external-link-list">
          <li class="footer__external-link-item">
            <a
              href="https://portfolio.mikanbako.jp/"
              class="footer__external-link"
              target="_blank"
              >ポートフォリオ<ExternalLinkIcon
                class="footer__external-link-icon"
            /></a>
          </li>
          <li class="footer__external-link-item">
            <a
              href="https://github.com/y-nagai0725"
              class="footer__external-link footer__external-link--roboto"
              target="_blank"
              >GitHub<ExternalLinkIcon class="footer__external-link-icon"
            /></a>
          </li>
          <li class="footer__external-link-item">
            <a
              href="https://blog.mikanbako.jp/"
              class="footer__external-link"
              target="_blank"
              >技術ブログ<ExternalLinkIcon class="footer__external-link-icon"
            /></a>
          </li>
        </ul>
        <span class="footer__copyright"
          >&copy; 2026 GeminiType. All Rights Reserved.</span
        >
      </div>
    </div>
  </footer>
</template>

<script setup>
// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import SiteLogoIcon from "@/components/icons/SiteLogoIcon.vue";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon.vue";

// =========================================================================
// State (状態管理)
// =========================================================================

/**
 * router
 */
const router = useRouter();

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

// =========================================================================
// Actions (処理)
// =========================================================================

/**
 * ログアウト処理
 */
const handleLogout = () => {
  authStore.logout();
  notificationStore.addNotification("ログアウトしました", "success");

  // Note: 実際の画面遷移は、authStore.logout() 内、またはそこからトリガーされる
  // router側のフック（ナビゲーションガード）等で行われる想定です。
};
</script>

<style lang="scss" scoped>
.footer {
  @include fluid-style(padding-block, 48, 100);

  $parent: &;

  /* コンテンツが少なくても常に画面最下部に配置するための設定 */
  margin-top: auto;
  background-color: $green;

  &__inner {
    @include contents-width;

    /* セクション間の余白をカスタムプロパティで管理し、区切り線の計算にも流用する */
    @include fluid-style(--box-gap-size, 64, 128);

    display: flex;
    flex-direction: column;
    gap: var(--box-gap-size);
  }

  &__top-box {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3.2rem;
    align-items: center;

    /* セクション間の区切り線 */
    &::after {
      position: absolute;

      /* --box-gap-size の半分の位置に線を引くことで、常に中央に配置 */
      bottom: calc(var(--box-gap-size) / -2);
      left: 0;
      width: 100%;
      height: 1px;
      content: "";
      background-color: $white;
      transform: translateY(50%);
    }

    @include pc {
      flex-direction: row;
      gap: 0;
      align-items: flex-start;
    }
  }

  &__logo-box {
    @include pc {
      /* ナビゲーションとのバランスを取るための幅調整 */
      width: calc(100% / 3 * 2);
    }
  }

  &__logo-link {
    @include fluid-style(gap, 8, 24);

    display: inline-flex;
    align-items: center;
    padding: 1rem 0; /* クリック判定領域を広げるための余白 */
    color: $white;
    transition: color $transition-base;

    @include hover {
      color: $yellow;
    }
  }

  &__logo-icon {
    @include fluid-style(width, 32, 52);

    fill: currentcolor;
    stroke: currentcolor;
    transition: fill $transition-base, stroke $transition-base;
  }

  &__title {
    @include fluid-text(24, 40);

    font-family: $roboto-mono;
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__list {
    @include fluid-style(gap, 0, 4);

    display: flex;
    flex-direction: column;
    align-items: center;

    @include pc {
      align-items: flex-start;
    }
  }

  &__link {
    @include fluid-text(14, 18);

    display: block;
    padding: 1rem 0; /* クリック判定領域を広げるための余白 */
    font-weight: $bold;
    color: $white;
    letter-spacing: 0.1em;
    transition: color $transition-base;

    &--roboto {
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
    }

    @include hover {
      color: $yellow;
    }
  }

  &__bottom-box {
    @include fluid-style(gap, 32, 64);

    display: flex;
    flex-direction: column;
    align-items: center;

    @include pc {
      flex-direction: row;
      gap: 0;
      align-items: flex-end;
      justify-content: space-between;
    }
  }

  &__external-link-list {
    /* リンク間の余白をカスタムプロパティで管理し、区切り線の計算にも流用する */
    @include fluid-style(--external-link-gap-size, 22, 28);

    display: flex;
    gap: var(--external-link-gap-size);
  }

  &__external-link-item {
    position: relative;

    /* 最後のアイテム以外に縦の区切り線を引く */
    &:not(:last-of-type)::after {
      position: absolute;
      top: 0;
      right: calc(var(--external-link-gap-size) / -2);
      width: 1px;
      height: 100%;
      content: "";
      background-color: $white;
      transform: translateX(50%);
    }
  }

  &__external-link {
    @include fluid-style(gap, 6, 8);
    @include fluid-text(11, 14);

    display: flex;
    color: $white;
    letter-spacing: 0.1em;
    transition: color $transition-base;

    &--roboto {
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
    }

    @include hover {
      color: $yellow;

      /* 親要素ホバー時に子要素(アイコン)も同時に色・位置を変更する */
      #{$parent}__external-link-icon {
        fill: $yellow;
        transform: translateY(-4px);
      }
    }
  }

  &__external-link-icon {
    @include fluid-style(width, 11, 14);

    aspect-ratio: 1;
    fill: $white;
    transition: fill $transition-base, transform $transition-base;
  }

  &__copyright {
    @include fluid-text(10, 12);

    font-family: $roboto-mono;
    color: $white;
  }
}
</style>