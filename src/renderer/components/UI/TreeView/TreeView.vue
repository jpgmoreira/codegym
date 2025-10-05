<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { useContestsStore } from '@renderer/store/contests.js';
  import './lib/jquery-3.7.1.min.js';
  import './lib/jstree.min.js';
  import './lib/themes/default-dark/style.min.css';
  const contestsStore = useContestsStore();

  const tree = ref<HTMLDivElement | null>(null);

  const data = computed(() => contestsStore.contestsTree.data);

  onMounted(() => {
    const $ = (window as any).jQuery;
    if (!tree.value || !$) return;
    $(tree.value).jstree({
      core: {
        themes: {
          name: 'default-dark',
          dots: true,
          icons: true,
        },
        data: contestsStore.contestsTree.data,
      },
    });
  });
</script>

<template>
  <div class="tree-container flex">
    <div ref="tree"></div>
    <div v-if="!data.length" class="grow overflow-hidden relative">
      <div
        class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] text-lg opacity-70 whitespace-nowrap select-none"
      >
        Right-click here
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 2px solid red;
  }
</style>
