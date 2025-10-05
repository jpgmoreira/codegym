<script lang="ts" setup>
  import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import { useContestsStore } from '@renderer/store/contests';
  const contestsStore = useContestsStore();

  const treeViewWidth = ref(200);
  const isResizing = ref(false);

  const contest = computed(() => contestsStore.currContest);

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    const minWidth = 20;
    const maxWidth = window.innerWidth - 20;
    treeViewWidth.value = Math.max(minWidth, Math.min(e.clientX, maxWidth));
  }
  function windowMouseUp() {
    isResizing.value = false;
  }

  watch(isResizing, (newValue) => {
    if (newValue) document.body.style.cursor = 'col-resize';
    else document.body.style.cursor = 'default';
  });

  onMounted(() => {
    window.addEventListener('mousemove', windowMouseMove);
    window.addEventListener('mouseup', windowMouseUp);
  });
  onUnmounted(() => {
    window.removeEventListener('mousemove', windowMouseMove);
    window.removeEventListener('mouseup', windowMouseUp);
  });
</script>

<template>
  <div class="h-[100vh] flex flex-col">
    <SettingsPageHeader />
    <div class="grow flex border-2 border-orange-400 overflow-hidden">
      <!-- TreeView area -->
      <div class="flex" :style="{ width: `${treeViewWidth}px` }">
        <TreeView class="grow" />
      </div>
      <div class="resizer" @mousedown="isResizing = true" :class="{ hover: isResizing }"></div>
      <!-- Contest area -->
      <div class="border-2 border-cyan-300 grow flex">
        <div v-if="contest">CONTEST!</div>
        <div v-else class="grow overflow-hidden relative">
          <div
            class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] text-2xl opacity-70 whitespace-nowrap select-none"
          >
            Create or select a contest
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .resizer {
    cursor: col-resize;
    width: 4px;
    background-color: gray;
  }
  .resizer:hover,
  .resizer.hover {
    background-color: blue;
  }
</style>
