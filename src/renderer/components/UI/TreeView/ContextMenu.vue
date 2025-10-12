<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType } from '@common/types/tree';
  import { ref, watch, computed } from 'vue';

  export type ContextProps = {
    tree: TreeOperationResponseDTO | null;
    visible: boolean;
    type: NodeType | 'root';
    nSelectedNodes: number;
    nOpenDirs: number;
    searchText: string;
    x: number;
    y: number;
  };

  const emit = defineEmits<{
    (e: 'createNode', type: NodeType): void;
    (e: 'createNodeAbove', type: NodeType): void;
    (e: 'createNodeBelow', type: NodeType): void;
    (e: 'renameNode'): void;
    (e: 'deleteNode'): void;
    (e: 'deleteSelectedNodes'): void;
    (e: 'collapseAll'): void;
  }>();

  const props = defineProps<ContextProps>();

  const style = ref<Record<string, string>>({});

  const isSearching = computed(() => props.searchText.trim());

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
      <div v-if="!isSearching" @click="emit('createNode', 'file')">New contest</div>
      <div v-if="!isSearching" @click="emit('createNode', 'dir')">New folder</div>
      <div v-if="props.nSelectedNodes" @click="emit('deleteSelectedNodes')">Delete selected</div>
      <div v-if="props.nOpenDirs" @click="emit('collapseAll')">Collapse all</div>
    </div>
    <div v-else-if="props.type === 'dir'">
      <div v-if="!isSearching" @click="emit('createNode', 'file')">New contest</div>
      <div v-if="!isSearching" @click="emit('createNode', 'dir')">New folder</div>
      <div v-if="!isSearching" @click="emit('createNodeAbove', 'dir')">Create folder above</div>
      <div v-if="!isSearching" @click="emit('createNodeBelow', 'dir')">Create folder below</div>
      <div @click="emit('renameNode')">Rename</div>
      <div v-if="!isSearching" @click="emit('deleteNode')">Delete</div>
    </div>
    <div v-else-if="props.type === 'file'">
      <div v-if="!isSearching" @click="emit('createNodeAbove', 'file')">Create file above</div>
      <div v-if="!isSearching" @click="emit('createNodeBelow', 'file')">Create file below</div>
      <div @click="emit('renameNode')">Rename</div>
      <div @click="emit('deleteNode')">Delete</div>
    </div>
  </div>
</template>
