import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import MainMenuView from '../views/MainMenuView.vue';
import TypingSetupView from '../views/TypingSetupView.vue';
import TypingGameView from '../views/TypingGameView.vue';
import TypingResultView from '../views/TypingResultView.vue';
import TopView from '../views/TopView.vue';
import MyPageView from '../views/MyPageView.vue';
import SessionDetailView from '../views/SessionDetailView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'top',
      component: TopView
    },
    {
      path: '/menu',
      name: 'menu',
      component: MainMenuView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    },
    {
      path: '/typing/setup',
      name: 'typing-setup',
      component: TypingSetupView
    },
    {
      path: '/typing/play',
      name: 'typing-play',
      component: TypingGameView
    },
    {
      path: '/typing/result',
      name: 'typing-result',
      component: TypingResultView
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPageView
    },
    {
      path: '/mypage/session/:id',
      name: 'session-detail',
      component: SessionDetailView
    },
    {
      path: '/test-typing',
      name: 'test-typing',
      component: () => import('../views/TestTypingView.vue')
    }
  ]
});

export default router;
