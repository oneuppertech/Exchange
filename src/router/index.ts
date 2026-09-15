import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/views/LandingPage.vue'
import Onboarding from '@/views/Onboarding.vue'

import StepProfile from '@/views/StepProfile.vue'
import StepIdentity from '@/views/StepIdentity.vue'
import Stepaddress from '@/views/Stepaddress.vue'
import Stepverify from '@/views/Stepverify.vue'
import AdminExchange from '@/views/AdminExchange.vue'
import CustomerExchange from '@/views/CustomerExchange.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    // Landing page
    {
      path: '/',
      name: 'customer',
      component: CustomerExchange,
    },
    {
      path: '/landing',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminExchange,
    },

    // Onboarding
    {
      path: '/',
      component: Onboarding,

      children: [
        {
          path: '',
          redirect: { name: 'onboarding-profile' },
        },

        {
          path: 'onboarding-profile',
          name: 'onboarding-profile',
          component: StepProfile,
        },

        {
          path: 'onboarding-identity',
          name: 'onboarding-identity',
          component: StepIdentity,
        },

        {
          path: 'onboarding-address',
          name: 'onboarding-address',
          component: Stepaddress,
        },

        {
          path: 'onboarding-verify',
          name: 'onboarding-verify',
          component: Stepverify,
        },
      ],
    },
  ],
})

export default router