import axios from 'axios';

const api = axios.create({
  // .env.local からベースURLを読み込む
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// リクエストインターセプター
api.interceptors.request.use(
  (config) => {
    // ローカルストレージからトークン取得
    const token = localStorage.getItem('token');

    // トークンがある場合、リクエストヘッダーにトークン付与('Bearer トークン'の形式)
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
    return response;
  },
  (error) => {
    // 200番台「以外」の「失敗」レスポンスが来たら…

    // (★) ここが「トークン切れで自動ログアウト」の「骨組み」だよ！
    if (error.response && error.response.status === 401) {
      // 401エラー（認証エラー）がBackendから返ってきたら…
      console.error('401エラー（トークン切れか、認証失敗）を検知！');

      // TODO: (★) ここに「自動ログアウト処理」を書くんだよね！
      // (例) localStorage.removeItem('token');
      // (例) alert('セッションが切れました。もう一度ログインしてください。');
      // (例) window.location.href = '/login'; // 強制的にログイン画面に戻す！
    }

    // 401以外のエラーも、ちゃんと「エラーだよ」って返してあげる
    return Promise.reject(error);
  }
);

export default api;