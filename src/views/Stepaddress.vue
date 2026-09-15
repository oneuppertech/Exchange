<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  address: auth.customer?.address ?? '',
  city: auth.customer?.city ?? '',
  state: auth.customer?.state ?? '',
  country: auth.customer?.country ?? 'Nigeria',
  postalCode: auth.customer?.postal_code ?? ''
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  if (!form.address.trim()) errors.address = 'Enter your residential address.'
  if (!form.city.trim()) errors.city = 'Enter your city.'
  if (!form.state.trim()) errors.state = 'Enter your state.'
  if (!form.country.trim()) errors.country = 'Enter your country.'
  return Object.keys(errors).length === 0
}

// async function handleSubmit() {
//   if (!validate()) return
//   submitting.value = true
//   const result = await auth.submitAddress(form)
//   submitting.value = false
//   if (result.success) {
//     router.push({ name: 'onboarding-verify' })
//   }
// }
async function handleSubmit() {

    router.push({ name: 'onboarding-verify' })
 
}
</script>

<template>
  <div>
    <p class="step-eyebrow">Step 3 of 4</p>
    <h2 class="step-title">Where do you live?</h2>
    <p class="step-subtitle">This helps us meet regulatory requirements for your account.</p>

    <div v-if="auth.error" class="auth-alert" role="alert">
      <i class="fa-solid fa-circle-exclamation" />
      <span>{{ auth.error }}</span>
    </div>

    <form @submit.prevent="handleSubmit">
      <label class="field">
        <span class="field__label">Residential address</span>
        <input
          v-model="form.address"
          type="text"
          placeholder="12 Admiralty Way, Lekki Phase 1"
          class="field__input"
          :class="{ 'field__input--error': errors.address }"
        />
        <span v-if="errors.address" class="field__hint field__hint--error">{{ errors.address }}</span>
      </label>

      <div class="grid-2">
        <label class="field">
          <span class="field__label">City</span>
          <input
            v-model="form.city"
            type="text"
            placeholder="Lagos"
            class="field__input"
            :class="{ 'field__input--error': errors.city }"
          />
        </label>
        <label class="field">
          <span class="field__label">State</span>
          <input
            v-model="form.state"
            type="text"
            placeholder="Lagos State"
            class="field__input"
            :class="{ 'field__input--error': errors.state }"
          />
        </label>
      </div>

      <div class="grid-2">
        <label class="field">
          <span class="field__label">Country</span>
          <input
            v-model="form.country"
            type="text"
            class="field__input"
            :class="{ 'field__input--error': errors.country }"
          />
        </label>
        <label class="field">
          <span class="field__label">Postal code</span>
          <input v-model="form.postalCode" type="text" placeholder="Optional" class="field__input" />
        </label>
      </div>

      <div class="step-actions">
        <button type="submit" class="btn-primary">
          <span v-if="!submitting">Continue to verification</span>
          <i v-else class="fa-solid fa-circle-notch fa-spin" />
          <i v-if="!submitting" class="fa-solid fa-arrow-right" />
        </button>
      </div>
    </form>
  </div>
</template>