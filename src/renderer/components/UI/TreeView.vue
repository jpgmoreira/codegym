<script lang="ts" setup>
  import { ref, computed, reactive, useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
  import { ModifierKeys, NodeType, TreeState, type Node } from '@common/types/tree/treeTypes';
  import AutoLengthInput from './AutoLengthInput.vue';
  import { TreeChannels } from '@common/types/tree/treeChannels';

  // --- Props: ---

  const props = defineProps<{ checkbox: boolean }>();

  // --- Types and structures: ---

  type ContextType = 'root' | 'dir' | 'file';

  const context = reactive({
    type: 'root' as ContextType,
    style: {} as Record<string, string>,
    visible: false,
    targetNode: null as Node | null,
    targetDomElement: null as HTMLInputElement | null,
  });

  const keys = reactive<ModifierKeys>({
    ctrl: false,
    shift: false,
  });

  const renamingNode = ref<Node | null>(null);
  let originalNodeName = '';

  const hoveredNodeId = ref<string | null>(null);

  const treeState = ref<TreeState>({
    visibleNodes: [],
    nSelectedNodes: 0,
    nTotalNodes: 0,
  });

  const treeContainerRef = useTemplateRef('tree-container');

  // --- Context menu: ---

  function computeContextStyle(x: number, y: number) {
    const treeContainer = treeContainerRef.value;
    if (!treeContainer) return;
    const MENU_WIDTH = 150;
    const MENU_HEIGHT = 100;
    const rect = treeContainer.getBoundingClientRect();
    const left = x - rect.left;
    const top = y - rect.top;
    const res = {} as (typeof context)['style'];
    if (left + MENU_WIDTH > rect.width) res['right'] = `${rect.width - left}px`;
    else res['left'] = `${left}px`;
    if (top + MENU_HEIGHT > rect.height) res['bottom'] = `${rect.height - top}px`;
    else res['top'] = `${top}px`;
    context['style'] = res;
  }

  function showContext(type: ContextType, e: MouseEvent, targetNode: Node | null) {
    context.type = type;
    context.visible = true;
    computeContextStyle(e.clientX, e.clientY);
    if (type === 'root') {
      context.targetNode = null;
      context.targetDomElement = null;
    } else {
      context.targetNode = targetNode;
      context.targetDomElement = e.currentTarget as HTMLInputElement;
    }
  }

  function clearContext() {
    context.visible = false;
    context.targetNode = null;
    context.targetDomElement = null;
  }

  // --- Node renaming: ---

  function startRenaming() {
    if (!context.targetNode) return;
    renamingNode.value = context.targetNode;
    originalNodeName = context.targetNode.text;
    context.targetDomElement?.focus();
    context.targetDomElement?.select();
  }

  async function applyRenaming(e: Event) {
    if (!renamingNode.value) return;
    const newName = (e.target as HTMLInputElement).value.trim();
    const node = renamingNode.value;
    renamingNode.value = null;
    if (newName && node.text !== newName) {
      // node.text = newName;  // Avoid flickering.
      treeState.value = await window.api.invoke(TreeChannels.renameNode, node.id, newName);
    }
  }

  function undoRenaming() {
    if (!renamingNode.value) return;
    renamingNode.value.text = originalNodeName;
    renamingNode.value = null;
  }

  // --- Selection: ---

  // function blurHoveredNode() {
  //   hoveredNodeId.value = null;
  //   (document.activeElement as HTMLElement).blur();
  // }

  // function deselectFileViaClickPressingCtrlIgnoreShift(node: Node) {
  //   blurHoveredNode();
  // }

  // function deselectFileViaClickNoCtrlNoShift(node: Node) {
  //   blurHoveredNode();
  // }

  // function deselectDirViaClickPressingCtrlIgnoreShift(node: Node) {
  //   blurHoveredNode();
  // }

  // function deselectDirViaClickNoCtrlNoShift(node: Node) {
  //   blurHoveredNode();
  // }

  async function toggleFullSelection() {
    treeState.value = await window.api.invoke(TreeChannels.toggleFullSelection);
  }

  async function createNode(type: NodeType) {
    const parentId = context.targetNode ? context.targetNode.id : null;
    treeState.value = await window.api.invoke(TreeChannels.createNode, type, parentId);
  }

  async function handleSelection(node: Node) {
    treeState.value = await window.api.invoke(
      TreeChannels.handleSelection,
      node.id,
      props.checkbox,
      keys
    );
  }

  // --- Deletion: ---

  async function deleteContextFile() {
    renamingNode.value = null;
    hoveredNodeId.value = null;
    const node = context.targetNode!;
    treeState.value = await window.api.invoke(TreeChannels.deleteNode, 'file', node.id);
  }

  async function deleteContextDir() {
    renamingNode.value = null;
    hoveredNodeId.value = null;
    const node = context.targetNode!;
    treeState.value = await window.api.invoke(TreeChannels.deleteNode, 'dir', node.id);
  }

  async function deleteAllSelectedNodes() {
    renamingNode.value = null;
    hoveredNodeId.value = null;
    treeState.value = await window.api.invoke(TreeChannels.deleteAllSelectedNodes);
  }

  // --- UI auxiliary: ---

  function isCheckIndeterminate(node: Node): boolean {
    if (node.type !== 'dir') return false;
    return node.nDescSel > 0 && node.nDesc !== node.nDescSel;
  }

  const allNodesSelected = computed(
    () =>
      treeState.value.nTotalNodes && treeState.value.nTotalNodes === treeState.value.nSelectedNodes
  );

  // --- Hooks: ---

  function windowKeyDown(e: KeyboardEvent) {
    keys.ctrl = e.ctrlKey;
    keys.shift = e.shiftKey;
  }
  function windowKeyUp(e: KeyboardEvent) {
    keys.ctrl = e.ctrlKey;
    keys.shift = e.shiftKey;
  }
  onMounted(() => {
    window.addEventListener('keydown', windowKeyDown);
    window.addEventListener('keyup', windowKeyUp);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', windowKeyDown);
    window.removeEventListener('keyup', windowKeyUp);
  });
</script>

<template>
  <div
    class="tree-container"
    ref="tree-container"
    @click.right="(e) => showContext('root', e, null)"
    @click="clearContext"
    @dblclick="toggleFullSelection"
  >
    <div>Selected nodes: {{ treeState.nSelectedNodes }}</div>
    <!-- Context menu -->
    <div v-if="context.visible" class="context-container" :style="context.style">
      <div v-if="context.type === 'root'">
        <div @click="createNode('file')">New file</div>
        <div @click="createNode('dir')">New folder</div>
        <div v-if="allNodesSelected" @click="toggleFullSelection">Clear selection</div>
        <div v-if="treeState.nTotalNodes && !allNodesSelected" @click="toggleFullSelection">
          Select all
        </div>
        <div v-if="treeState.nSelectedNodes" @click="deleteAllSelectedNodes">Delete selection</div>
      </div>
      <div v-else-if="context.type === 'dir'">
        <template v-if="!keys.ctrl">
          <div @click="createNode('file')">New file</div>
          <div @click="createNode('dir')">New folder</div>
          <div @click="startRenaming">Rename item</div>
          <div @click="deleteContextDir">Delete item</div>
        </template>
      </div>
      <div v-else-if="context.type === 'file'">
        <template v-if="!keys.ctrl">
          <div @click="startRenaming">Rename item</div>
          <div @click="deleteContextFile">Delete item</div>
        </template>
      </div>
    </div>
    <!-- Tree -->
    <div v-for="node in treeState.visibleNodes" class="node-row" :key="node.id">
      <div :style="{ paddingLeft: `${node.depth * 40}px` }">
        <div v-if="node.type === 'dir'">
          <span v-if="node.open" @click="node.open = false">-</span>
          <span v-else @click="node.open = true">+</span>
          <div
            class="checkbox-input-wrapper"
            @click="handleSelection(node)"
            :class="{ selected: node.selected, hover: hoveredNodeId === node.id }"
          >
            <input
              v-if="props.checkbox"
              type="checkbox"
              :checked="node.selected"
              :indeterminate="isCheckIndeterminate(node)"
            />
            <AutoLengthInput
              v-model.trim="node.text"
              :readonly="renamingNode !== node"
              @click.right.stop="(e: MouseEvent) => showContext('dir', e, node)"
              @keydown.esc="undoRenaming"
              @keydown.enter="applyRenaming"
              @blur="applyRenaming"
              @mouseenter="hoveredNodeId = node.id"
              @mouseleave="hoveredNodeId = null"
            />
          </div>
        </div>
        <div
          v-else
          class="checkbox-input-wrapper"
          @click="handleSelection(node)"
          :class="{ selected: node.selected, hover: hoveredNodeId === node.id }"
        >
          <input
            v-if="props.checkbox"
            type="checkbox"
            :checked="node.selected"
            :indeterminate="isCheckIndeterminate(node)"
          />
          <AutoLengthInput
            v-model.trim="node.text"
            :readonly="renamingNode !== node"
            @click.right.stop="(e: MouseEvent) => showContext('file', e, node)"
            @keydown.esc="undoRenaming"
            @keydown.enter="applyRenaming"
            @blur="applyRenaming"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 2px solid red;
    position: relative;
    flex-grow: 1;
  }
  .context-container {
    border: 1px solid blue;
    position: absolute;
  }

  .checkbox-input-wrapper {
    display: inline-flex;
    align-items: center;
  }
  /*
  I simulate hover via a class, because I want to remove
  the hover state when the user de-selects a node via click.
  */
  .checkbox-input-wrapper.hover {
    background-color: #515151;
  }
  .checkbox-input-wrapper.selected {
    outline: 1px solid #bbe624;
  }

  /* Node inputs: */
  input[type='text'] {
    padding: 2px;
    background-color: transparent;
    line-height: 1rem;
  }
  input[type='text']:not([readonly]) {
    background-color: #313131;
  }
  input[type='text'][readonly]:focus {
    background-color: #515151;
  }
</style>
