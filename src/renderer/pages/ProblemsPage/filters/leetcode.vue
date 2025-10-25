<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['leetcode'].filters);
</script>

<template>
  <div>
    <div>
      <div class="flex items-center">
        <label class="pr-1.5">Popularity:</label>
        <div>
          <input
            type="number"
            placeholder="min"
            v-model="filters.popularity.min"
            @change="onChange"
          />
          <input
            type="number"
            placeholder="max"
            v-model="filters.popularity.max"
            @change="onChange"
          />
        </div>
      </div>
    </div>
    <div class="flex items-center mt-2">
      <label class="pr-1.5">Premium:</label>
      <select @change="onChange" v-model="filters.premium.value">
        <option value="both">Both</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    </div>
    <div class="flex items-center mt-2">
      <span class="pr-1.5">Difficulty:</span>
      <input
        type="checkbox"
        id="easy"
        name="easy"
        value="easy"
        v-model="filters.difficulty.values"
        @change="onChange"
      />
      <label class="mr-2 ml-0.5" for="easy">Easy</label>
      <input
        type="checkbox"
        id="medium"
        name="medium"
        value="medium"
        v-model="filters.difficulty.values"
        @change="onChange"
      />
      <label class="mr-2 ml-0.5" for="medium">Medium</label>
      <input
        type="checkbox"
        id="hard"
        name="hard"
        value="hard"
        v-model="filters.difficulty.values"
        @change="onChange"
      />
      <label class="ml-0.5" for="hard">Hard</label>
    </div>
  </div>
</template>
