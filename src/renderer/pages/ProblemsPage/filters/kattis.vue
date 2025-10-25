<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  const store = useProfileStore();
  function onChange() {
    store.updateOjFilters();
  }
  const filters = computed(() => store.currProfile!.ojContext['kattis'].filters);
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
      <div class="flex items-center pr-1.5">
        <label>Popularity</label>
        <span class="popularity-info-icon mx-0.5 cursor-pointer relative">
          <span class="tooltip absolute left-full top-0">
            All problems sorted from most solved to least solved, divided in groups of 20.
          </span>
        </span>
        <span>:</span>
      </div>
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
    <div class="flex items-center mt-2">
      <label class="pr-1.5" for="starred">Starred:</label>
      <input
        type="checkbox"
        id="starred"
        name="starred"
        v-model="filters.starred.value"
        @change="onChange"
      />
    </div>
  </div>
</template>
