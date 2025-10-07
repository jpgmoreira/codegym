<script lang="ts" setup>
  import ProblemsPageHeader from '@renderer/components/Header/custom/ProblemsPageHeader.vue';
  import { FetchHistoryPageResponseDTO } from '@common/dto/fetchHistoryPageResponseDTO';
  import { OjProblem } from '@common/schemas/problems';
  import { Channels } from '@common/types/channels';
  import { Oj } from '@common/types/oj';
  import { useProfileStore } from '@renderer/store/profile';
  import { handleProblemClick } from '@renderer/utils/utils';
  import { useRouter } from 'vue-router';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import { ref, onMounted, computed, watch } from 'vue';

  const router = useRouter();
  const profileStore = useProfileStore();
  const problems = ref<OjProblem[Oj][]>([]);
  const total = ref(0);
  const top = ref(0);
  const loaded = ref(false);

  const currOj = computed(() => profileStore.currProfile!.currOj);

  async function fetchHistory() {
    const result = await window.api.invoke<FetchHistoryPageResponseDTO<typeof currOj.value>>(
      Channels.fetchHistoryPage,
      currOj.value,
      top.value
    );
    problems.value = result.data;
    total.value = result.total;
  }

  function handleClick(problem: OjProblem[Oj]) {
    handleProblemClick(problem);
    profileStore.setCurrOjSnapshot(problem);
    router.replace('/problems');
  }

  const tableContainerStyle = computed(() => ({ height: `${total.value * 40}px` }));

  onMounted(async () => {
    await fetchHistory();
    loaded.value = true;
  });

  watch(currOj, fetchHistory, { immediate: true });
</script>

<template>
  <div class="flex flex-col h-[100vh]">
    <ProblemsPageHeader />
    <div v-if="loaded" class="grow relative">
      <div v-if="!problems.length" class="absolute-center text-xl opacity-70">
        No history for this Online Judge
      </div>
      <div v-else :style="tableContainerStyle">
        <table class="w-full">
          <thead class="sticky top-0">
            <tr>
              <th>#</th>
              <th>Problem</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(problem, index) in problems" :key="problem.id">
              <td>{{ index + top + 1 }}</td>
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
      </div>
    </div>
  </div>
</template>

<style scoped>
  tr {
    white-space: nowrap;
    height: 40px;
  }
</style>
