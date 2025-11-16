import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '../services/api';

export const useAdminStore = defineStore('admin', () => {
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
      throw error;
    }
  };

  /**
   * 検索条件に合う問題文を取得
   */
  const fetchProblems = async () => {
    try {
      // --- 検索用クエリ作成 ---
      const params = new URLSearchParams();

      // 「page」のバリデーション
      const pageNum = parseInt(currentPage.value, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        params.append('page', pageNum);
      } else {
        params.append('page', 1);
      }

      // 「genreId」のバリデーション
      const genreIdNum = parseInt(filterGenreId.value, 10);
      if (!isNaN(genreIdNum) && genreIdNum > 0) {
        params.append('genreId', genreIdNum);
      }

      // 「search」のバリデーション
      if (filterSearchText.value && filterSearchText.value.trim() !== '') {
        params.append('search', filterSearchText.value.trim());
      }

      // 検索条件に合う問題取得
      const response = await api.get(`/api/admin/problems?${params.toString()}`);

      // 今のページの問題
      problems.value = response.data.problems;

      // 合計ページ数
      totalPages.value = response.data.totalPages;
    } catch (error) {
      throw error;
    }
  };

  /**
   * 「ページ」を変える時の処理
   * @param {Number} newPage 表示するページ番号
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
   * @param {String} name ジャンル名
   */
  const addGenre = async (name) => {
    try {
      // ジャンル登録
      await api.post('/api/admin/genres', { name });

      // ジャンル一覧表示を更新
      await fetchGenres();
    } catch (error) {
      throw error;
    }
  };

  /**
   * 新しい問題文を登録する
   * @param {Number} genre_id ジャンルid
   * @param {String} problem_text 問題文
   */
  const addProblem = async (genre_id, problem_text) => {
    try {
      // 問題文登録
      await api.post('/api/admin/problems', { genre_id, problem_text });

      // 問題一覧表示を更新(現在表示ページが最新になる)
      await fetchProblems();
    } catch (error) {
      throw error;
    }
  };

  /**
   * ジャンルを削除する
   * @param {Number} id 削除対象のid
   */
  const deleteGenre = async (id) => {
    try {
      // ジャンルを削除
      await api.delete(`/api/admin/genres/${id}`);

      // ジャンル一覧を更新
      await fetchGenres();

      // もし、絞り込み中のジャンルを削除した場合、問題一覧も更新
      if (filterGenreId.value === String(id)) {
        filterGenreId.value = '';
        await applyFilters();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 問題文を削除する
   * @param {Number} id 削除対象のid
   */
  const deleteProblem = async (id) => {
    try {
      // 問題文の削除
      await api.delete(`/api/admin/problems/${id}`);

      // 問題一覧表示を更新(現在表示ページが最新になる)
      await fetchProblems();
    } catch (error) {
      throw error;
    }
  }

  /**
   * ジャンルを更新する
   * @param {Number} id 更新対象のid
   * @param {String} name ジャンル名
   */
  const updateGenre = async (id, name) => {
    try {
      // ジャンルを更新する
      await api.put(`/api/admin/genres/${id}`, { name });

      // ジャンル一覧を更新
      await fetchGenres();

      // 問題一覧更新
      await fetchProblems();
    } catch (error) {
      throw error;
    }
  };

  /**
   * 問題文を更新する
   * @param {Number} id 更新対象のid
   * @param {Number} genre_id ジャンルid
   * @param {String} problem_text 問題文
   */
  const updateProblem = async (id, genre_id, problem_text) => {
    try {
      // 問題を更新する
      await api.put(`/api/admin/problems/${id}`, { genre_id, problem_text });

      // 問題一覧更新
      await fetchProblems();
    } catch (error) {
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