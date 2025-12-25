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
              <li v-if="authStore.isAdmin" class="footer__item">
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
          >&copy; 2025 GeminiType. All Rights Reserved.</span
        >
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import SiteLogoIcon from "@/components/icons/SiteLogoIcon.vue";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon.vue";

/**
 * 認証store
 */
const authStore = useAuthStore();

/**
 * お知らせstore
 */
const notificationStore = useNotificationStore();

/**
 * router
 */
const router = useRouter();

/**
 * ログアウト処理
 */
const handleLogout = () => {
  // ログアウト
  authStore.logout();

  // ログアウト通知
  notificationStore.addNotification("ログアウトしました", "success");
};
</script>

<style lang="scss" scoped>
.footer {
  $parent: &;
  @include fluid-style(padding-block, 48, 100);
  margin-top: auto;
  background-color: $green;

  &__inner {
    @include fluid-style(--box-gap-size, 64, 128);

    display: flex;
    flex-direction: column;
    gap: var(--box-gap-size);
    @include contents-width;
  }

  &__top-box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3.2rem;

    &::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: calc(var(--box-gap-size) / -2);
      transform: translateY(50%);
      width: 100%;
      height: 1px;
      background-color: $white;
    }

    @include pc {
      flex-direction: row;
      align-items: flex-start;
      gap: 0;
    }
  }

  &__logo-box {
    @include pc {
      width: calc(100% / 3 * 2);
    }
  }

  &__logo-link {
    display: inline-flex;
    align-items: center;
    @include fluid-style(gap, 8, 24);
    padding: 1rem 0;
    color: $white;
    transition: color $transition-base;

    @include hover {
      color: $yellow;
    }
  }

  &__logo-icon {
    @include fluid-style(width, 32, 52);
    stroke: currentColor;
    fill: currentColor;
    transition: fill $transition-base, stroke $transition-base;
  }

  &__title {
    @include fluid-text(24, 40);
    font-family: $roboto-mono;
    font-weight: $bold;
    letter-spacing: 0.05em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 0, 4);

    @include pc {
      align-items: flex-start;
    }
  }

  &__link {
    display: block;
    padding: 1rem 0;
    @include fluid-text(14, 18);
    font-weight: $bold;
    letter-spacing: 0.1em;
    color: $white;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    @include fluid-style(gap, 32, 64);

    @include pc {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0;
    }
  }

  &__external-link-list {
    @include fluid-style(--external-link-gap-size, 22, 28);

    display: flex;
    gap: var(--external-link-gap-size);
  }

  &__external-link-item {
    position: relative;

    &:not(:last-of-type)::after {
      content: "";
      position: absolute;
      top: 0;
      right: calc(var(--external-link-gap-size) / -2);
      transform: translateX(50%);
      width: 1px;
      height: 100%;
      background-color: $white;
    }
  }

  &__external-link {
    display: flex;
    @include fluid-style(gap, 6, 8);
    @include fluid-text(11, 14);
    letter-spacing: 0.1em;
    color: $white;
    transition: color $transition-base;

    &--roboto {
      font-family: $roboto-mono;
      letter-spacing: 0.05em;
    }

    @include hover {
      color: $yellow;

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
    font-family: $roboto-mono;
    @include fluid-text(10, 12);
    color: $white;
  }
}
</style>