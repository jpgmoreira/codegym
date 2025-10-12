<script lang="ts" setup>
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { ref, watch, computed } from 'vue';

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

  // Root sections
  const rootSections = computed(() => ({
    create: !props.isSearching,
    clear: nSelectedNodes.value > 0 || props.nOpenDirs > 0,
    delete: nSelectedNodes.value > 0,
  }));

  // Dir sections
  const dirSections = computed(() => ({
    create: !props.isSearching,
    move: Boolean(!props.activeNode?.selected && (props.nSelectedFolders || props.nSelectedFiles)),
    change: true,
  }));

  // File sections
  const fileSections = computed(() => ({
    create: !props.isSearching,
    move: Boolean(!props.activeNode?.selected && props.nSelectedFiles),
    change: true,
  }));

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
      <div v-if="rootSections.create">
        <div class="item" @click="emit('createNode', 'file')">New contest</div>
        <div class="item" @click="emit('createNode', 'dir')">New folder</div>
      </div>
      <div class="separator" v-if="rootSections.create && rootSections.clear"></div>
      <div v-if="rootSections.clear">
        <div class="item" v-if="nSelectedNodes" @click="emit('clearSelection')">
          Clear selection
        </div>
        <div class="item" v-if="props.nOpenDirs" @click="emit('collapseAll')">Collapse all</div>
      </div>
      <div
        class="separator"
        v-if="(rootSections.create || rootSections.clear) && rootSections.delete"
      ></div>
      <div v-if="rootSections.delete">
        <div class="item" @click="emit('deleteSelectedNodes')">Delete selected</div>
      </div>
    </div>

    <!-- Dir context -->
    <div v-else-if="props.type === 'dir'">
      <div v-if="dirSections.create">
        <div class="item" @click="emit('createNode', 'file')">New contest</div>
        <div class="item" @click="emit('createNode', 'dir')">New folder</div>
        <div class="item" @click="emit('createNodeAbove', 'dir')">Create folder above</div>
        <div class="item" @click="emit('createNodeBelow', 'dir')">Create folder below</div>
      </div>
      <div class="separator" v-if="dirSections.create && dirSections.move"></div>
      <div v-if="dirSections.move">
        <div v-if="props.nSelectedFolders" class="item">Move selected folders above</div>
        <div v-if="props.nSelectedFolders" class="item">Move selected folders below</div>
        <div class="item">Move selected nodes into</div>
      </div>
      <div
        class="separator"
        v-if="(dirSections.create || dirSections.move) && dirSections.change"
      ></div>
      <div v-if="dirSections.change">
        <div class="item" @click="emit('renameNode')">Rename</div>
        <div v-if="!isSearching" class="item" @click="emit('deleteNode')">Delete</div>
      </div>
    </div>

    <!-- File context -->
    <div v-else-if="props.type === 'file'">
      <div v-if="fileSections.create">
        <div class="item" @click="emit('createNodeAbove', 'file')">Create file above</div>
        <div class="item" @click="emit('createNodeBelow', 'file')">Create file below</div>
      </div>
      <div class="separator" v-if="fileSections.create && fileSections.move"></div>
      <div v-if="fileSections.move">
        <div class="item">Move selected files above</div>
        <div class="item">Move selected files below</div>
      </div>
      <div
        class="separator"
        v-if="(fileSections.create || fileSections.move) && fileSections.change"
      ></div>
      <div v-if="fileSections.change">
        <div class="item" @click="emit('renameNode')">Rename</div>
        <div class="item" @click="emit('deleteNode')">Delete</div>
      </div>
    </div>
  </div>
</template>
