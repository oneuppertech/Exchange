import { createRouter, createWebHistory } from 'vue-router'
import AdminExchange from '@/views/AdminExchange.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    // Landing page
    {
      path: '/',
      name: 'exchange',
      component: AdminExchange,
    }
   
  ],
})

export default router