// =========================================================================
// パッケージ・コンポーネントの読み込み
// =========================================================================

// --- Vue Router ---
import { createRouter, createWebHistory } from 'vue-router';

// --- 状態管理 (Store) ---
import { useAuthStore } from '../stores/authStore';

// --- 画面コンポーネント (Views) ---
import TopView from '../views/TopView.vue';
import MainMenuView from '../views/MainMenuView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import TypingSetupView from '../views/TypingSetupView.vue';
import TypingGameView from '../views/TypingGameView.vue';
import TypingResultView from '../views/TypingResultView.vue';
import MyPageView from '../views/MyPageView.vue';
import SessionDetailView from '../views/SessionDetailView.vue';
import NotFoundView from '../views/NotFoundView.vue';

// =========================================================================
// ルーターの作成とルート定義
// =========================================================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // TOPページ
      path: '/',
      name: 'top',
      component: TopView
    },
    {
      // メインメニューページ
      path: '/menu',
      name: 'menu',
      component: MainMenuView
    },
    {
      // ログインページ
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      // ユーザー登録ページ
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      // 管理ページ
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true }, // 要ログイン
    },
    {
      // タイピング設定ページ
      path: '/typing/setup',
      name: 'typing-setup',
      component: TypingSetupView
    },
    {
      // タイピングゲームページ
      path: '/typing/play',
      name: 'typing-play',
      component: TypingGameView
    },
    {
      // タイピング結果ページ
      path: '/typing/result',
      name: 'typing-result',
      component: TypingResultView
    },
    {
      // マイページ
      path: '/mypage',
      name: 'mypage',
      component: MyPageView,
      meta: { requiresAuth: true }, // 要ログイン
    },
    {
      // セッション詳細ページ
      path: '/mypage/session/:id(\\d+)', // :idには半角数字のみ許可
      name: 'session-detail',
      component: SessionDetailView,
      meta: { requiresAuth: true }, // 要ログイン
    },
    {
      // Not Foundページ
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ],
});

// =========================================================================
// ナビゲーションガード (画面遷移前の処理)
// =========================================================================

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
