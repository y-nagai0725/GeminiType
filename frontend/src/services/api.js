// =========================================================================
// パッケージの読み込み・APIクライアントの作成
// =========================================================================

import axios from 'axios';

/**
 * Axiosのカスタムインスタンス
 * .env.localからベースURLを読み込んで設定する
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// =========================================================================
// リクエストインターセプター (送信前の処理)
// =========================================================================

api.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('token');

    // トークンがある場合は、リクエストヘッダーに'Bearer "token"'の形式で付与する
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================================================================
// レスポンスインターセプター (受信後の処理)
// =========================================================================

api.interceptors.response.use(
  (response) => {
    // 「成功」レスポンスは、そのまま通す
    return response;
  },
  async (error) => {
    // エラーが起きたAPIの「URL」と「ステータスコード」を取得
    const originalRequestUrl = error.config?.url;
    const status = error.response?.status;

    // 「401エラー（トークン切れ・未認証）」且つ「ログインAPI」ではない場合
    // ※ログイン時のパスワード間違い等(401)で強制ログアウト処理が走るのを防ぐため
    if (status === 401 && originalRequestUrl !== '/api/login') {

      // 認証storeとお知らせstoreを動的インポート (循環参照を防ぐため)
      const { useAuthStore } = await import('../stores/authStore');
      const { useNotificationStore } = await import('../stores/notificationStore');
      const authStore = useAuthStore();
      const notificationStore = useNotificationStore();

      // セッション切れの通知を表示
      notificationStore.addNotification(
        'セッションが期限切れです。もう一度ログインして下さい。',
        'error'
      );

      // ログアウト(ログイン画面への強制遷移含む)
      authStore.logout();
    }

    return Promise.reject(error);
  }
);

export default api;