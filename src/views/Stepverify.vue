<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const phoneOtp = ref('')
const emailOtp = ref('')
const sendingPhone = ref(false)
const sendingEmail = ref(false)
const verifyingPhone = ref(false)
const verifyingEmail = ref(false)
const screening = ref(false)
const screeningResult = ref<'ACTIVE' | 'REVIEW_REQUIRED' | 'REJECTED' | null>(null)
const errors = ref<Record<string, string>>({})

const bothOtpVerified = computed(() => auth.onboarding.phoneVerified && auth.onboarding.emailVerified)

onMounted(async () => {
  if (auth.customer?.phone_number && !auth.onboarding.phoneVerified) {
    await auth.sendPhoneOtp(auth.customer.phone_number)
  }
  if (auth.customer?.email && !auth.onboarding.emailVerified) {
    await auth.sendEmailOtp(auth.customer.email)
  }
})

async function resendPhone() {
  if (!auth.customer?.phone_number) return
  sendingPhone.value = true
  await auth.sendPhoneOtp(auth.customer.phone_number)
  sendingPhone.value = false
}

async function resendEmail() {
  if (!auth.customer?.email) return
  sendingEmail.value = true
  await auth.sendEmailOtp(auth.customer.email)
  sendingEmail.value = false
}

async function handleVerifyPhone() {
  errors.value.phone = ''
  if (!auth.customer?.phone_number) return
  verifyingPhone.value = true
  const result = await auth.verifyPhoneOtp(auth.customer.phone_number, phoneOtp.value)
  verifyingPhone.value = false
  if (!result.success) errors.value.phone = auth.error ?? 'Invalid code.'
  else await maybeRunCompliance()
}

async function handleVerifyEmail() {
  errors.value.email = ''
  if (!auth.customer?.email) return
  verifyingEmail.value = true
  const result = await auth.verifyEmailOtp(auth.customer.email, emailOtp.value)
  verifyingEmail.value = false
  if (!result.success) errors.value.email = auth.error ?? 'Invalid code.'
  else await maybeRunCompliance()
}

async function maybeRunCompliance() {
  if (!bothOtpVerified.value || screeningResult.value) return
  screening.value = true
  const result = await auth.runComplianceScreening()
  screening.value = false
  screeningResult.value = result.status
}

function goToDashboard() {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div>
    <template v-if="screeningResult === 'ACTIVE'">
      <div style="text-align: center; padding: 12px 0 4px">
        <i class="fa-solid fa-circle-check" style="font-size: 48px; color: #1e7a3c" />
        <h2 class="step-title" style="margin-top: 16px">You're all set</h2>
        <p class="step-subtitle">Your account is active and your ParatusPay NGN account has been created.</p>
        <button type="button" class="btn-primary" @click="goToDashboard">Go to dashboard</button>
      </div>
    </template>

    <template v-else-if="screeningResult === 'REVIEW_REQUIRED'">
      <div style="text-align: center; padding: 12px 0 4px">
        <i class="fa-solid fa-hourglass-half" style="font-size: 44px; color: #a97d2f" />
        <h2 class="step-title" style="margin-top: 16px">Almost there</h2>
        <p class="step-subtitle">
          Your details are being reviewed by our compliance team. We'll notify you by email once your account is
          activated — this usually takes less than 24 hours.
        </p>
        <button type="button" class="btn-secondary" @click="goToDashboard">Continue to dashboard</button>
      </div>
    </template>

    <template v-else-if="screeningResult === 'REJECTED'">
      <div style="text-align: center; padding: 12px 0 4px">
        <i class="fa-solid fa-circle-xmark" style="font-size: 44px; color: #b3261e" />
        <h2 class="step-title" style="margin-top: 16px">We couldn't verify your account</h2>
        <p class="step-subtitle">Please contact support for help completing your account setup.</p>
      </div>
    </template>

    <template v-else>
      <p class="step-eyebrow">Step 4 of 4</p>
      <h2 class="step-title">Confirm it's you</h2>
      <p class="step-subtitle">Enter the codes sent to your phone and email to finish setting up your account.</p>

      <!-- Phone OTP -->
      <div class="status-row" v-if="auth.onboarding.phoneVerified">
        <span class="status-row__label"><i class="fa-solid fa-circle-check" style="color:#1e7a3c" /> Phone verified</span>
        <span class="status-badge status-badge--verified">Verified</span>
      </div>
      <template v-else>
        <label class="field">
          <span class="field__label">Code sent to {{ auth.customer?.phone_number }}</span>
          <input
            v-model="phoneOtp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            class="field__input"
            :class="{ 'field__input--error': errors.phone }"
          />
          <span class="field__hint" :class="{ 'field__hint--error': errors.phone }">
            {{ errors.phone || 'Enter the 6-digit code' }}
          </span>
        </label>
        <div style="display:flex; gap:10px; margin-bottom: 20px">
          <button type="button" class="btn-secondary" :disabled="verifyingPhone" @click="handleVerifyPhone">
            <i v-if="verifyingPhone" class="fa-solid fa-circle-notch fa-spin" />
            <span v-else>Verify phone</span>
          </button>
          <button type="button" class="btn-link" :disabled="sendingPhone" @click="resendPhone">Resend code</button>
        </div>
      </template>

      <!-- Email OTP -->
      <div class="status-row" v-if="auth.onboarding.emailVerified">
        <span class="status-row__label"><i class="fa-solid fa-circle-check" style="color:#1e7a3c" /> Email verified</span>
        <span class="status-badge status-badge--verified">Verified</span>
      </div>
      <template v-else>
        <label class="field">
          <span class="field__label">Code sent to {{ auth.customer?.email }}</span>
          <input
            v-model="emailOtp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            class="field__input"
            :class="{ 'field__input--error': errors.email }"
          />
          <span class="field__hint" :class="{ 'field__hint--error': errors.email }">
            {{ errors.email || 'Enter the 6-digit code' }}
          </span>
        </label>
        <div style="display:flex; gap:10px; margin-bottom: 20px">
          <button type="button" class="btn-secondary" :disabled="verifyingEmail" @click="handleVerifyEmail">
            <i v-if="verifyingEmail" class="fa-solid fa-circle-notch fa-spin" />
            <span v-else>Verify email</span>
          </button>
          <button type="button" class="btn-link" :disabled="sendingEmail" @click="resendEmail">Resend code</button>
        </div>
      </template>

      <p v-if="screening" class="step-subtitle" style="text-align:center">
        <i class="fa-solid fa-circle-notch fa-spin" /> Running final compliance checks…
      </p>
    </template>
  </div>
</template>