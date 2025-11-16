import axios from 'axios';

const api = axios.create({
  // .env.localからベースURLを読み込む
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークンを取得
    const token = localStorage.getItem('token');

    // トークンがある場合は、リクエストヘッダーに'Bearer "token"'の形式で付与する
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
api.interceptors.response.use(
  (response) => {
    // 「成功」レスポンスは、そのまま通す
    return response;
  },
  async (error) => {
    // エラーが起きたAPIの「URL」と「ステータスコード」を取得
    const originalRequestUrl = error.config.url;
    const status = error.response ? error.response.status : null;

    // 「401エラー（トークン切れ）」且つ「ログインAPI」ではない場合
    if (status === 401 && originalRequestUrl !== '/api/login') {
      // 認証storeとお知らせstoreを用意
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