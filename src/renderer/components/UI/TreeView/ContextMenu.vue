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

  const emit = defineEmits<{
    (e: 'createNode', type: NodeType): void;
    (e: 'renameNode'): void;
    (e: 'deleteNode'): void;
  }>();

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
  <div class="fixed" v-if="props.visible" :style="style">
    <div v-if="props.type === 'root'">
      <div @click="emit('createNode', 'file')">New contest</div>
      <div @click="emit('createNode', 'dir')">New folder</div>
    </div>
    <div v-else-if="props.type === 'dir'">
      <div @click="emit('createNode', 'file')">New contest</div>
      <div @click="emit('createNode', 'dir')">New folder</div>
      <div @click="emit('renameNode')">Rename</div>
      <div @click="emit('deleteNode')">Delete</div>
    </div>
    <div v-else-if="props.type === 'file'">
      <div @click="emit('renameNode')">Rename</div>
      <div @click="emit('deleteNode')">Delete</div>
    </div>
  </div>
</template>
