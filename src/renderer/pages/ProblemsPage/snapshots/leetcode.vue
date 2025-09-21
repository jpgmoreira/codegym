<script lang="ts" setup>
  import { computed } from 'vue';
  import { useProfileStore } from '@renderer/store/profile';
  import { useOjMetaStore } from '@renderer/store/ojMeta';
  import { toLocaleNumber } from '@common/utils/utils';
  const profileStore = useProfileStore();
  const ojMetaStore = useOjMetaStore();
  const snapshot = computed(() => profileStore.currProfile!.ojContext['leetcode'].snapshot!);
  const meta = computed(() => ojMetaStore['leetcode']);
  const difficultyList = ['Easy', 'Medium', 'Hard'];
</script>

<template>
  <div>
    <ul class="list-disc list-inside">
      <li>
        Accepted:
        <span class="font-bold">{{ toLocaleNumber(snapshot.info.accepted) }}.</span>
      </li>
      <li>
        Submissions:
        <span class="font-bold">{{ toLocaleNumber(snapshot.info.submissions) }}.</span>
      </li>
      <li>
        Solved bucket:
        <span class="font-bold">
          {{ toLocaleNumber(snapshot.info.solvedBucket) }} of
          {{ toLocaleNumber(meta.stats.solvedBucket.max!) }}.
        </span>
      </li>
      <li>
        Difficulty:
        <span class="font-bold">{{ difficultyList[snapshot.info.difficulty - 1] }}.</span>
      </li>
      <li>
        Premium:
        <span class="font-bold">{{ snapshot.info.premium ? 'Yes' : 'No' }}.</span>
      </li>
    </ul>
  </div>
</template>
