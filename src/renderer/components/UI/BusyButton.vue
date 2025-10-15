<script lang="ts" setup>
  /**
   * This component is used for buttons that display a "loading" state when clicked.
   * The goal is to avoid the flickering that may happen when the loading ends too fast.
   * It waits for a few milliseconds before showing the "loading" state.
   */
  import { ref, onBeforeUnmount } from 'vue';
  const props = defineProps<{
    debounce?: number;
    callback: () => Promise<void>;
  }>();
  const isBusy = ref(false);
  const isRunning = ref(false);
  const debounceTime = props.debounce ?? 200;
  let timer: ReturnType<typeof setTimeout> | undefined;
  async function onClick() {
    if (isRunning.value) return;
    isRunning.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      isBusy.value = true;
    }, debounceTime);
    await props.callback().finally(() => {
      isRunning.value = false;
      isBusy.value = false;
      clearTimeout(timer);
    });
  }
  onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button type="button" @click="onClick" :disabled="isBusy">
    <template v-if="isBusy">
      <slot name="busy">Loading...</slot>
    </template>
    <template v-else>
      <slot name="default">Click</slot>
    </template>
  </button>
</template>
