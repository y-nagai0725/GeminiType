import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '../services/api';
import { useNotificationStore } from './notificationStore';

export const useAdminStore = defineStore('admin', () => {
  /**
   * お知らせstore
   */
  const notificationStore = useNotificationStore();

  /**
   * ジャンル一覧
   */
  const genres = ref([]);

  /**
   * 問題文一覧
   */
  const problems = ref([]);

  /**
   * ページネーション: 合計ページ数
   */
  const totalPages = ref(1);

  /**
   * ページネーション: 現在の表示ページ
   */
  const currentPage = ref(1);

  /**
   * 検索対象のジャンル
   */
  const filterGenreId = ref('');

  /**
   * 検索キーワード
   */
  const filterSearchText = ref('');

  /**
   * ジャンルを全て取得
   */
  const fetchGenres = async () => {
    try {
      const response = await api.get('/api/admin/genres');
      genres.value = response.data;
    } catch (error) {
      console.error('ジャンルの取得に失敗…', error);
      notificationStore.addNotification('ジャンルの取得に失敗しました…', 'error');
    }
  };

  /**
   * 検索条件に合う問題文を取得
   */
  const fetchProblems = async () => {
    try {
      // --- 検索用クエリ作成 ---
      const params = new URLSearchParams();

      // 表示するページ
      params.append('page', currentPage.value);

      // 絞り込むジャンル
      if (filterGenreId.value) {
        params.append('genreId', filterGenreId.value);
      }

      // 検索キーワード
      if (filterSearchText.value) {
        params.append('search', filterSearchText.value);
      }

      // 検索条件に合う問題取得
      const response = await api.get(`/api/admin/problems?${params.toString()}`);

      // 今のページの問題
      problems.value = response.data.problems;

      // 合計ページ数
      totalPages.value = response.data.totalPages;
    } catch (error) {
      console.error('問題文の取得に失敗…', error);
      notificationStore.addNotification('問題文の取得に失敗しました…', 'error');
    }
  };

  /**
   * 「ページ」を変える時の処理
   */
  const setPage = (newPage) => {
    if (1 <= newPage && newPage <= totalPages.value) {
      currentPage.value = newPage;

      // ページを変えたら、もう一回「問題文」を取り直す
      fetchProblems();
    }
  };

  /**
   * 「検索」ボタンが押された時の処理
   */
  const applyFilters = () => {
    // 検索実行時は、「1ページ目」に戻す
    currentPage.value = 1;
    fetchProblems();
  };

  /**
   * 新しいジャンルを登録する
   */
  const addGenre = async (name) => {
    try {
      await api.post('/api/admin/genres', { name });
      notificationStore.addNotification('ジャンルを追加したよ!', 'success');

      // ジャンル一覧表示を更新
      await fetchGenres();
    } catch (error) {
      console.error('ジャンルの追加に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || 'ジャンルの追加に失敗…', 'error');
    }
  };

  /**
   * 新しい問題文を登録する
   */
  const addProblem = async (genre_id, problem_text) => {
    try {
      await api.post('/api/admin/problems', { genre_id, problem_text });
      notificationStore.addNotification('問題文を追加したよ！', 'success');

      // 問題一覧表示を更新(現在表示ページが最新になる)
      await fetchProblems();
    } catch (error) {
      console.error('問題文の追加に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || '問題文の追加に失敗…', 'error');
    }
  };

  /**
   * ジャンルを削除する
   */
  const deleteGenre = async (id) => {
    try {
      // ジャンルを削除
      await api.delete(`/api/admin/genres/${id}`);
      notificationStore.addNotification('ジャンルを削除したよ！', 'success');

      // ジャンル一覧を更新
      await fetchGenres();

      // もし、絞り込み中のジャンルを削除した場合、問題一覧も更新
      if (filterGenreId.value === id) {
        filterGenreId.value = '';
        await applyFilters();
      }
    } catch (error) {
      console.error('ジャンルの削除に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || 'ジャンルの削除に失敗…', 'error');
    }
  }

  /**
   * 問題文を削除する
   */
  const deleteProblem = async (id) => {
    try {
      // 問題文の削除
      await api.delete(`/api/admin/problems/${id}`);
      notificationStore.addNotification('問題文を削除したよ！', 'success');

      // 問題一覧表示を更新(現在表示ページが最新になる)
      await fetchProblems();
    } catch (error) {
      console.error('問題文の削除に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || '問題文の削除に失敗…', 'error');
    }
  }

  /**
   * ジャンルを更新する
   */
  const updateGenre = async (id, name) => {
    try {
      // ジャンルを更新する
      await api.put(`/api/admin/genres/${id}`, { name });
      notificationStore.addNotification('ジャンルを更新したよ！', 'success');

      // ジャンル一覧を更新
      await fetchGenres();

      // 問題一覧更新
      await fetchProblems();
    } catch (error) {
      console.error('ジャンルの更新に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || 'ジャンルの更新に失敗…', 'error');

      // (★) エラーを「投げて」、モーダル を「閉じない」ようにする
      throw error;
    }
  };

  /**
   * 問題文を更新する
   */
  const updateProblem = async (id, genre_id, problem_text) => {
    try {
      // 問題を更新する
      await api.put(`/api/admin/problems/${id}`, { genre_id, problem_text });
      notificationStore.addNotification('問題文を更新したよ！', 'success');

      // 問題一覧更新
      await fetchProblems();
    } catch (error) {
      console.error('問題文の更新に失敗…', error);
      notificationStore.addNotification(error.response?.data?.message || '問題文の更新に失敗…', 'error');

      // (★) こっちもエラーを「投げる」
      throw error;
    }
  }

  return {
    genres,
    problems,
    totalPages,
    currentPage,
    filterGenreId,
    filterSearchText,
    fetchGenres,
    fetchProblems,
    setPage,
    applyFilters,
    addGenre,
    addProblem,
    deleteGenre,
    deleteProblem,
    updateGenre,
    updateProblem
  };
});