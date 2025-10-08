<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { TreeChannels } from '@common/types/treeChannels';
  import { ref, onMounted } from 'vue';
  const tree = ref<TreeOperationResponseDTO | null>(null);

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
  });
</script>

<template>TreeView!</template>
