<script lang="ts" setup>
  import { ref, onMounted, onBeforeUnmount, watch, computed, toRaw } from 'vue';
  import { Contest, ContestProblem } from '@common/schemas/contests';
  import { useProfileStore } from '@renderer/store/profile';
  import { parseTimestamp } from '@common/utils/dateUtils';
  import TreeView from '@renderer/components/UI/TreeView/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
  import { Channels } from '@common/types/channels';
  import solved from '@renderer/assets/images/solved.png';
  import todo from '@renderer/assets/images/to-do-list.png';
  import trash from '@renderer/assets/images/trash.png';
  import star from '@renderer/assets/images/star.png';

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

  async function addProblem() {
    const problem = await window.api.invoke<ContestProblem>(Channels.addCurrContestProblem);
    contest.value?.problems.push(problem);
  }

  function updateContestNotes() {
    if (!contest.value) return;
    window.api.send(Channels.updateCurrContestNotes, contest.value.notes);
  }

  function updateCurrContestProblem(problem: ContestProblem) {
    window.api.send(Channels.updateCurrContestProblem, toRaw(problem));
  }

  function acceptedInputChange(problem: ContestProblem, e: Event) {
    problem.accepted = (e.target as HTMLInputElement).value.trim();
    updateCurrContestProblem(problem);
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
        <TreeView class="select-none" files-hint search file-icon :contest="contest" />
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
            <textarea
              placeholder="Contest notes"
              class="p-1 contest-notes"
              v-model="contest.notes"
              @change="updateContestNotes"
            ></textarea>
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
                <tr
                  v-for="problem in sortedContestProblems"
                  :key="problem.id"
                  class="no-hover problem-tr"
                  :class="{
                    todo: problem.todo,
                    solved: problem.solved,
                    favorite: problem.favorite,
                  }"
                >
                  <td class="font-bold relative">
                    <input
                      class="absolute top-0 bottom-0 left-0 right-0 z-0"
                      type="text"
                      v-model="problem.title"
                      @change="updateCurrContestProblem(problem)"
                    />
                    <span class="absolute icon solved z-10">
                      <img :src="solved" />
                    </span>
                    <span class="absolute icon todo z-10">
                      <img :src="todo" />
                    </span>
                    <span class="absolute icon favorite z-10">
                      <img :src="star" />
                    </span>
                    <span class="absolute icon trash z-10">
                      <img :src="trash" />
                      <span class="tooltip select-none absolute">Double-click to delete</span>
                    </span>
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
                    <textarea
                      class="p-1 problem-notes"
                      v-model="problem.notes"
                      @change="updateCurrContestProblem(problem)"
                    ></textarea>
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
    padding: 0;
    margin: 0;
    height: 45px;
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
  textarea {
    field-sizing: content; /** CSS experimental. Should work fine on current electron versions. */
    resize: none;
    display: block;
    width: 100%;
  }
  .contest-notes {
    min-height: 100px;
    max-height: 300px;
  }
  .problem-notes {
    height: 100%;
    max-height: 200px;
  }
  .icon img {
    width: 23px;
    height: 23px;
  }
  .icon {
    bottom: 2px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease;
    cursor: pointer;
  }
  .problem-tr:hover .icon {
    visibility: visible;
    opacity: 0.5;
  }
  .problem-tr.todo .icon.todo,
  .problem-tr.solved .icon.solved,
  .problem-tr.favorite .icon.favorite {
    visibility: visible;
    opacity: 1;
  }
  .icon:hover {
    opacity: 1 !important;
  }
  .icon.solved {
    right: 5px;
  }
  .icon.todo {
    right: calc(5px + 23px + 3px);
  }
  .icon.favorite {
    right: calc(5px + 23px + 3px + 23px + 3px);
  }
  .icon.trash {
    left: 5px;
  }
  .tooltip {
    visibility: hidden;
    width: 80px;
    top: calc(100% + 3px);
  }
  .icon:hover .tooltip {
    visibility: visible;
  }
</style>
