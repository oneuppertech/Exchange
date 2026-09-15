<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const bvn = ref('')
const nin = ref('')
const errors = reactive<Record<string, string>>({})
const verifyingBvn = ref(false)
const verifyingNin = ref(false)

const bvnStatus = computed(() => (auth.onboarding.bvnVerified ? 'verified' : 'pending'))
const ninStatus = computed(() => (auth.onboarding.ninVerified ? 'verified' : 'pending'))
const canContinue = computed(() => auth.onboarding.bvnVerified && auth.onboarding.ninVerified)

async function handleVerifyBvn() {
  delete errors.bvn
  if (!/^\d{11}$/.test(bvn.value)) {
    errors.bvn = 'BVN must be 11 digits.'
    return
  }
  verifyingBvn.value = true
  const result = await auth.submitBvn(bvn.value)
  verifyingBvn.value = false
  if (result.status !== 'VERIFIED') {
    errors.bvn =
      result.status === 'REVIEW_REQUIRED'
        ? "We couldn't fully match your BVN details — this will be reviewed by our team."
        : 'BVN verification failed. Double-check the number and try again.'
  }
}

async function handleVerifyNin() {
  delete errors.nin
  if (!/^\d{11}$/.test(nin.value)) {
    errors.nin = 'NIN must be 11 digits.'
    return
  }
  verifyingNin.value = true
  const result = await auth.submitNin(nin.value)
  verifyingNin.value = false
  if (result.status !== 'VERIFIED') {
    errors.nin =
      result.status === 'REVIEW_REQUIRED'
        ? "We couldn't fully match your NIN details — this will be reviewed by our team."
        : 'NIN verification failed. Double-check the number and try again.'
  }
}

function handleContinue() {
  router.push({ name: 'onboarding-address' })
}
</script>

<template>
  <div>
    <p class="step-eyebrow">Step 2 of 4</p>
    <h2 class="step-title">Verify your identity</h2>
    <p class="step-subtitle">We use your BVN and NIN to confirm who you are — this only takes a moment.</p>

    <!-- BVN -->
    <div class="status-row" v-if="bvnStatus === 'verified'">
      <span class="status-row__label"><i class="fa-solid fa-circle-check" style="color:#1e7a3c" /> BVN verified</span>
      <span class="status-badge status-badge--verified">Verified</span>
    </div>
    <template v-else>
      <label class="field">
        <span class="field__label">Bank Verification Number (BVN)</span>
        <input
          v-model="bvn"
          type="text"
          inputmode="numeric"
          maxlength="11"
          placeholder="22212345678"
          class="field__input"
          :class="{ 'field__input--error': errors.bvn }"
        />
        <span class="field__hint" :class="{ 'field__hint--error': errors.bvn }">
          {{ errors.bvn || 'Dial *565*0# on your registered line if you don\'t know it' }}
        </span>
      </label>
      <button type="button" class="btn-secondary" style="margin-bottom: 18px" :disabled="verifyingBvn" @click="handleVerifyBvn">
        <i v-if="verifyingBvn" class="fa-solid fa-circle-notch fa-spin" />
        <span v-else>Verify BVN</span>
      </button>
    </template>

    <!-- NIN -->
    <div class="status-row" v-if="ninStatus === 'verified'">
      <span class="status-row__label"><i class="fa-solid fa-circle-check" style="color:#1e7a3c" /> NIN verified</span>
      <span class="status-badge status-badge--verified">Verified</span>
    </div>
    <template v-else>
      <label class="field">
        <span class="field__label">National Identity Number (NIN)</span>
        <input
          v-model="nin"
          type="text"
          inputmode="numeric"
          maxlength="11"
          placeholder="12345678901"
          class="field__input"
          :class="{ 'field__input--error': errors.nin }"
        />
        <span class="field__hint" :class="{ 'field__hint--error': errors.nin }">
          {{ errors.nin || 'Found on your NIN slip or National ID card' }}
        </span>
      </label>
      <button type="button" class="btn-secondary" style="margin-bottom: 18px" :disabled="verifyingNin" @click="handleVerifyNin">
        <i v-if="verifyingNin" class="fa-solid fa-circle-notch fa-spin" />
        <span v-else>Verify NIN</span>
      </button>
    </template>

    <p v-if="auth.customer?.first_name" class="step-subtitle">
      Confirmed name on file: <strong>{{ auth.fullName }}</strong>
    </p>

    <div class="step-actions">
      <button type="button" class="btn-primary" @click="handleContinue">
        <span>Continue to address</span>
        <i class="fa-solid fa-arrow-right" />
      </button>
    </div>
  </div>
</template>