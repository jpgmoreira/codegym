<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import { Contest } from '@common/schemas/contests';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';

  const store = useProfileStore();

  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  const isResizing = ref(false);

  const contest = ref<Contest | null>(null);
  const loaded = ref(false);

  const currContestId = computed(() => store.currProfile?.currContestId);

  function handleSetActive(contestId: string) {
    store.setCurrContest(contestId);
  }

  function handleRename(contestId: string, newName: string) {
    newName = newName.trim();
    if (contest.value?.id === contestId) {
      contest.value.name = newName;
    }
  }

  function handleDeleteContest(contestId: string) {
    if (contest.value?.id === contestId) {
      contest.value = null;
      store.setCurrContest(null);
    }
  }

  async function handleDeleteSelectedContests() {
    contest.value = await store.getCurrContest();
  }

  function windowMouseUp() {
    isResizing.value = false;
  }

  function windowMouseMove(e: MouseEvent) {
    if (!isResizing.value) return;
    treeAreaWidth.value = e.clientX;
    contestsAreaWidth.value = window.innerWidth - e.clientX;
    window.getSelection()?.removeAllRanges();
  }

  watch(
    currContestId,
    async () => {
      contest.value = await store.getCurrContest();
      loaded.value = true;
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
        <TreeView
          class="select-none"
          files-hint
          search
          file-icon
          @set-active="handleSetActive"
          @rename="handleRename"
          @delete-contest="handleDeleteContest"
          @delete-selected-contests="handleDeleteSelectedContests"
        />
      </div>
      <div
        class="separator shrink-0"
        :class="{ resizing: isResizing }"
        @mousedown="isResizing = true"
      ></div>
      <div class="flex grow" :style="{ width: `${contestsAreaWidth}px` }">
        <div
          v-if="loaded && !contest"
          class="flex grow items-center justify-center overflow-hidden select-none"
        >
          <span class="text-xl opacity-70 whitespace-nowrap">Create or select a contest</span>
        </div>
        <div class="border border-red-400 w-full overflow-auto" v-else-if="loaded && contest">
          <section class="px-3 py-1">
            <div>
              Contest:
              <strong>{{ contest.name }}</strong>
            </div>
            <div class="flex whitespace-nowrap items-center justify-between">
              <div class="truncate">
                Created at:
                <strong>{{ parseTimestamp(contest.createdAt) }}</strong>
              </div>
              <button type="button" class="btn-primary btn-small">Add problem</button>
            </div>
          </section>
        </div>
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
