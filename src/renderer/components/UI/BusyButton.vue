<script lang="ts" setup>
  /**
   * This component is used for buttons that display a "loading" state when clicked.
   * The goal is to avoid the flickering that may happen when the loading ends too fast.
   * It waits for a few milliseconds before showing the "loading" state.
   * "reallyBusy" can be used to inform the parent component via v-model that the button is busy.
   */
  import { watch, onBeforeUnmount } from 'vue';
  const reallyBusy = defineModel<boolean>();
  const props = defineProps<{ busySignal: boolean }>();
  let timer: NodeJS.Timeout | undefined = undefined;
  watch(
    () => props.busySignal,
    (busy) => {
      clearTimeout(timer);
      if (busy) {
        timer = setTimeout(() => (reallyBusy.value = true), 100);
      } else {
        reallyBusy.value = false;
      }
    }
  );
  onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button :disabled="reallyBusy"><slot></slot></button>
</template>
