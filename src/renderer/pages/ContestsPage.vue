<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import { Contest } from '@common/schemas/contests';
  import { useProfileStore } from '@renderer/store/profile';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';

  const store = useProfileStore();

  const treeAreaWidth = ref(300);
  const isResizing = ref(false);

  const contest = ref<Contest | null>(null);

  const currContestId = computed(() => store.currProfile?.currContestId);

  function windowMouseUp() {
    isResizing.value = false;
  }

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
  }

  watch(
    currContestId,
    async () => {
      contest.value = await store.getCurrContest();
    },
    { immediate: true }
  );
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
    class="contests-page main-container flex flex-col h-[100vh]"
    :class="{ resizing: isResizing }"
  >
    <SettingsPageHeader />
    <div class="flex grow">
      <div :style="{ width: `${treeAreaWidth}px` }">
        <TreeView class="select-none" files-hint search file-icon />
      </div>
      <div class="separator" :class="{ resizing: isResizing }" @mousedown="isResizing = true"></div>
      <div v-if="!contest" class="flex grow items-center justify-center">
        <span class="text-xl opacity-70">Create or select a contest</span>
      </div>
      <div v-else>
        {{ contest.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main-container.resizing {
    cursor: ew-resize;
  }
  .separator {
    width: 5px;
    background: gray;
  }
  .separator:hover,
  .separator.resizing {
    background: #007bd1;
    cursor: ew-resize;
  }
</style>
