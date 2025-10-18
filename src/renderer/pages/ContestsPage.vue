<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
  import { Contest, ContestProblem } from '@common/schemas/contests';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import AutoHeightTextArea from '@renderer/components/UI/AutoHeightTextArea.vue';
  import { Channels } from '@common/types/channels';

  const store = useProfileStore();

  const treeAreaWidth = ref(300);
  const contestsAreaWidth = ref(window.innerWidth - 300);
  const isResizing = ref(false);

  const contest = ref<Contest | null>(null);
  const loaded = ref(false);

  const currContestId = computed(() => store.currProfile?.currContestId);

  const sortedContestProblems = computed(() => {
    if (contest.value && contest.value.problems.length) {
      return contest.value.problems.sort(compareProblems);
    }
    return [];
  });

  function compareProblems(a: ContestProblem, b: ContestProblem) {
    const numA = Number(a.accepted);
    const numB = Number(b.accepted);
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);
    if (isNumA && isNumB) return numB - numA;
    else if (isNumA) return -1;
    else if (isNumB) return 1;
    return 0;
  }

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

  async function addProblem() {
    const problem = await window.api.invoke<ContestProblem>(Channels.addCurrContestProblem);
    contest.value?.problems.push(problem);
  }

  function acceptedInputChange(problem: ContestProblem, e: Event) {
    problem.accepted = (e.target as HTMLInputElement).value.trim();
  }

  function acceptedInputKeydown(e: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
    ];
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
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
        <div class="w-full overflow-auto flex flex-col" v-else-if="loaded && contest">
          <section class="header-section px-3 py-1">
            <div>
              Contest:
              <strong>{{ contest.name }}</strong>
            </div>
            <div class="flex whitespace-nowrap items-center justify-between">
              <div class="truncate">
                Created at:
                <strong>{{ parseTimestamp(contest.createdAt) }}</strong>
              </div>
              <button type="button" class="btn-primary btn-small" @click="addProblem">
                Add problem
              </button>
            </div>
          </section>
          <div v-if="contest.problems.length" class="pb-20">
            <AutoHeightTextArea placeholder="Contest notes" class="p-1" :min-height="80" />
            <table class="w-full">
              <colgroup>
                <col class="col-problem" />
                <col class="col-accepted" />
                <col class="col-notes" />
              </colgroup>
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>#Accepted</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="problem in sortedContestProblems" :key="problem.id" class="no-hover">
                  <td class="font-bold">
                    <input type="text" v-model="problem.title" />
                  </td>
                  <td>
                    <input
                      type="text"
                      :value="problem.accepted"
                      @change="(e: Event) => acceptedInputChange(problem, e)"
                      @keydown="acceptedInputKeydown"
                    />
                  </td>
                  <td>
                    <AutoHeightTextArea class="p-1" v-model="problem.notes" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="flex grow items-center justify-center text-lg opacity-70">
            Add a new problem
          </div>
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
  td {
    height: 1px;
    padding: 0;
    margin: 0;
  }
  tbody tr:hover {
    background-color: auto;
  }
  input[type='text'] {
    height: 100%;
    width: 100%;
    border-radius: 0;
    text-align: center;
  }
  .col-problem {
    width: 30%;
  }
  .col-accepted {
    width: 15%;
  }
</style>
