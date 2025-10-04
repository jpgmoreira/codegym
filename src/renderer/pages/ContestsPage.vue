<script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';

  const treeViewWidth = ref(200);
  const isResizing = ref(false);

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    const minWidth = 20;
    const maxWidth = window.innerWidth - 20;
    treeViewWidth.value = Math.max(minWidth, Math.min(e.clientX, maxWidth));
  }

  onMounted(() => {
    window.addEventListener('mousemove', windowMouseMove);
    window.addEventListener('mouseup', () => (isResizing.value = false));
  });
  onUnmounted(() => {
    window.removeEventListener('mousemove', windowMouseMove);
    window.removeEventListener('mouseup', () => (isResizing.value = false));
  });
</script>

<template>
  <SettingsPageHeader />
  <div class="grow flex border-2 border-orange-400">
    <div
      class="resize-container border-2 border-emerald-300"
      :style="{ width: `${treeViewWidth}px` }"
    >
      <TreeView />
    </div>
    <div class="resizer" @mousedown="isResizing = true"></div>
  </div>
</template>

<style scoped>
  .resizer {
    cursor: col-resize;
    width: 4px;
    background-color: gray;
  }
  .resizer:hover {
    background-color: blue;
  }
</style>
