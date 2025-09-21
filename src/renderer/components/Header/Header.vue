<template>
  <header class="w-full flex">
    <slot></slot>
  </header>
</template>

<style scoped>
  header {
    background-color: var(--header-bg);
  }
  header *,
  header *:hover {
    color: var(--header-color);
  }
</style>
