<script lang="ts" setup>
  import { ref, computed, useTemplateRef, watch } from 'vue';
  import { Channels } from '@common/types/channels';
  import { OjProblem } from '@common/schemas/problems';
  import { Oj } from '@common/types/oj';
  import { useProfileStore } from '@renderer/store/profile';
  import { useHistoryStore } from '@renderer/store/history';
  import { useVisibleInterval } from '@renderer/composables/useVisibleInterval';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { handleProblemClick } from '@renderer/utils/utils';
  import { useRouter } from 'vue-router';
  import ProblemsPageHeader from '@renderer/components/Header/custom/ProblemsPageHeader.vue';
  type Direction = 'next' | 'prev';
  let firstPage = 0; // Number of the first page in the buffer.
  const maxPages = 3;
  const profileStore = useProfileStore();
  const historyStore = useHistoryStore();
  const router = useRouter();
  const pages = ref<OjProblem[Oj][][]>([]);
  const lastPage = ref<number | null>(null); // Number of the last page in the whole history;
  const firstProblemIndex = ref(0);
  const topSentinel = useTemplateRef('top-sentinel');
  const bottomSentinel = useTemplateRef('bottom-sentinel');
  const scrollContainer = useTemplateRef('scroll-container');
  const currOj = computed(() => profileStore.currProfile!.currOj);
  const flatPages = computed(() => pages.value.flat());
  let isFetching = false;
  async function fetchPage(direction: Direction) {
    if (isFetching) return;
    isFetching = true;
    await updatePageBuffer(direction);
    isFetching = false;
  }
  async function updatePageBuffer(direction: Direction) {
    if (firstPage <= 1 && direction === 'prev') return; // Stuck at the start.
    let page: number;
    if (direction === 'prev') page = firstPage - 1;
    else page = Math.max(1, firstPage + pages.value.length);
    if (lastPage.value !== null && page > lastPage.value) return; // Reached last page.
    let items: OjProblem[Oj][];
    if (page === 1) {
      items = historyStore.firstHistoryPages[currOj.value];
    } else {
      items = await window.api.invoke<OjProblem[Oj][]>(
        Channels.fetchHistoryPage,
        currOj.value,
        page
      );
    }
    if (!items.length) {
      // Stuck at the end.
      lastPage.value = page - 1;
      return;
    }
    if (direction === 'prev') {
      firstPage--;
      pages.value.unshift(items);
      pages.value.pop();
      firstProblemIndex.value -= items.length;
      const firstRow = scrollContainer.value!.querySelector('tbody tr:first-child')!;
      const prevTop = firstRow.getBoundingClientRect().top;
      requestAnimationFrame(() => {
        const newTop = firstRow.getBoundingClientRect().top;
        const diff = newTop - prevTop;
        scrollContainer.value!.scrollTop += diff;
      });
    } else {
      pages.value.push(items);
      if (!firstPage) firstPage = 1;
      if (pages.value.length > maxPages) {
        firstPage++;
        const removed = pages.value.shift();
        firstProblemIndex.value += removed!.length;
      }
    }
  }
  function handleClick(problem: OjProblem[Oj]) {
    handleProblemClick(problem);
    profileStore.setCurrOjSnapshot(problem);
    router.replace('/problems');
  }
  useVisibleInterval(topSentinel, () => fetchPage('prev'));
  useVisibleInterval(bottomSentinel, () => fetchPage('next'));
  watch(
    currOj,
    () => {
      pages.value = [];
      firstPage = 0;
      lastPage.value = null;
      firstProblemIndex.value = 0;
      if (scrollContainer.value) {
        scrollContainer.value.scrollTop = 0;
      }
      fetchPage('next');
    },
    { immediate: true }
  );
</script>

<template>
  <div class="flex flex-col h-[100vh]">
    <ProblemsPageHeader />
    <div v-if="lastPage !== 0" class="grow overflow-y-auto" ref="scroll-container">
      <div class="relative">
        <div class="top-sentinel absolute top-0 left-0 w-full" ref="top-sentinel"></div>
        <table class="w-full" :class="{ 'mb-20': lastPage }" v-show="flatPages.length">
          <thead class="sticky top-0">
            <tr>
              <th>#</th>
              <th>Problem</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(problem, index) in flatPages" :key="problem.id">
              <td>{{ index + firstProblemIndex + 1 }}</td>
              <td>
                <a href="#" @click="handleClick(problem)">
                  {{ problem.name || '\<no name available\>' }}
                </a>
                <span
                  v-if="problem.solvedDate !== null"
                  class="alert success inline-flex text-xs font-bold ml-2 px-1 py-0.5 rounded-md select-none"
                >
                  Solved
                </span>
              </td>
              <td>{{ parseTimestamp(problem.timestamp!) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="bottom-sentinel absolute bottom-0 left-0 w-full" ref="bottom-sentinel"></div>
      </div>
    </div>
    <div v-else class="flex grow text-2xl items-center justify-center">
      No history for this Online Judge
    </div>
  </div>
</template>

<style scoped>
  .top-sentinel,
  .bottom-sentinel {
    height: 150px;
    z-index: -1;
  }
</style>
