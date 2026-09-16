
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { supabase } from '@/services/supabase-auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginForm = ref({
  email: '',
  password: '',
  remember: false,
  errors: {
    email: '',
    password: '',
  },
  processing: false,
})

const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const submitForm = async () => {
  loginForm.value.processing = true
  loginForm.value.errors.email = ''
  loginForm.value.errors.password = ''

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password,
    })

    if (error) {
      loginForm.value.errors.email = error.message
      return
    }

    await authStore.setAuth(data.user, data.session)

    router.push('/exchange')
  } catch (error) {
    console.error('Login error:', error)
    loginForm.value.errors.email = 'Something went wrong. Try again.'
  } finally {
    loginForm.value.processing = false
  }
}
</script>

<template>
  <div class="w-full min-h-screen flex items-center justify-center bg-white">
    <div class="max-w-md w-full px-4 sm:px-6 lg:px-8 py-8">

      <p class="text-gray-600 mt-2 text-center">
        Login to access your account
      </p>

      <form @submit.prevent="submitForm" class="mt-6 space-y-4">

        <p v-if="loginForm.errors.email" class="text-red-500 text-sm">
          {{ loginForm.errors.email }}
        </p>

        <v-text-field
          v-model="loginForm.email"
          type="email"
          label="Email address"
          variant="outlined"
          color="red"
        />

        <p v-if="loginForm.errors.password" class="text-red-500 text-sm">
          {{ loginForm.errors.password }}
        </p>

        <v-text-field
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          variant="outlined"
          color="red"
        >
          <template #append-inner>
            <i
              :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
              class="cursor-pointer text-black"
              @click="togglePasswordVisibility"
            />
          </template>
        </v-text-field>

        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2">
            <el-checkbox v-model="loginForm.remember" size="large" />
            <span class="text-sm text-gray-700">Remember me</span>
          </label>

          <v-btn
            variant="text"
            size="small"
            color="red"
            class="normal-case text-none"
          >
            Forgot password?
          </v-btn>
        </div>

        <v-btn
          type="submit"
          :loading="loginForm.processing"
          class="w-full text-white font-semibold text-sm custom-btn"
          height="40"
        >
          Sign in
        </v-btn>

      </form>
    </div>
  </div>
</template>

<style scoped>
.custom-btn {
  background-color: red;
}

.v-btn {
  text-transform: none;
}
</style>
