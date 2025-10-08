<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node } from '@common/types/tree';
  import { TreeChannels } from '@common/types/treeChannels';
  import { ref, onMounted, reactive } from 'vue';
  import AutoLengthInput from '../AutoLengthInput.vue';

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    x: number;
    y: number;
  };

  const hasLoaded = ref(false);
  const tree = ref<TreeOperationResponseDTO | null>(null);
  const contextState = reactive<ContextState>({
    type: 'root',
    visible: false,
    activeNode: null,
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

  function startRenaming(node: Node) {
    originalName.value = node.text;
    renamingNode.value = node;
  }

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
    hasLoaded.value = true;
  });
</script>

<template>
  <div
    v-if="hasLoaded"
    class="border-2 border-violet-500 relative overflow-auto h-full z-0"
    @click.right="(e) => showContextMenu('root', null, e)"
  >
    <ContextMenu class="z-20" :tree="tree" v-bind="contextState" @create-node="createNode" />
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
        @click.right.stop="(e) => showContextMenu(node.type, node, e)"
      >
        <span v-if="node.type === 'dir'" @click="toggleDirOpen(node)">
          <span v-if="node.open">-</span>
          <span v-else>+</span>
        </span>

        <AutoLengthInput v-model="node.text" @focus="startRenaming(node)" />
      </div>
    </div>
  </div>
</template>
