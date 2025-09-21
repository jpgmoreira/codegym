<script lang="ts" setup>
  import { computed } from 'vue';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { useProfileStore } from '@renderer/store/profile';
  import Multiselect, { MultiselectOption } from '@renderer/components/UI/Multiselect.vue';
  const ojMetaStore = useOjMetaStore();
  const profileStore = useProfileStore();
  const ojContext = computed(() => profileStore.currProfile!.ojContext);
  const filters = computed(() => ojContext.value['cf'].filters);
  const tagsOptions = computed<MultiselectOption[]>(() => {
    const result: MultiselectOption[] = [];
    ojMetaStore['cf']?.tags.forEach((tag) => {
      result.push({
        text: tag,
        value: tag,
      });
    });
    return result;
  });
  const selectedTags = computed(() => ojContext.value['cf'].filters.tags.values);
  function onChange() {
    profileStore.updateOjFilters();
  }
  function handleSelectTag(value: string) {
    ojContext.value['cf'].filters.tags.values.push(value);
    profileStore.updateOjFilters();
  }
  function handleDeselectTag(value: string) {
    const currTags = ojContext.value['cf'].filters.tags.values;
    ojContext.value['cf'].filters.tags.values = currTags.filter((tag) => tag !== value);
    profileStore.updateOjFilters();
  }
</script>

<template>
  <div>
    <div class="flex items-center">
      <label class="pr-1.5">Rating:</label>
      <div>
        <input type="number" placeholder="min" v-model="filters.rating.min" @change="onChange" />
        <input type="number" placeholder="max" v-model="filters.rating.max" @change="onChange" />
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
    <Multiselect
      class="mt-2"
      :options="tagsOptions"
      :selected="selectedTags"
      @select-option="handleSelectTag"
      @deselect-option="handleDeselectTag"
      close
      placeholder="Tags"
      direction="up"
    />
  </div>
</template>
