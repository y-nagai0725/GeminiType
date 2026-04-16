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

/**
 * Vue Routerのインスタンス
 * @type {import('vue-router').Router}
 */
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
      // :idには半角数字(\d+)のみ許可し、それ以外はNotFoundへルーティングさせる
      path: '/mypage/session/:id(\\d+)',
      name: 'session-detail',
      component: SessionDetailView,
      meta: { requiresAuth: true }, // 要ログイン
    },
    {
      // Not Foundページ
      // 上記のどのパスにもマッチしない全てのURLをキャッチする
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
 * グローバルガード (各ルートへ遷移する直前に実行される処理)
 * 認証状態の復元と、アクセス権限のチェックを行う
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // --- ログイン状態の復元チェック ---
  // ブラウザのリロード時など、トークンはlocalStorageにあるが、
  // メモリ上のuserオブジェクトが消失している場合にサーバーから再取得する
  if (authStore.isLoggedIn && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      // トークンが無効・期限切れだった場合などは、ログアウト扱いにする
      console.warn('セッションの復元に失敗しました:', error);
      authStore.logout();
    }
  }

  // --- アクセス権限チェック ---
  // ログインが必要なページ(requiresAuth: true)への遷移時にログインしていない場合
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // ログイン成功後に元々行きたかったページへ戻れるよう、クエリにパスを保持してリダイレクト
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    });
    return;
  }

  // チェックを通過した場合はそのまま次のページへ進む
  next();
});

export default router;