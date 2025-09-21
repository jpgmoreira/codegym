<script lang="ts" setup>
  import Toast from './components/UI/Toast.vue';
</script>

<template>
  <Toast />
  <main class="flex flex-col min-h-[100vh]">
    <RouterView />
  </main>
</template>
