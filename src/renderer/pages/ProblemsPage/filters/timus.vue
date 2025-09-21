<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['timus'].filters);
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Difficulty:</label>
      <div>
        <input
          type="number"
          placeholder="min"
          v-model="filters.difficulty.min"
          @change="onChange"
        />
        <input
          type="number"
          placeholder="max"
          v-model="filters.difficulty.max"
          @change="onChange"
        />
      </div>
    </div>
    <div class="flex items-center mt-2">
      <label class="pr-1.5">Solved bucket:</label>
      <div>
        <input
          type="number"
          placeholder="min"
          v-model="filters.solvedBucket.min"
          @change="onChange"
        />
        <input
          type="number"
          placeholder="max"
          v-model="filters.solvedBucket.max"
          @change="onChange"
        />
      </div>
    </div>
  </div>
</template>
