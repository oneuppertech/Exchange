<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
authStore.init() 
</script>

<template>
  <main class="text-neutral-800">
    <RouterView />
  </main>
</template>

<style>

</style>

