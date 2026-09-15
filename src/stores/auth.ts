import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'
import ApiService from '@/services/api' // your existing axios wrapper (calls edge functions)
import type { Session, User } from '@supabase/supabase-js'

export type OnboardingStatus =
  | 'PENDING'
  | 'IDENTITY_PENDING'
  | 'IDENTITY_VERIFIED'
  | 'ADDRESS_PENDING'
  | 'COMPLIANCE_PENDING'
  | 'REVIEW_REQUIRED'
  | 'ACTIVE'
  | 'REJECTED'

export interface CustomerProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  email: string
  phone_number: string
  date_of_birth: string
  bvn: string | null
  nin: string | null
  status: OnboardingStatus
  risk_level: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
}

interface AuthState {
  user: User | null
  session: Session | null
  customer: CustomerProfile | null
  initialized: boolean
  loading: boolean
  error: string | null
  // local wizard state (survives step-to-step, cleared once account is ACTIVE)
  onboarding: {
    step: number // 1 profile, 2 identity, 3 address, 4 verify
    bvnVerified: boolean
    ninVerified: boolean
    phoneVerified: boolean
    emailVerified: boolean
  }
}

const STEP_ROUTE: Record<number, string> = {
  1: 'onboarding-profile',
  2: 'onboarding-identity',
  3: 'onboarding-address',
  4: 'onboarding-verify'
}

// Maps a customer.status coming back from the DB to the wizard step the
// user should land on if they refresh mid-flow.
function stepForStatus(status: OnboardingStatus | undefined): number {
  switch (status) {
    case 'PENDING':
      return 2 // profile row already exists -> go straight to identity
    case 'IDENTITY_PENDING':
      return 2
    case 'IDENTITY_VERIFIED':
      return 3
    case 'ADDRESS_PENDING':
      return 3
    case 'COMPLIANCE_PENDING':
    case 'REVIEW_REQUIRED':
      return 4
    default:
      return 1
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    customer: null,
    initialized: false,
    loading: false,
    error: null,
    onboarding: {
      step: 1,
      bvnVerified: false,
      ninVerified: false,
      phoneVerified: false,
      emailVerified: false
    }
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    isOnboardingComplete: (state) => state.customer?.status === 'ACTIVE',
    fullName: (state) =>
      state.customer?.first_name
        ? `${state.customer.first_name} ${state.customer.last_name ?? ''}`.trim()
        : null,
    currentOnboardingRouteName: (state): string =>
      STEP_ROUTE[state.onboarding.step] ?? STEP_ROUTE[1]
  },

  actions: {
    /* ---------------------------------------------------------------- */
    /* Bootstrap                                                         */
    /* ---------------------------------------------------------------- */

    async init() {
      if (this.initialized) return
      this.loading = true
      try {
        const { data } = await supabase.auth.getSession()
        this.session = data.session
        this.user = data.session?.user ?? null

        if (this.user) {
          await this.fetchCustomerProfile()
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          this.session = session
          this.user = session?.user ?? null

          if (event === 'SIGNED_OUT') {
            this.customer = null
            this.resetOnboarding()
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user && !this.customer) {
              await this.fetchCustomerProfile()
            }
          }
        })
      } finally {
        this.loading = false
        this.initialized = true
      }
    },

    async fetchCustomerProfile() {
      if (!this.user) return
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', this.user.id)
        .maybeSingle()

      if (error) {
        this.error = error.message
        return
      }

      this.customer = data
      if (data) {
        this.onboarding.step = stepForStatus(data.status)
      }
    },

    /* ---------------------------------------------------------------- */
    /* Login / logout                                                    */
    /* ---------------------------------------------------------------- */

    async login(email: string, password: string) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        this.session = data.session
        this.user = data.user
        await this.fetchCustomerProfile()
        return { success: true, isActive: this.isOnboardingComplete }
      } catch (err: any) {
        this.error = err?.message ?? 'Unable to sign in. Check your details and try again.'
        return { success: false }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.session = null
      this.customer = null
      this.resetOnboarding()
    },

    resetOnboarding() {
      this.onboarding = {
        step: 1,
        bvnVerified: false,
        ninVerified: false,
        phoneVerified: false,
        emailVerified: false
      }
    },

    /* ---------------------------------------------------------------- */
    /* Step 1 — create profile (Supabase Auth user + customers row)      */
    /* ---------------------------------------------------------------- */

    async registerProfile(payload: {
      phoneNumber: string
      email: string
      dateOfBirth: string
      password: string
    }) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              phone_number: payload.phoneNumber,
              date_of_birth: payload.dateOfBirth
            }
          }
        })
        if (error) throw error

        this.session = data.session
        this.user = data.user

        // Edge function creates the `customers` row server-side (service role),
        // since the anon key alone shouldn't be trusted to set status/risk fields.
        const customer = await ApiService.post<CustomerProfile>('onboarding-register', {
          phone_number: payload.phoneNumber,
          email: payload.email,
          date_of_birth: payload.dateOfBirth
        })

        this.customer = customer
        this.onboarding.step = 2
        return { success: true }
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? err?.message ?? 'Could not create your profile.'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /* ---------------------------------------------------------------- */
    /* Step 2 — BVN / NIN identity verification                          */
    /* ---------------------------------------------------------------- */

    async submitBvn(bvn: string) {
      this.loading = true
      this.error = null
      try {
        const result = await ApiService.post<{
          status: 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED'
          customer: CustomerProfile
        }>('verify-bvn', { bvn })

        this.customer = result.customer
        this.onboarding.bvnVerified = result.status === 'VERIFIED'
        return result
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? 'BVN verification failed. Please try again.'
        return { status: 'FAILED' as const }
      } finally {
        this.loading = false
      }
    },

    async submitNin(nin: string) {
      this.loading = true
      this.error = null
      try {
        const result = await ApiService.post<{
          status: 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED'
          customer: CustomerProfile
        }>('verify-nin', { nin })

        this.customer = result.customer
        this.onboarding.ninVerified = result.status === 'VERIFIED'

        if (this.onboarding.bvnVerified && this.onboarding.ninVerified) {
          this.onboarding.step = 3
        }
        return result
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? 'NIN verification failed. Please try again.'
        return { status: 'FAILED' as const }
      } finally {
        this.loading = false
      }
    },

    /* ---------------------------------------------------------------- */
    /* Phone / Email OTP — handled natively by Supabase Auth             */
    /* ---------------------------------------------------------------- */

    async sendPhoneOtp(phone: string) {
      this.error = null
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) {
        this.error = error.message
        return { success: false }
      }
      return { success: true }
    },

    async verifyPhoneOtp(phone: string, token: string) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
        if (error) throw error
        this.onboarding.phoneVerified = true
        return { success: true }
      } catch (err: any) {
        this.error = err?.message ?? 'Invalid or expired code.'
        return { success: false }
      } finally {
        this.loading = false
      }
    },

    async sendEmailOtp(email: string) {
      this.error = null
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) {
        this.error = error.message
        return { success: false }
      }
      return { success: true }
    },

    async verifyEmailOtp(email: string, token: string) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
        if (error) throw error
        this.onboarding.emailVerified = true
        return { success: true }
      } catch (err: any) {
        this.error = err?.message ?? 'Invalid or expired code.'
        return { success: false }
      } finally {
        this.loading = false
      }
    },

    /* ---------------------------------------------------------------- */
    /* Step 3 — Address                                                   */
    /* ---------------------------------------------------------------- */

    async submitAddress(payload: {
      address: string
      city: string
      state: string
      country: string
      postalCode?: string
    }) {
      this.loading = true
      this.error = null
      try {
        const customer = await ApiService.post<CustomerProfile>('submit-address', {
          address: payload.address,
          city: payload.city,
          state: payload.state,
          country: payload.country,
          postal_code: payload.postalCode
        })
        this.customer = customer
        this.onboarding.step = 4
        return { success: true }
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? 'Could not save your address.'
        return { success: false }
      } finally {
        this.loading = false
      }
    },

    /* ---------------------------------------------------------------- */
    /* Step 4 — Compliance screening + account activation                */
    /* ---------------------------------------------------------------- */

    async runComplianceScreening() {
      this.loading = true
      this.error = null
      try {
        const result = await ApiService.post<{
          status: 'ACTIVE' | 'REVIEW_REQUIRED' | 'REJECTED'
          customer: CustomerProfile
        }>('compliance-screening', {})

        this.customer = result.customer
        return result
      } catch (err: any) {
        this.error = err?.response?.data?.message ?? 'Compliance check failed. Please try again shortly.'
        return { status: 'REVIEW_REQUIRED' as const }
      } finally {
        this.loading = false
      }
    }
  }
})