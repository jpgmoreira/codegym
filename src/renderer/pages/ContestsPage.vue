<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';

  const treeAreaWidth = ref(300);
  const isResizing = ref(false);

  function windowMouseUp() {
    isResizing.value = false;
  }

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
  }

  onMounted(() => {
    window.addEventListener('mouseup', windowMouseUp);
    window.addEventListener('mousemove', windowMouseMove);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', windowMouseUp);
    window.removeEventListener('mousemove', windowMouseMove);
  });
</script>

<template>
  <div
    class="main-container flex flex-col h-[100vh] border-2 border-red-500"
    :class="{ resizing: isResizing }"
  >
    <SettingsPageHeader />
    <div class="flex grow">
      <div :style="{ width: `${treeAreaWidth}px` }">
        <TreeView />
      </div>
      <div class="separator" :class="{ resizing: isResizing }" @mousedown="isResizing = true"></div>
      <div>CONTEST!</div>
    </div>
  </div>
</template>

<style scoped>
  .main-container.resizing {
    cursor: ew-resize;
  }
  .separator {
    width: 10px;
    background: gray;
  }
  .separator:hover,
  .separator.resizing {
    background: blue;
    cursor: ew-resize;
  }
</style>
