<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { TreeChannels } from '@common/types/treeChannels';
  import { ref, onMounted, reactive } from 'vue';

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    x: number;
    y: number;
  };

  const tree = ref<TreeOperationResponseDTO | null>(null);
  const contextState = reactive<ContextState>({
    type: 'root',
    visible: false,
    activeNode: null,
    x: 0,
    y: 0,
  });

  function showContextMenu(type: ContextState['type'], targetNode: Node | null, e: MouseEvent) {
    contextState.visible = true;
    contextState.type = type;
    contextState.x = e.clientX;
    contextState.y = e.clientY;
    contextState.activeNode = targetNode;
  }

  async function createNode(type: NodeType) {
    const node = contextState.activeNode;
    const parentId = node ? node.id : null;
    const prefix = type === 'dir' ? 'Folder' : 'Contest';
    tree.value = await window.api.invoke(TreeChannels.createNode, type, prefix, parentId);
  }

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
  });
</script>

<template>
  <div
    class="border-2 border-violet-500 h-full"
    @click.right="(e) => showContextMenu('root', null, e)"
  >
    <ContextMenu :tree="tree" v-bind="contextState" @create-node="createNode" />
  </div>
</template>
