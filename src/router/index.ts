
import { createRouter, createWebHistory } from 'vue-router'

import AdminExchange from '@/views/AdminExchange.vue'
import Login from '@/views/Login.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },

    {
      path: '/exchange',
      name: 'exchange',
      component: AdminExchange,
      meta: {
        requiresAuth: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  // Load saved authentication state
  authStore.init()

  if (to.meta.requiresAuth && !authStore.user) {
    return {
      name: 'login',
    }
  }

  // Prevent authenticated users from going back to login
  if (to.name === 'login' && authStore.user) {
    return {
      name: 'exchange',
    }
  }

  return true
})

export default router

