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
  import { toLocaleNumber } from '@common/utils/utils';

  type ContextState = {
    type: NodeType | 'root';
    visible: boolean;
    activeNode: Node | null;
    activeDomNode: HTMLInputElement | null;
    x: number;
    y: number;
  };

  const props = defineProps({
    checkbox: {
      type: Boolean,
      required: false,
    },
  });

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

  const animateFolders = ref(false);
  const isSearching = ref(false);
  const showFilesSelectedBadge = ref(false);

  const scrollContainer = useTemplateRef('scroll-container');

  const ghostStyle = computed(() => ({
    height: `${rowHeight * (tree.value?.nSurfaceNodes || 0) + paddingBottom}px`,
  }));
  const nodeContainerOffset = ref(0);

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
    animateFolders.value = true;
    tree.value = await window.api.invoke(TreeChannels.toggleDirOpen, anchor.value, node.id);
    await nextTick();
    requestAnimationFrame(() => {
      animateFolders.value = false;
    });
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
    if (isNodeDisabled(node)) return; // Do not allow folder selection while searching.
    const localKeys = { ...keys };
    if (props.checkbox) localKeys.ctrl = true;
    tree.value = await window.api.invoke(
      TreeChannels.handleSelection,
      anchor.value,
      node.id,
      localKeys
    );
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
    contextState.visible = false;
    clearTimeout(scrollTimer.value);
    setTimeout(async () => {
      const container = scrollContainer.value;
      if (!container) return;
      const scrollTop = container.scrollTop;
      anchor.value = Math.max(0, Math.floor(scrollTop / rowHeight) - 30);
      tree.value = await window.api.invoke(TreeChannels.getState, anchor.value);
      nodeContainerOffset.value = anchor.value * rowHeight; // This is the key! Using a computed-value causes flickering.
    }, 40);
  }

  async function collapseAll() {
    tree.value = await window.api.invoke(TreeChannels.collapseAll, anchor.value);
  }

  function isCheckIndeterminate(node: Node) {
    return Boolean(node.type === 'dir' && node.nSelDesc && node.nSelDesc < node.nDesc);
  }

  function isNodeDisabled(node: Node) {
    return node.type === 'dir' && isSearching.value;
  }

  function nFoldersSelected() {
    if (!tree.value) return 0;
    return tree.value.nSelectedNodes - tree.value.nSelectedFiles;
  }

  function containerMouseEnter() {
    if (tree.value?.nTotalNodes) {
      showFilesSelectedBadge.value = true;
    }
  }

  function containerMouseLeave() {
    showFilesSelectedBadge.value = false;
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
  <div
    v-if="hasLoaded"
    class="relative z-0 h-full"
    @click.right="(e) => showContextMenu('root', null, e)"
    @click="() => (contextState.visible = false)"
    @mouseenter="containerMouseEnter"
    @mouseleave="containerMouseLeave"
  >
    <ContextMenu
      class="z-30"
      :tree="tree"
      :n-selected-nodes="tree?.nSelectedNodes || 0"
      :n-open-dirs="tree?.nOpenDirs || 0"
      :search-text="searchText"
      v-bind="contextState"
      @create-node="createNode"
      @rename-node="startRenaming"
      @delete-node="deleteNode"
      @delete-selected-nodes="deleteSelectedNodes"
      @collapse-all="collapseAll"
    />
    <Transition name="badge-fade">
      <div v-show="showFilesSelectedBadge" class="z-20 files-selected-badge text-sm font-bold">
        <div>{{ toLocaleNumber(tree!.nSelectedFiles) }} files and</div>
        <div>{{ toLocaleNumber(nFoldersSelected()) }} folders selected</div>
      </div>
    </Transition>
    <div
      v-if="!isSearching && !tree?.visibleNodes.length"
      class="absolute-center whitespace-nowrap text-lg opacity-70"
    >
      Right-click here
    </div>
    <div
      v-else-if="tree"
      class="absolute top-0 left-0 w-full z-10 overflow-auto h-full"
      ref="scroll-container"
      @scroll="handleScroll"
    >
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
        <div
          :style="{ transform: `translateY(${nodeContainerOffset}px)` }"
          class="nodes-container absolute top-0 left-0"
        >
          <TransitionGroup :name="animateFolders ? 'list' : ''" tag="div" :css="animateFolders">
            <div
              class="flex items-center whitespace-nowrap"
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

              <div class="flex items-center" @click="handleSelection(node)">
                <input
                  v-if="props.checkbox"
                  type="checkbox"
                  :checked="node.selected"
                  :indeterminate="isCheckIndeterminate(node)"
                  :disabled="isNodeDisabled(node)"
                  :class="{ 'cursor-not-allowed': isNodeDisabled(node) }"
                />
                <AutoLengthInput
                  class="node-input"
                  :class="{ selected: node.selected, 'cursor-not-allowed': isNodeDisabled(node) }"
                  v-model="node.text"
                  :readonly="renamingNode !== node"
                  @keydown.enter="applyRenaming"
                  @keydown.esc="undoRenaming"
                  @blur="applyRenaming"
                  @click.right.stop="(e: MouseEvent) => showContextMenu(node.type, node, e)"
                />
              </div>
            </div>
          </TransitionGroup>
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

  .nodes-container {
    will-change: transform;
  }

  .files-selected-badge {
    position: absolute;
    bottom: 10px;
    right: 30px;
    display: inline;
    border-radius: 5px;
    padding: 1px 5px;
    white-space: nowrap;
  }

  /* --- Transitions --- */

  /* List: */
  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: opacity 0.12s ease;
  }
  .list-enter-from {
    opacity: 0;
  }
  .list-enter-to {
    opacity: 1;
  }
  .list-leave-from {
    opacity: 1;
  }
  .list-leave-to {
    opacity: 0;
  }

  /* Badge fade: */
  .badge-fade-enter-active,
  .badge-fade-leave-active {
    transition: opacity 0.25s ease;
  }
  .badge-fade-enter-from,
  .badge-fade-leave-to {
    opacity: 0;
  }
  .badge-fade-enter-to,
  .badge-fade-leave-from {
    opacity: 1;
  }
</style>
