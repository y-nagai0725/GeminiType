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
   * ジャンルを全て取得
   */
  const fetchGenres = async () => {
    try {
      const response = await api.get('/api/admin/genres');
      genres.value = response.data;
    } catch (error) {
      console.error('ジャンルの取得に失敗…', error);
      // TODO: ここで notificationStore を呼ぶ
    }
  };

  /**
   * 問題文を全て取得
   */
  const fetchProblems = async () => {
    try {
      const response = await api.get('/api/admin/problems');
      problems.value = response.data;
    } catch (error) {
      console.error('問題文の取得に失敗…', error);
      // TODO: ここで notificationStore を呼ぶ
    }
  };

  /**
   * 新しいジャンルを登録する
   */
  const addGenre = async (name) => {
    try {
      await api.post('/api/admin/genres', { name });

      // もう一度全部取得で表示を更新
      await fetchGenres();
    } catch (error) {
      console.error('ジャンルの追加に失敗…', error);

      // エラーを「投げて」、AdminView側 に知らせる
      throw error;
    }
  };

  /**
   * 新しい問題文を登録する
   */
  const addProblem = async (genre_id, problem_text) => {
    try {
      await api.post('/api/admin/problems', { genre_id, problem_text });

      // もう一度全部取得で表示を更新
      await fetchProblems();
    } catch (error) {
      console.error('問題文の追加に失敗…', error);

      // エラーを「投げて」、AdminView側 に知らせる
      throw error;
    }
  };

  return {
    genres,
    problems,
    fetchGenres,
    fetchProblems,
    addGenre,
    addProblem
  };
});