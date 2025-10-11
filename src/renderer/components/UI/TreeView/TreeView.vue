<script lang="ts" setup>
  import ContextMenu from './ContextMenu.vue';
  import { TreeOperationResponseDTO } from '@common/dto/treeOperationResponseDTO';
  import { NodeType, Node, ModifierKeys } from '@common/types/tree';
  import { TreeChannels } from '@common/types/treeChannels';
  import {
    ref,
    onMounted,
    reactive,
    nextTick,
    onBeforeUnmount,
    useTemplateRef,
    computed,
  } from 'vue';
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

  const rowHeight = 30;
  const paddingBottom = 100;

  const uiStore = useUIStore();

  const keys: ModifierKeys = {
    ctrl: false,
  };

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
  const searchText = ref('');
  const scrollTimer = ref<NodeJS.Timeout | undefined>(undefined);
  const anchor = ref(0);

  const isSearching = ref(false);

  const scrollContainer = useTemplateRef('scroll-container');

  const ghostStyle = computed(() => ({
    height: `${rowHeight * (tree.value?.nSurfaceNodes || 0)}px`,
  }));
  const nodeContainerStyle = computed(() => ({
    transform: `translateY(${anchor.value * rowHeight}px)`,
  }));

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
    tree.value = await window.api.invoke(
      TreeChannels.createNode,
      anchor.value,
      type,
      prefix,
      parentId
    );
  }

  async function toggleDirOpen(node: Node) {
    tree.value = await window.api.invoke(TreeChannels.toggleDirOpen, anchor.value, node.id);
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

  async function handleSelection(node: Node) {
    if (node.type === 'dir' && isSearching.value) return; // Do not allow dir selection while searching.
    tree.value = await window.api.invoke(TreeChannels.handleSelection, anchor.value, node.id, keys);
  }

  async function deleteNode() {
    const node = contextState.activeNode;
    if (!node) return;
    tree.value = await window.api.invoke(TreeChannels.deleteNode, anchor.value, node.id);
  }

  async function deleteSelectedNodes() {
    tree.value = await window.api.invoke(TreeChannels.deleteSelectedNodes, anchor.value);
  }

  async function search() {
    const text = searchText.value.trim();
    isSearching.value = Boolean(text);
    tree.value = await window.api.invoke(TreeChannels.search, anchor.value, text);
  }

  function handleScroll() {
    clearTimeout(scrollTimer.value);
    scrollTimer.value = setTimeout(async () => {
      const container = scrollContainer.value;
      if (!container) return;
      const scrollTop = container.scrollTop;
      anchor.value = Math.floor(scrollTop / rowHeight);
      tree.value = await window.api.invoke(TreeChannels.getState, anchor.value);
    }, 40);
  }

  function windowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Control') keys.ctrl = true;
  }

  function windowKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') keys.ctrl = false;
  }

  onMounted(async () => {
    tree.value = await window.api.invoke(TreeChannels.getState, 0);
    hasLoaded.value = true;
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('keyup', windowKeyUp);
  });
  onBeforeUnmount(async () => {
    await window.api.invoke(TreeChannels.search, 0, ''); // Clear search when leaving.
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('keyup', windowKeyUp);
  });
</script>

<template>
  <!-- <div>Total nodes: {{ tree?.nTotalNodes }}</div>
  <div>Selected nodes: {{ tree?.nSelectedNodes }}</div>
  <div>Selected files: {{ tree?.nSelectedFiles }}</div> -->
  <div
    v-if="hasLoaded"
    ref="scroll-container"
    class="border-2 border-violet-500 relative overflow-auto h-full z-0"
    @click.right="(e) => showContextMenu('root', null, e)"
    @click="() => (contextState.visible = false)"
    @scroll="handleScroll"
  >
    <ContextMenu
      class="z-20"
      :tree="tree"
      :n-selected-nodes="tree?.nSelectedNodes || 0"
      :search-text="searchText"
      v-bind="contextState"
      @create-node="createNode"
      @rename-node="startRenaming"
      @delete-node="deleteNode"
      @delete-selected-nodes="deleteSelectedNodes"
    />
    <div
      v-if="!isSearching && !tree?.visibleNodes.length"
      class="absolute-center whitespace-nowrap text-lg opacity-70"
    >
      Right-click here
    </div>
    <div v-else-if="tree" class="absolute top-0 left-0 w-full z-10">
      <div class="flex w-full">
        <input
          v-model.trim="searchText"
          class="w-full rounded-none"
          type="text"
          placeholder="Search for files..."
        />
        <button class="btn-primary rounded-none" @click="search">Search</button>
      </div>
      <div class="relative">
        <div :style="ghostStyle"></div>
        <div :style="nodeContainerStyle" class="node-container absolute top-0 left-0">
          <!-- <TransitionGroup name="list" tag="div"> -->
          <div
            v-for="(node, index) in tree.visibleNodes"
            :style="{
              paddingLeft: `${node.depth * 20}px`,
              '--index': index,
            }"
            :key="node.id"
          >
            <span v-if="node.type === 'dir'" @click="toggleDirOpen(node)">
              <span v-if="node.open">-</span>
              <span v-else>+</span>
            </span>

            <AutoLengthInput
              class="node-input"
              :class="{ selected: node.selected }"
              v-model="node.text"
              :readonly="renamingNode !== node"
              @keydown.enter="applyRenaming"
              @keydown.esc="undoRenaming"
              @blur="applyRenaming"
              @click.right.stop="(e: MouseEvent) => showContextMenu(node.type, node, e)"
              @click="handleSelection(node)"
            />
          </div>
          <!-- </TransitionGroup> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .selected {
    outline: 2px solid orange !important;
  }

  .node-input {
    height: 30px;
  }

  .node-container {
    will-change: transform;
  }

  /* --- Transitions --- */
  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
  }

  /* Entering */
  .list-enter-from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  .list-enter-to {
    opacity: 1;
    transform: translateY(0);
    max-height: 40px; /* adjust for maximum item height */
  }

  /* Leaving */
  .list-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 40px;
  }
  .list-leave-to {
    opacity: 0;
    transform: translateY(10px);
    max-height: 0;
  }

  /* --- Smoother staggering --- */
  .list-enter-active,
  .list-leave-active {
    transition-property: opacity, transform, max-height;
    transition-duration: 0.25s;
    transition-timing-function: ease;
  }

  /* Smaller delay */
  .list-enter-active {
    transition-delay: calc(var(--index) * 1ms);
  }
  .list-leave-active {
    transition-delay: 1ms;
  }
</style>
