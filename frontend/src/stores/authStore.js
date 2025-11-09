// frontend/src/stores/authStore.js

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import api from '../services/api' // (★) お兄ちゃんが作った「最強のapi.js」！

// (★) 「useAuthStore」っていう名前で、宝箱の「設計図」を作るよ！
export const useAuthStore = defineStore('auth', () => {
  // --- 1. State (「宝箱」の中身) ---

  // (★) 「トークン」 は、localStorageから「初期値」を読み込んでおくよ！
  const token = ref(localStorage.getItem('token'))
  // (★) 「ログインしてるユーザー情報」
  const user = ref(null)

  // --- 2. Getters (「宝箱」の中身を使った「計算結果」) ---

  // (★) 「ログインしてる？」っていうのを、トークンがあるかどうかで計算するよ
  const isLoggedIn = computed(() => !!token.value)
  // (★) 「管理者さん？」っていうのを、ユーザー情報から計算するよ
  const isAdmin = computed(() => !!user.value && user.value.isAdmin)

  // (★) router を「プログラムで」動かすための道具
  const router = useRouter()

  // --- 3. Actions (「宝箱」を操作する「魔法」) ---

  /**
   * (★) ログインの「魔法」だよ！♡
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    // (★) LoginView がやってた「お仕事」を、ぜんぶこっちにお引越し！
    try {
      // 1. ログインAPIを叩く！
      const response = await api.post('/api/login', { email, password })

      // 2. トークンを「宝箱(state)」と「localStorage」に入れる！
      token.value = response.data.token
      localStorage.setItem('token', response.data.token)

      // 3. (★) すぐに「/api/me」 を叩いて、ユーザー情報を取ってくる！
      await fetchUser() // (↓ 下で「別の魔法」として作っておくよ！)

      // 4. メインメニュー（仮のトップページ "/"）に「ワープ」！
      router.push('/') // (←あとでメインメニュー画面のパスに変えようね！)

    } catch (error) {
      // (★) エラーが起きたら、そのエラーを「呼び出し元(LoginView)」にちゃんと教えてあげる
      console.error('ログイン処理（authStore）でエラー:', error)
      throw error // (★) エラーを「投げる」と、LoginViewの「try...catch」で捕まえられるよ！
    }
  }

  /**
   * (★) ユーザー情報を「取ってくる」魔法
   */
  const fetchUser = async () => {
    if (token.value) { // トークンがある時だけ実行
      try {
        const response = await api.get('/api/me') // (★) /api/me を叩く！
        user.value = response.data.user // (★) 取ってきた情報を「宝箱(state)」に入れる！
      } catch (error) {
        // トークンが「偽物」か「期限切れ」だったら、ここで401エラー が起きるよ
        console.error('/api/me でエラー:', error)
        // エラーだったら、ぜんぶ「カラっぽ」にしちゃおう！
        token.value = null
        user.value = null
        localStorage.removeItem('token')
      }
    }
  }

  /**
   * (★) ログアウトの「魔法」
   */
  const logout = () => {
    // ぜんぶ「カラっぽ」にするよ！
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    // ログイン画面 に「ワープ」！
    router.push('/login')
  }

  // (★) この「宝箱」から「取り出せるもの」をぜんぶ返すよ！
  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login, // (← ログインの「魔法」)
    fetchUser, // (← ユーザー情報を取る「魔法」)
    logout // (← ログアウトの「魔法」)
  }
})