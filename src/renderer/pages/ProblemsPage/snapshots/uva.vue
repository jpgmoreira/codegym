<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  import star from '@renderer/assets/images/star.svg';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['uva'].snapshot!);
  const meta = computed(() => ojMetaStore.ojMeta['uva']);
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Distinct users accepted:
        <span class="font-bold">{{ toLocaleNumber(snapshot.info.dacu) }}.</span>
      </li>
      <li>
        Solved bucket:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.info.solvedBucket) }} of
          {{ toLocaleNumber(meta.stats.solvedBucket.max!) }}.
        </span>
      </li>
      <div v-if="snapshot.info.starred">
        <img :src="star" class="star" />
      </div>
    </ul>
  </div>
</template>

<style scoped>
  .star {
    width: 38px;
  }
</style>
