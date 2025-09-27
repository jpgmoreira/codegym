<script lang="ts" setup>
  import { ref, computed, reactive, useTemplateRef, onMounted, onBeforeUnmount } from 'vue';
  import AutoLengthInput from './AutoLengthInput.vue';
  import { randomId } from '@common/utils/utils';

  // --- Props: ---

  const props = defineProps<{ checkbox: boolean }>();

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

  const keys = reactive({
    ctrl: false,
    shift: false,
  });

  const renamingNode = ref<Node | null>(null);

  const hoveredNodeId = ref<string | null>(null);

  const selectedNodes = ref<Set<Node>>(new Set());

  const shiftSelectionAnchorNode = ref<Node | null>(null);

  const treeContainerRef = useTemplateRef('tree-container');

  const nTotalNodes = ref(0);

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
    if (parent) parent.open = true;
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
      markNodeAsSelected(newNode);
    }
    let curr: Node | null = parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDesc++;
      curr.nDescSel += Number(newNode.selected);
      curr = curr.parent;
    }
    nTotalNodes.value++;
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

  function markNodeAsSelected(node: Node) {
    node.selected = true;
    selectedNodes.value.add(node);
  }

  function unmarkNodeAsSelected(node: Node) {
    node.selected = false;
    selectedNodes.value.delete(node);
  }

  function blurHoveredNode() {
    hoveredNodeId.value = null;
    (document.activeElement as HTMLElement).blur();
  }

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

  function selectFileViaClickPressingCtrlIgnoreShift(node: Node) {
    if (node.selected) return;
    markNodeAsSelected(node);
    let delta = 1;
    let curr = node.parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += delta;
      if (curr.nDesc === curr.nDescSel) {
        markNodeAsSelected(curr);
        delta++;
      }
      curr = curr.parent;
    }
  }

  function deselectFileViaClickPressingCtrlIgnoreShift(node: Node) {
    if (!node.selected) return;
    unmarkNodeAsSelected(node);
    let curr: Node | null = node.parent;
    let delta = 1;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel -= delta;
      if (curr.selected) {
        unmarkNodeAsSelected(curr);
        delta++;
      }
      curr = curr.parent;
    }
    blurHoveredNode();
  }

  function selectFileViaClickNoCtrlNoShift(node: Node) {
    if (node.selected) return;
    clearSelection();
    selectFileViaClickPressingCtrlIgnoreShift(node);
  }

  function deselectFileViaClickNoCtrlNoShift(node: Node) {
    if (!node.selected) return;
    clearSelection();
    blurHoveredNode();
  }

  function markSubtreeAsSelected(head: Node | null) {
    if (!head) return;
    let curr: Node | null = head;
    while (curr) {
      markNodeAsSelected(curr);
      if (curr.type === 'dir') {
        curr.nDescSel = curr.nDesc;
        markSubtreeAsSelected(curr.head);
      }
      curr = curr.next;
    }
  }

  function unmarkSubtreeAsSelected(head: Node | null) {
    if (!head) return;
    let curr: Node | null = head;
    while (curr) {
      unmarkNodeAsSelected(curr);
      if (curr.type === 'dir') {
        curr.nDescSel = 0;
        unmarkSubtreeAsSelected(curr.head);
      }
      curr = curr.next;
    }
  }

  function selectDirViaClickPressingCtrlIgnoreShift(node: Node) {
    if (node.selected) return;
    if (node.type !== 'dir') return;
    markNodeAsSelected(node);
    markSubtreeAsSelected(node.head);
    let delta = node.nDesc - node.nDescSel + 1;
    node.nDescSel = node.nDesc;
    let curr = node.parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += delta;
      if (curr.nDesc === curr.nDescSel) {
        markNodeAsSelected(curr);
        delta++;
      }
      curr = curr.parent;
    }
  }

  function deselectDirViaClickPressingCtrlIgnoreShift(node: Node) {
    if (!node.selected) return;
    if (node.type !== 'dir') return;
    unmarkNodeAsSelected(node);
    node.nDescSel = 0;
    unmarkSubtreeAsSelected(node.head);
    let delta = node.nDesc + 1;
    let curr = node.parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel -= delta;
      if (curr.selected) {
        unmarkNodeAsSelected(curr);
        delta++;
      }
      curr = curr.parent;
    }
    blurHoveredNode();
  }

  function selectDirViaClickNoCtrlNoShift(node: Node) {
    if (node.selected) return;
    if (node.type !== 'dir') return;
    clearSelection();
    selectDirViaClickPressingCtrlIgnoreShift(node);
  }

  function deselectDirViaClickNoCtrlNoShift(node: Node) {
    if (!node.selected) return;
    clearSelection();
    blurHoveredNode();
  }

  function shiftSelectRange(orig: Node, dest: Node) {
    // Orig !== dest.
    // - Find lowest common ancestor:
    let lca: Node | null = null;
    const seen = new Set<Node>();
    let curr = orig.parent;
    while (curr) {
      seen.add(curr);
      curr = curr.parent;
    }
    curr = dest.parent;
    while (curr) {
      if (seen.has(curr)) {
        lca = curr;
        break;
      }
      curr = curr.parent;
    }
    if (lca && lca.type !== 'dir') return; // Make TS happy.
    let head = lca ? lca.head : rootController.head;
    const flattened = flatten(head);
    let aux = 0;
    for (const node of flattened) {
      if (node === orig || node === dest) {
        aux++;
        if (node.type === 'file') selectFileViaClickPressingCtrlIgnoreShift(node);
        else selectDirViaClickPressingCtrlIgnoreShift(node);
        continue;
      }
      if (aux === 2) break;
      if (aux) {
        const mustSelect = node.type === 'file' || (node.type === 'dir' && node.nDesc === 0);
        if (mustSelect) {
          if (node.type === 'file') selectFileViaClickPressingCtrlIgnoreShift(node);
          else selectDirViaClickPressingCtrlIgnoreShift(node);
        }
      }
    }
  }

  function handleSelection(node: Node) {
    // In checkbox mode, all selections happen as if the user had CTRL pressed.
    const { checkbox } = props;
    if (!node.selected && node.type === 'file' && !keys.ctrl && !keys.shift) {
      // Select a file node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) selectFileViaClickNoCtrlNoShift(node);
      else selectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'file' && !keys.ctrl && !keys.shift) {
      // Deselect a file node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) deselectFileViaClickNoCtrlNoShift(node);
      else deselectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'dir' && !keys.ctrl && !keys.shift) {
      // Select a dir node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) selectDirViaClickNoCtrlNoShift(node);
      else selectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'dir' && !keys.ctrl && !keys.shift) {
      // Deselect a dir node via click, without pressing CTRL nor SHIFT.
      if (!checkbox) deselectDirViaClickNoCtrlNoShift(node);
      else deselectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'file' && keys.ctrl) {
      // Select a file node via click, pressing CTRL, SHIFT doesn't matter.
      selectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'file' && keys.ctrl) {
      // Deselect a file node via click, pressing CTRL, SHIFT doesn't matter.
      deselectFileViaClickPressingCtrlIgnoreShift(node);
    } else if (!node.selected && node.type === 'dir' && keys.ctrl) {
      // Select a dir node via click, pressing CTRL, SHIFT doesn't matter.
      selectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (node.selected && node.type === 'dir' && keys.ctrl) {
      // Deselect a dir node via click, pressing CTRL, SHIFT doesn't matter.
      deselectDirViaClickPressingCtrlIgnoreShift(node);
    } else if (keys.shift) {
      const anchor = shiftSelectionAnchorNode.value;
      if (node.type === 'file' && (!anchor || anchor === node)) {
        // Clicking a file node, pressing SHIFT, without an anchor.
        selectFileViaClickPressingCtrlIgnoreShift(node);
      } else if (node.type === 'dir' && (!anchor || anchor === node)) {
        // Clicking a dir node, pressing SHIFT, without an anchor.
        selectDirViaClickPressingCtrlIgnoreShift(node);
      } else if (anchor && anchor !== node) {
        // Clicking a file or dir node, pressing SHIFT, with an anchor.
        shiftSelectRange(node, anchor);
      }
    }
    shiftSelectionAnchorNode.value = node;
  }

  function toggleFullSelection() {
    if (nTotalNodes.value === 0) return;
    if (allNodesSelected.value) {
      clearSelection();
    } else {
      markSubtreeAsSelected(rootController.head);
    }
  }

  // --- Deletion: ---

  function deleteContextFile() {
    const node = context.targetNode!;
    deleteFile(node);
  }

  function deleteContextDir() {
    const node = context.targetNode!;
    deleteDir(node);
  }

  function removeNodeFromTree(node: Node) {
    if (node.parent && node.parent.type !== 'dir') return; // Make TS happy.
    const control = node.parent || rootController;
    if (node === control.head) control.head = node.next;
    if (node === control.tail) control.tail = node.prev;
    if (node.prev && node.next) {
      node.prev.next = node.next;
      node.next.prev = node.prev;
    } else if (node.prev) {
      node.prev.next = null;
    } else if (node.next) {
      node.next.prev = null;
    }
  }

  function deleteFile(node: Node) {
    const wasSelected = node.selected;
    if (wasSelected) unmarkNodeAsSelected(node);
    let curr = node.parent;
    let ancestorSelDelta = 0;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDescSel += ancestorSelDelta;
      curr.nDesc--;
      if (wasSelected) curr.nDescSel--;
      if (!curr.selected && curr.nDesc > 0 && curr.nDesc === curr.nDescSel) {
        markNodeAsSelected(curr);
        ancestorSelDelta++;
      }
      curr = curr.parent;
    }
    renamingNode.value = null;
    hoveredNodeId.value = null;
    shiftSelectionAnchorNode.value = null;
    nTotalNodes.value--;
    removeNodeFromTree(node);
  }

  function deleteDir(node: Node) {
    if (node.type !== 'dir') return;
    unmarkSubtreeAsSelected(node.head);
    const nDescDec = node.nDesc + 1;
    let ancestorSelDelta = -(node.nDescSel + Number(node.selected));
    unmarkNodeAsSelected(node);
    let curr = node.parent;
    while (curr) {
      if (curr.type !== 'dir') break;
      curr.nDesc -= nDescDec;
      curr.nDescSel += ancestorSelDelta;
      if (!curr.selected && curr.nDesc > 0 && curr.nDesc === curr.nDescSel) {
        markNodeAsSelected(curr);
        ancestorSelDelta++;
      }
      curr = curr.parent;
    }
    renamingNode.value = null;
    hoveredNodeId.value = null;
    shiftSelectionAnchorNode.value = null;
    nTotalNodes.value -= nDescDec;
    removeNodeFromTree(node);
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

  // --- UI auxiliary: ---

  function isCheckIndeterminate(node: Node): boolean {
    if (node.type !== 'dir') return false;
    return node.nDescSel > 0 && node.nDesc !== node.nDescSel;
  }

  const allNodesSelected = computed(
    () => nTotalNodes.value > 0 && selectedNodes.value.size === nTotalNodes.value
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
    <div>Selected nodes: {{ selectedNodes.size }}</div>
    <!-- Context menu -->
    <div v-if="context.visible" class="context-container" :style="context.style">
      <div v-if="context.type === 'root'">
        <div @click="createNode('file')">New file</div>
        <div @click="createNode('dir')">New folder</div>
        <div v-if="nTotalNodes && allNodesSelected" @click="toggleFullSelection">
          Clear selection
        </div>
        <div v-if="nTotalNodes && !allNodesSelected" @click="toggleFullSelection">Select all</div>
        <div v-if="selectedNodes.size">Delete selection</div>
      </div>
      <div v-else-if="context.type === 'dir'">
        <div @click="createNode('file')">New file</div>
        <div @click="createNode('dir')">New folder</div>
        <div @click="startRenaming">Rename item</div>
        <div @click="deleteContextDir">Delete item</div>
      </div>
      <div v-else-if="context.type === 'file'">
        <div @click="startRenaming">Rename item</div>
        <div @click="deleteContextFile">Delete item</div>
      </div>
    </div>
    <!-- Tree -->
    <div v-for="node in flattened" class="node-row" :key="node.id">
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
              :value.trim="node.text"
              :readonly="renamingNode !== node"
              @click.right.stop="(e: MouseEvent) => showContext('dir', e, node)"
              @keydown.esc="renamingNode = null"
              @keydown.enter="(e: KeyboardEvent) => applyRenaming(e)"
              @blur="(e: FocusEvent) => applyRenaming(e)"
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
            :value.trim="node.text"
            :readonly="renamingNode !== node"
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
