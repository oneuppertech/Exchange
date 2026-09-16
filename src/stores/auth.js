
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase-auth'

export const useAuthStore = defineStore('auth', () => {
  // =========================
  // STATE
  // =========================

  const user = ref(null)
  const profile = ref(null)
  const token = ref(null)
  const role = ref('viewer')

  // =========================
  // SAFE LOCAL STORAGE PARSER
  // =========================

  const safeParse = (value, fallback = null) => {
    if (!value || value === 'undefined' || value === 'null') {
      return fallback
    }

    try {
      return JSON.parse(value)
    } catch (error) {
      console.warn('Invalid localStorage value:', value)
      return fallback
    }
  }

  // =========================
  // INITIALIZE AUTH STATE
  // =========================

  const init = () => {
    const storedUser = localStorage.getItem('user')
    const storedProfile = localStorage.getItem('profile')
    const storedToken = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')

    user.value = safeParse(storedUser)
    profile.value = safeParse(storedProfile)

    token.value = storedToken || null

    role.value =
      storedRole ||
      profile.value?.role ||
      'viewer'

    console.log('AUTH INITIALIZED:', {
      user: user.value,
      profile: profile.value,
      role: role.value,
      token: !!token.value,
    })
  }

  // =========================
  // FETCH USER PROFILE
  // =========================

 const fetchProfile = async (userId) => {
  if (!userId) {
    console.warn('Cannot fetch profile: no user ID')
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }

  profile.value = data
  role.value = data?.role || 'viewer'

  localStorage.setItem('profile', JSON.stringify(data))
  localStorage.setItem('role', role.value)

  console.log('PROFILE FETCHED:', data)

  return data
}

  // =========================
  // SET AUTH
  // =========================

  const setAuth = async (supabaseUser, session = null) => {
    if (!supabaseUser) {
      console.warn('setAuth called without a user')
      return
    }

    user.value = supabaseUser

    // Get token from session
    token.value = session?.access_token || null

    // Persist user
    localStorage.setItem(
      'user',
      JSON.stringify(supabaseUser)
    )

    // Persist token
    if (token.value) {
      localStorage.setItem('token', token.value)
    } else {
      localStorage.removeItem('token')
    }

    // Fetch fresh profile
    await fetchProfile(supabaseUser.id)

    console.log('AUTH SET:', {
      user: user.value,
      profile: profile.value,
      role: role.value,
    })
  }

  // =========================
  // LOGOUT
  // =========================

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase logout failed:', error)
    }

    user.value = null
    profile.value = null
    token.value = null
    role.value = 'viewer'

    localStorage.removeItem('user')
    localStorage.removeItem('profile')
    localStorage.removeItem('token')
    localStorage.removeItem('role')

    console.log('AUTH LOGGED OUT')
  }

  // =========================
  // RETURN STORE
  // =========================

  return {
    user,
    profile,
    token,
    role,

    init,
    setAuth,
    fetchProfile,
    logout,
  }
})

