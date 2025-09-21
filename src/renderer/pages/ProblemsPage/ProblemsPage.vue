<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjStatusStore } from '@renderer/store/ojStatus';
  import ProblemsPageHeader from '@renderer/components/Header/custom/ProblemsPageHeader.vue';
  import BusyButton from '@renderer/components/UI/BusyButton.vue';
  import Filters from './Filters.vue';
  import Snapshot from './Snapshot.vue';
  const profileStore = useProfileStore();
  const ojStatusStore = useOjStatusStore();
  const currOj = computed(() => profileStore.currProfile!.currOj);
  const ojContext = computed(() => profileStore.currProfile!.ojContext);
  const snapshot = computed(() => ojContext.value[currOj.value].snapshot);
  const isRequestingProblem = computed(() => ojStatusStore[currOj.value].isRequestingProblem);
  const isUpdatingCache = computed(() => ojStatusStore[currOj.value].isUpdatingCache);
  const isBusy = ref(isRequestingProblem.value || isUpdatingCache.value);
  const isSolved = ref(Boolean(snapshot.value?.solvedDate));
  const btnText = computed(() => {
    if (isBusy.value && isUpdatingCache.value) return 'Updating cache';
    return 'New problem';
  });
  function handleNewProblemClick() {
    profileStore.requestNewProblem();
  }
  function handleSolvedChange(event: Event) {
    if (!event.target) return;
    profileStore.setCurrSnapshotSolved((event.target as HTMLInputElement).checked);
  }
  watch(snapshot, (newSnapshot) => {
    isSolved.value = Boolean(newSnapshot?.solvedDate);
  });
</script>

<template>
  <ProblemsPageHeader />
  <div class="flex flex-col flex-1 problems-page">
    <Snapshot
      class="rounded-md m-1 mb-0 flex-1"
      :curr-oj="currOj"
      :oj-context="ojContext"
      :snapshot="snapshot"
    />
    <Filters class="rounded-md m-1 flex-1" :curr-oj="currOj" :oj-context="ojContext" />
  </div>
  <footer class="mt-auto w-full flex justify-around py-1.5">
    <BusyButton
      class="flex items-center btn-primary"
      @click="handleNewProblemClick"
      :busy-signal="isRequestingProblem || isUpdatingCache"
      v-model="isBusy"
    >
      {{ btnText }}
      <span v-if="isBusy" class="loader ml-1"></span>
    </BusyButton>
    <div class="my-auto flex items-center">
      <label for="solved-checkbox" class="pr-2">Solved?</label>
      <input
        type="checkbox"
        id="solved-checkbox"
        name="solved-checkbox"
        :disabled="!snapshot"
        @change="handleSolvedChange"
        v-model="isSolved"
      />
    </div>
  </footer>
</template>

<style scoped>
  footer {
    background-color: var(--footer-bg);
  }
</style>
