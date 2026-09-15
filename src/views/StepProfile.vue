<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  phoneNumber: '',
  email: '',
  dateOfBirth: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

function isAdult(dob: string) {
  if (!dob) return false
  const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return age >= 18
}

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!/^\d{10,11}$/.test(form.phoneNumber.replace(/\D/g, ''))) {
    errors.phoneNumber = 'Enter a valid phone number.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!isAdult(form.dateOfBirth)) {
    errors.dateOfBirth = 'You must be at least 18 years old.'
  }
  if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'At least 8 characters with a capital letter, a number and a symbol.'
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return Object.keys(errors).length === 0
}

// async function handleSubmit() {
//   if (!validate()) return

//   submitting.value = true
//   const result = await auth.registerProfile({
//     phoneNumber: form.phoneNumber,
//     email: form.email,
//     dateOfBirth: form.dateOfBirth,
//     password: form.password
//   })
//   submitting.value = false

//   if (result.success) {
//     router.push({ name: 'onboarding-identity' })
//   }
// }
async function handleSubmit() {
 
    router.push({ name: 'onboarding-identity' })
 
}
</script>

<template>
  <div>
    <p class="step-eyebrow">Step 1 of 4</p>
    <h2 class="step-title">Your account starts here</h2>
    <p class="step-subtitle">Enter your details to create your ParatusPay profile.</p>

    <div v-if="auth.error" class="auth-alert" role="alert">
      <i class="fa-solid fa-circle-exclamation" />
      <span>{{ auth.error }}</span>
    </div>

    <form @submit.prevent="handleSubmit">
      <label class="field">
        <span class="field__label">Phone number</span>
        <input
          v-model="form.phoneNumber"
          type="tel"
          placeholder="8012345678"
          class="field__input"
          :class="{ 'field__input--error': errors.phoneNumber }"
        />
        <span class="field__hint" :class="{ 'field__hint--error': errors.phoneNumber }">
          {{ errors.phoneNumber || 'Used for account verification' }}
        </span>
      </label>

      <label class="field">
        <span class="field__label">Email address</span>
        <input
          v-model="form.email"
          type="email"
          placeholder="john@business.com"
          class="field__input"
          :class="{ 'field__input--error': errors.email }"
        />
        <span class="field__hint" :class="{ 'field__hint--error': errors.email }">
          {{ errors.email || "We'll send a verification code here" }}
        </span>
      </label>

      <label class="field">
        <span class="field__label">Date of birth</span>
        <input
          v-model="form.dateOfBirth"
          type="date"
          class="field__input"
          :class="{ 'field__input--error': errors.dateOfBirth }"
        />
        <span class="field__hint" :class="{ 'field__hint--error': errors.dateOfBirth }">
          {{ errors.dateOfBirth || 'You must be at least 18 years old' }}
        </span>
      </label>

      <label class="field">
        <span class="field__label">Password</span>
        <div class="field__input-wrap">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Create a strong password"
            class="field__input"
            :class="{ 'field__input--error': errors.password }"
          />
          <button type="button" class="field__toggle" @click="showPassword = !showPassword">
            <i :class="showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" />
          </button>
        </div>
        <span class="field__hint" :class="{ 'field__hint--error': errors.password }">
          {{ errors.password || 'At least 8 characters with mixed case, numbers & symbols' }}
        </span>
      </label>

      <label class="field">
        <span class="field__label">Confirm password</span>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Confirm your password"
          class="field__input"
          :class="{ 'field__input--error': errors.confirmPassword }"
        />
        <span v-if="errors.confirmPassword" class="field__hint field__hint--error">
          {{ errors.confirmPassword }}
        </span>
      </label>

      <div class="step-actions">
        <button type="submit" class="btn-primary" :disabled="submitting">
          <span v-if="!submitting">Continue to identity</span>
          <i v-else class="fa-solid fa-circle-notch fa-spin" />
          <i v-if="!submitting" class="fa-solid fa-arrow-right" />
        </button>
      </div>
    </form>

    <p class="step-subtitle" style="text-align: center; margin-top: 18px">
      Already have an account?
      <router-link to="/" class="btn-link">Back to login</router-link>
    </p>
  </div>
</template>