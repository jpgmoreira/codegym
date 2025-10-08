<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType } from '@common/types/tree';

  export type ContextProps = {
    tree: TreeOperationResponseDTO | null;
    visible: boolean;
    type: NodeType | 'root';
    x: number;
    y: number;
  };

  const props = defineProps<ContextProps>();

  function computeContextStyle() {}
</script>

<template></template>
