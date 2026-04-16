// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import api from '../services/api';

// =========================================================================
// Storeの定義
// =========================================================================

export const useAuthStore = defineStore('auth', () => {

  // =======================================================================
  // State (状態管理)
  // =======================================================================

  /**
   * Vue Routerインスタンス
   * @type {import('vue-router').Router}
   */
  const router = useRouter();

  /**
   * 認証トークン (初期値はlocalStorageから取得)
   * @type {import('vue').Ref<string | null>}
   */
  const token = ref(localStorage.getItem('token'));

  /**
   * ログイン中のユーザー情報
   * @type {import('vue').Ref<Object | null>}
   */
  const user = ref(null);


  // =======================================================================
  // Getters (算出状態)
  // =======================================================================

  /**
   * ログイン状態かどうかを判定
   * @type {import('vue').ComputedRef<boolean>}
   */
  const isLoggedIn = computed(() => !!token.value);

  /**
   * フル権限の管理者（ADMIN）かどうかを判定
   * @type {import('vue').ComputedRef<boolean>}
   */
  const isAdmin = computed(() => !!user.value && user.value.role === 'ADMIN');

  /**
   * ゲスト管理者（GUEST_ADMIN）かどうかを判定
   * @type {import('vue').ComputedRef<boolean>}
   */
  const isGuestAdmin = computed(() => !!user.value && user.value.role === 'GUEST_ADMIN');

  /**
   * 管理画面にアクセスできる権限（ADMIN または GUEST_ADMIN）があるかを判定
   * @type {import('vue').ComputedRef<boolean>}
   */
  const canAccessAdmin = computed(() => !!user.value && (user.value.role === 'ADMIN' || user.value.role === 'GUEST_ADMIN'));


  // =======================================================================
  // Actions (API通信・状態更新)
  // =======================================================================

  /**
   * ログイン処理を実行し、成功時は元のページ（またはメインメニュー）へ遷移する
   * @param {string} email メールアドレス
   * @param {string} password パスワード
   * @returns {Promise<void>}
   */
  const login = async (email, password) => {
    try {
      // ログインAPI
      const response = await api.post('/api/login', { email, password });

      // トークンをstateとlocalStorageへセット
      token.value = response.data.token;
      localStorage.setItem('token', response.data.token);

      // ユーザー情報を取得する
      await fetchUser();

      // リダイレクト先をクエリパラメータから取得（なければ '/menu'）
      const redirectPath = router.currentRoute.value.query.redirect || '/menu';

      // 取得したパスへ遷移
      router.push(redirectPath);
    } catch (error) {
      // 呼び出し元へエラーを投げる
      throw error;
    }
  };

  /**
   * サーバーから最新のユーザー情報を取得してStateにセットする
   * @returns {Promise<void>}
   */
  const fetchUser = async () => {
    if (token.value) { // トークンがある時だけ実行
      try {
        // ユーザー情報を取得
        const response = await api.get('/api/me');

        // 取得したユーザー情報をstateにセットする
        user.value = response.data.user;
      } catch (error) {
        // エラー時はトークンとユーザー情報を空にする
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
      }
    }
  };

  /**
   * ログアウト処理を実行し、ログイン画面へ遷移する
   * @returns {void}
   */
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  };


  // =======================================================================
  // 外部に公開する変数・関数
  // =======================================================================

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    isGuestAdmin,
    canAccessAdmin,
    login,
    fetchUser,
    logout
  };
});