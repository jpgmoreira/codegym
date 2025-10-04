<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import { useContestsStore } from '@renderer/store/contests.js';
  import './lib/jquery-3.7.1.min.js';
  import './lib/jstree.min.js';
  import './lib/themes/default-dark/style.min.css';
  const contestsStore = useContestsStore();

  const tree = ref<HTMLDivElement | null>(null);

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
  <div class="tree-container">
    <div ref="tree"></div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 2px solid red;
  }
</style>
