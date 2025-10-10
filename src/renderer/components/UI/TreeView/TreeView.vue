<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { TreeChannels } from '@common/types/treeChannels';
  import { ref, onMounted, reactive, nextTick } from 'vue';
  import AutoLengthInput from '../AutoLengthInput.vue';
  import { GenericResponseDTO } from '@common/dto/genericResponseDTO';
  import { useUIStore } from '@renderer/store/ui';

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    activeDomNode: HTMLInputElement | null;
    x: number;
    y: number;
  };

  const uiStore = useUIStore();

  const hasLoaded = ref(false);
  const tree = ref<TreeOperationResponseDTO | null>(null);
  const contextState = reactive<ContextState>({
    type: 'root',
    visible: false,
    activeNode: null,
    activeDomNode: null,
    x: 0,
    y: 0,
  });

  const renamingNode = ref<Node | null>(null);
  const originalName = ref('');

  function showContextMenu(type: ContextState['type'], targetNode: Node | null, e: MouseEvent) {
    contextState.visible = true;
    contextState.type = type;
    contextState.x = e.clientX;
    contextState.y = e.clientY;
    contextState.activeNode = targetNode;
    contextState.activeDomNode = e.target as HTMLInputElement;
  }

  async function createNode(type: NodeType) {
    const node = contextState.activeNode;
    const parentId = node ? node.id : null;
    const prefix = type === 'dir' ? 'Folder' : 'Contest';
    tree.value = await window.api.invoke(TreeChannels.createNode, 0, type, prefix, parentId);
  }

  async function toggleDirOpen(node: Node) {
    tree.value = await window.api.invoke(TreeChannels.toggleDirOpen, 0, node.id);
  }

  function startRenaming() {
    const node = contextState.activeNode;
    if (!node) return;
    originalName.value = node.text.trim();
    renamingNode.value = node;
    contextState.activeDomNode?.focus();
    contextState.activeDomNode?.select();
  }

  async function applyRenaming() {
    const node = renamingNode.value;
    if (!node) return;
    const newName = node.text.trim();
    if (!newName) {
      uiStore.showToast('Name cannot be empty!', 'error');
      node.text = originalName.value;
    } else if (newName !== originalName.value) {
      const result = await window.api.invoke<GenericResponseDTO>(
        TreeChannels.renameNode,
        node.id,
        newName
      );
      if (result.status === 'error') {
        uiStore.showToast(result.errorMsg, 'error');
        node.text = originalName.value;
      }
    }
    renamingNode.value = null;
    nextTick(() => {
      contextState.activeDomNode?.focus();
      contextState.activeDomNode?.blur();
    });
  }

  function undoRenaming() {
    if (!renamingNode.value) return;
    renamingNode.value.text = originalName.value;
    renamingNode.value = null;
    nextTick(() => {
      contextState.activeDomNode?.focus();
      contextState.activeDomNode?.blur();
    });
  }

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
    hasLoaded.value = true;
  });
</script>

<template>
  <div>Total nodes: {{ tree?.nTotalNodes }}</div>
  <div>Selected nodes: {{ tree?.nSelectedNodes }}</div>
  <div>Selected files: {{ tree?.nSelectedFiles }}</div>
  <div
    v-if="hasLoaded"
    class="border-2 border-violet-500 relative overflow-auto h-full z-0"
    @click.right="(e) => showContextMenu('root', null, e)"
  >
    <ContextMenu
      class="z-20"
      :tree="tree"
      v-bind="contextState"
      @create-node="createNode"
      @rename-node="startRenaming"
    />
    <div
      v-if="!tree?.visibleNodes.length"
      class="absolute-center whitespace-nowrap text-lg opacity-70"
    >
      Right-click here
    </div>
    <div v-else class="absolute top-0 left-0 w-full z-10">
      <div
        v-for="node in tree.visibleNodes"
        :style="{ paddingLeft: `${node.depth * 20}px` }"
        :key="node.id"
      >
        <span v-if="node.type === 'dir'" @click="toggleDirOpen(node)">
          <span v-if="node.open">-</span>
          <span v-else>+</span>
        </span>

        <AutoLengthInput
          v-model="node.text"
          :readonly="renamingNode !== node"
          @keydown.enter="applyRenaming"
          @keydown.esc="undoRenaming"
          @blur="applyRenaming"
          @click.right.stop="(e: MouseEvent) => showContextMenu(node.type, node, e)"
        />
      </div>
    </div>
  </div>
</template>
