import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  /**
   * router
   */
  const router = useRouter();

  /**
   * 「トークン」は、localStorageから読み込む
   */
  const token = ref(localStorage.getItem('token'));

  /**
   * ログインしてる「ユーザー情報」
   */
  const user = ref(null);

  /**
   * ログイン状態かどうか
   */
  const isLoggedIn = computed(() => !!token.value);

  /**
   * 管理権限があるかどうか
   */
  const isAdmin = computed(() => !!user.value && user.value.isAdmin);

  /**
   * ログイン処理
   * @param {string} email メールアドレス
   * @param {string} password パスワード
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

      // メインメニューへ遷移
      router.push('/menu');
    } catch (error) {
      // 呼び出し元へエラーを投げる
      throw error;
    }
  };

  /**
   * ユーザー情報を取得
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
   * ログアウト
   */
  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  };

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    fetchUser,
    logout
  };
});