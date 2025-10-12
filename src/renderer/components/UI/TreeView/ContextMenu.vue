<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { ref, watch, computed, reactive } from 'vue';

  export type ContextProps = {
    tree: TreeOperationResponseDTO | null;
    visible: boolean;
    type: NodeType | 'root';
    nSelectedFolders: number;
    nSelectedFiles: number;
    nOpenDirs: number;
    isSearching: boolean;
    activeNode: Node | null;
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
    (e: 'clearSelection'): void;
    (e: 'collapseAll'): void;
  }>();

  const props = defineProps<ContextProps>();
  const style = ref<Record<string, string>>({});

  const nSelectedNodes = computed(() => props.nSelectedFiles + props.nSelectedFolders);

  const rootSections = reactive({
    newNode: !props.isSearching,
    clear: Boolean(nSelectedNodes || props.nOpenDirs),
    delete: Boolean(nSelectedNodes),
  });

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
  <div class="fixed context-menu" v-if="props.visible" :style="style">
    <!-- Root context -->
    <div v-if="props.type === 'root'">
      <div v-if="rootSections.newNode">
        <div class="item" @click="emit('createNode', 'file')">New contest</div>
        <div class="item" @click="emit('createNode', 'dir')">New folder</div>
      </div>
      <div v-if="rootSections.clear">
        <div class="item" v-if="nSelectedNodes" @click="emit('clearSelection')">
          Clear selection
        </div>
        <div class="item" v-if="props.nOpenDirs" @click="emit('collapseAll')">Collapse all</div>
      </div>
      <div v-if="rootSections.delete">
        <div class="item" v-if="nSelectedNodes" @click="emit('deleteSelectedNodes')">
          Delete selected
        </div>
      </div>
    </div>

    <!-- Dir context -->
    <div v-else-if="props.type === 'dir'">
      <div class="item" v-if="!isSearching" @click="emit('createNode', 'file')">New contest</div>
      <div class="item" v-if="!isSearching" @click="emit('createNode', 'dir')">New folder</div>

      <div class="item" v-if="!isSearching" @click="emit('createNodeAbove', 'dir')">
        Create folder above
      </div>
      <div class="item" v-if="!isSearching" @click="emit('createNodeBelow', 'dir')">
        Create folder below
      </div>

      <div
        class="item"
        v-if="
          props.activeNode && !props.activeNode.selected && !isSearching && props.nSelectedFolders
        "
      >
        Create folder below
      </div>

      <div class="item" @click="emit('renameNode')">Rename</div>
      <div class="item" v-if="!isSearching" @click="emit('deleteNode')">Delete</div>
    </div>

    <!-- File context -->
    <div v-else-if="props.type === 'file'">
      <div class="item" v-if="!isSearching" @click="emit('createNodeAbove', 'file')">
        Create file above
      </div>
      <div class="item" v-if="!isSearching" @click="emit('createNodeBelow', 'file')">
        Create file below
      </div>

      <div class="item" @click="emit('renameNode')">Rename</div>
      <div class="item" @click="emit('deleteNode')">Delete</div>
    </div>
  </div>
</template>
