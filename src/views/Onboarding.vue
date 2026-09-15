<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const steps = [
  { n: 1, name: 'onboarding-profile', label: 'Profile' },
  { n: 2, name: 'onboarding-identity', label: 'Identity' },
  { n: 3, name: 'onboarding-address', label: 'Address' },
  { n: 4, name: 'onboarding-verify', label: 'Verify' }
]

const currentStep = computed(() => steps.find((s) => s.name === route.name)?.n ?? 1)
</script>

<template>
  <div class="onboard-shell">
    <div class="onboard-card">
      <div class="onboard-card__header">
        <img src="@/assets/images/paratus-pay-logo.png" alt="ParatusPay" class="onboard-card__logo rounded-md" />
        <h1>Create your profile</h1>
        <p>Your account starts here</p>

        <div class="progress-track">
          <div
            v-for="step in steps"
            :key="step.n"
            class="progress-segment"
            :class="{ 'progress-segment--done': step.n <= currentStep }"
          />
        </div>
      </div>

      <div class="onboard-card__body">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboard-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(60% 60% at 85% 0%, rgba(197, 154, 71, 0.12), transparent 60%),
    linear-gradient(160deg, #0a0f2c 0%, #0f1744 55%, #131b52 100%);
}

.onboard-card {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 30px 60px -20px rgba(10, 15, 44, 0.5);
  overflow: hidden;
}

.onboard-card__header {
  padding: 32px 32px 24px;
  background: linear-gradient(135deg, #0a0f2c 0%, #16204f 100%);
  color: #fff;
}

.onboard-card__logo {
  width: 36px;
  height: 36px;
  margin-bottom: 14px;
}

.onboard-card__header h1 {
  font-size: 21px;
  font-weight: 700;
  margin: 0 0 2px;
}

.onboard-card__header p {
  font-size: 13px;
  color: #b9c0e0;
  margin: 0 0 18px;
}

.progress-track {
  display: flex;
  gap: 6px;
}

.progress-segment {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  transition: background 0.2s ease;
}

.progress-segment--done {
  background: linear-gradient(90deg, #dcb35c, #a97d2f);
}

.onboard-card__body {
  padding: 28px 32px 32px;
}
</style>