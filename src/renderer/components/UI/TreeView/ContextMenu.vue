<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType } from '@common/types/tree';
  import { ref, watch } from 'vue';

  export type ContextProps = {
    tree: TreeOperationResponseDTO | null;
    visible: boolean;
    type: NodeType | 'root';
    x: number;
    y: number;
  };

  const props = defineProps<ContextProps>();

  const style = ref<Record<string, string>>({});

  function computeContextStyle() {
    style.value = {};
    const diffY = window.innerHeight - props.y;
    if (diffY > 100) style.value.top = `${props.y}px`;
    else style.value.bottom = `${diffY}px`;
    style.value.left = `${props.x}px`;
  }

  watch(props, () => {
    if (props.visible) computeContextStyle();
  });
</script>

<template>
  <div class="fixed" v-if="props.visible" :style="style">AAAA</div>
</template>
