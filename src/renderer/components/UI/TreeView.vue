<script lang="ts" setup>
  import { ref, computed, reactive, useTemplateRef } from 'vue';
  import AutoLengthInput from './AutoLengthInput.vue';
  import { randomId } from '@common/utils/utils';

  // --- Types and structures: ---

  type Node =
    | {
        id: string;
        type: 'dir';
        text: string;
        depth: number;
        selected: boolean;
        nDesc: number; // Total number of descendants, not including the node.
        nDescSel: number; // Total number of selected descendants.
        parent: Node | null;
        next: Node | null;
        prev: Node | null;
        head: Node | null;
        tail: Node | null;
        open: boolean;
      }
    | {
        id: string;
        type: 'file';
        text: string;
        depth: number;
        selected: boolean;
        parent: Node | null;
        next: Node | null;
        prev: Node | null;
      };

  type ContextType = 'root' | 'dir' | 'file';
  type NodeType = Node['type'];

  const context = reactive({
    type: 'root' as ContextType,
    style: {} as Record<string, string>,
    visible: false,
    targetNode: null as Node | null,
    targetDomElement: null as HTMLInputElement | null,
  });

  const rootController = reactive({
    nextFile: 1,
    nextDir: 1,
    head: null as Node | null,
    tail: null as Node | null,
  });

  const renamingNode = ref<Node | null>(null);

  const hoveredNodeId = ref<string | null>(null);

  const selectedNodes = ref<Set<Node>>(new Set());

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

  // --- Node creation: ---

  function _createDirNode(parent: Node | null): Node {
    const node = {
      id: randomId(),
      type: 'dir',
      text: `Folder ${rootController.nextDir}`,
      depth: 0,
      selected: false,
      nDesc: 0,
      nDescSel: 0,
      parent,
      next: null,
      prev: null,
      head: null,
      tail: null,
      open: false,
    } as const;
    rootController.nextDir++;
    return node;
  }
  function _createFileNode(parent: Node | null): Node {
    const node = {
      id: randomId(),
      type: 'file',
      text: `File ${rootController.nextFile}`,
      depth: 0,
      selected: false,
      parent,
      next: null,
      prev: null,
    } as const;
    rootController.nextFile++;
    return node;
  }

  function createNode(type: NodeType) {
    const parent = context.targetNode;
    if (parent && parent.type !== 'dir') return;
    const newNode = type === 'dir' ? _createDirNode(parent) : _createFileNode(parent);
    const control = parent || rootController;
    newNode.depth = parent ? parent.depth + 1 : 0;
    if (!control.head || !control.tail) {
      control.head = newNode;
      control.tail = newNode;
    } else {
      control.tail.next = newNode;
      newNode.prev = control.tail;
      control.tail = newNode;
    }
    // Creation of a node in a selected parent:
    if (parent && parent.selected) {
      newNode.selected = true;
      selectedNodes.value.add(newNode);
    }
    let curr: Node | null = parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDesc++;
      curr.nDescSel += Number(newNode.selected);
      curr = curr.parent;
    }
  }

  // --- Node renaming: ---

  function startRenaming() {
    renamingNode.value = context.targetNode;
    context.targetDomElement?.focus();
    context.targetDomElement?.select();
  }

  function applyRenaming(e: Event) {
    if (!renamingNode.value) return;
    const newName = (e.target as HTMLInputElement).value.trim();
    const node = renamingNode.value;
    renamingNode.value = null;
    if (node.text !== newName) {
      node.text = newName;
    }
  }

  // --- Selection: ---

  function clearSelection() {
    for (const node of selectedNodes.value) {
      node.selected = false;
      let curr = node.parent;
      while (curr) {
        if (curr.type !== 'dir') break;
        if (curr.nDescSel === 0) break;
        curr.nDescSel = 0;
        curr = curr.parent;
      }
    }
    selectedNodes.value.clear();
  }

  // --- Tree flattening: ---

  function flatten(head: Node | null): Node[] {
    const result: Node[] = [];
    let curr: Node | null = head;
    while (curr) {
      result.push(curr);
      if (curr.type === 'dir' && curr.open) result.push(...flatten(curr.head));
      curr = curr.next;
    }
    return result;
  }

  const flattened = computed(() => flatten(rootController.head));
</script>

<template>
  <div
    class="tree-container"
    ref="tree-container"
    @click.right="(e) => showContext('root', e, null)"
    @click="clearContext"
  >
    <!-- Context menu -->
    <div v-if="context.visible" class="context-container" :style="context.style">
      <div v-if="context.type === 'root'">
        <div @click="createNode('file')">Create file</div>
        <div @click="createNode('dir')">Create folder</div>
      </div>
      <div v-else-if="context.type === 'dir'">
        <div @click="createNode('file')">Create file</div>
        <div @click="createNode('dir')">Create folder</div>
        <div @click="startRenaming">Rename</div>
        <div>Delete</div>
      </div>
      <div v-else>
        <div @click="startRenaming">Rename</div>
        <div>Delete</div>
      </div>
    </div>
    <!-- Tree -->
    <div v-for="node in flattened" class="node-row" :key="node.id">
      <div :style="{ paddingLeft: `${node.depth * 40}px` }">
        <div v-if="node.type === 'dir'">
          <span v-if="node.open" @click="node.open = false">-</span>
          <span v-else @click="node.open = true">+</span>
          <AutoLengthInput
            :value.trim="node.text"
            :readonly="renamingNode !== node"
            :class="{ selected: node.selected, hover: hoveredNodeId === node.id }"
            @click.right.stop="(e: MouseEvent) => showContext('dir', e, node)"
            @keydown.esc="renamingNode = null"
            @keydown.enter="(e: KeyboardEvent) => applyRenaming(e)"
            @blur="(e: FocusEvent) => applyRenaming(e)"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
          />
        </div>
        <AutoLengthInput
          v-else
          :value.trim="node.text"
          :readonly="renamingNode !== node"
          :class="{ selected: node.selected, hover: hoveredNodeId === node.id }"
          @click.right.stop="(e: MouseEvent) => showContext('file', e, node)"
          @keydown.esc="renamingNode = null"
          @keydown.enter="(e: KeyboardEvent) => applyRenaming(e)"
          @blur="(e: FocusEvent) => applyRenaming(e)"
          @mouseenter="hoveredNodeId = node.id"
          @mouseleave="hoveredNodeId = null"
        />
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

  /* Node inputs: */
  input[type='text'] {
    background-color: transparent;
    line-height: 1rem;
  }
  input[type='text']:not([readonly]) {
    background-color: #313131;
  }
  /*
  I simulate hover via a class, because I want to remove
  the hover state when the user de-selects a node via click.
  */
  input[type='text'][readonly].hover,
  input[type='text'][readonly]:focus {
    background-color: #515151;
  }
  input[type='text'].selected {
    border: 1px solid #bbe624;
  }
</style>
