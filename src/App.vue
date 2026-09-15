<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

</script>

<template>
  <main class="text-neutral-800">
    <RouterView />
  </main>
</template>

<style>
.custom-btn {
  background-color: #5c2ecd;
}

 
:root {
  --grad: linear-gradient(135deg, #6d28d9 0%, #ec4899 100%);
}
 
.font-sans {
  font-family: 'Google Sans', 'Product Sans', 'Segoe UI', system-ui, -apple-system, sans-serif;
}
.font-display {
  font-family: 'Google Sans Display', 'Google Sans', 'Product Sans', sans-serif;
}
 
/* Gradient text helper (used for the logo, headline emphasis, big numbers) */
.grad-text {
  background: var(--grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
 

</style>

