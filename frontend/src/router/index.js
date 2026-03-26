import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import MainMenuView from '../views/MainMenuView.vue';
import TypingSetupView from '../views/TypingSetupView.vue';
import TypingGameView from '../views/TypingGameView.vue';
import TypingResultView from '../views/TypingResultView.vue';
import TopView from '../views/TopView.vue';
import MyPageView from '../views/MyPageView.vue';
import SessionDetailView from '../views/SessionDetailView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { useAuthStore } from '../stores/authStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: TopView
    },
    {
      path: '/menu',
      name: 'menu',
      component: MainMenuView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true },
    },
    {
      path: '/typing/setup',
      name: 'typing-setup',
      component: TypingSetupView
    },
    {
      path: '/typing/play',
      name: 'typing-play',
      component: TypingGameView
    },
    {
      path: '/typing/result',
      name: 'typing-result',
      component: TypingResultView
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPageView,
      meta: { requiresAuth: true },
    },
    {
      path: '/mypage/session/:id',
      name: 'session-detail',
      component: SessionDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/test-typing',
      name: 'test-typing',
      component: () => import('../views/TestTypingView.vue')
    },
    {
      // 404ページ設定
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ],
  /**
   * 画面遷移時のスクロール位置を制御する
   * @param {*} to 行き先のルート
   * @param {*} from 来た元のルート
   * @param {*} savedPosition 覚えておいたスクロール位置
   * @returns スクロール位置
   */
  scrollBehavior(to, from, savedPosition) {
    // ページが変わったら、常に一番上（y: 0）に戻す
    return { top: 0 };
  },
});

/**
 * グローバルガード
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // ログイン状態の復元チェック
  // (トークンがあるのにユーザー情報がない場合、サーバーから取得する)
  if (authStore.isLoggedIn && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // トークンが無効だった場合などは、ログアウト扱いにする
      console.warn('セッションの復元に失敗しました:', error);
      authStore.logout();
    }
  }

  // ログインが必要なページへの遷移時にログインしていない場合
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 元々行きたかったパスをクエリに含めてログイン画面へ遷移
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  next(); // 次のページへ進む
});

export default router;
