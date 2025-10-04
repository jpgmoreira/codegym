<script lang="ts" setup>
  import { onMounted, ref } from 'vue';
  import './lib/jquery-3.7.1.min.js';
  import './lib/jstree.min.js';
  import './lib/themes/default-dark/style.min.css';

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
        data: [
          { text: 'Pasta A', children: [{ text: 'Arquivo 1' }, { text: 'Arquivo 2' }] },
          { text: 'Pasta B', children: [{ text: 'Arquivo 3' }] },
        ],
      },
    });
    $(tree.value).on('select_node.jstree', (e: any, data: any) => {
      console.log('Selecionado:', data.node.text);
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
    width: 300px;
    padding: 8px;
  }
</style>
