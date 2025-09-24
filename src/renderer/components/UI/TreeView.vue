<script lang="ts" setup>
  import { randomId } from '@common/utils/utils';
  import { reactive, computed, ref, onMounted, onBeforeUnmount } from 'vue';
  import AutoLengthInput from './AutoLengthInput.vue';

  // - Types:
  type Node =
    | {
        id: string;
        type: 'dir';
        text: string;
        depth: number;
        open: boolean;
        prev: Node | null;
        next: Node | null;
        head: Node | null;
        tail: Node | null;
      }
    | {
        id: string;
        type: 'file';
        text: string;
        depth: number;
        prev: Node | null;
        next: Node | null;
      };
  type ContextType = 'root' | 'dir' | 'file';
  type NodeType = Node['type'];

  // - Structures:
  const controller = reactive({
    nextDir: 1,
    nextFile: 1,
    head: null as Node | null,
    tail: null as Node | null,
  });
  const context = reactive({
    x: 0,
    y: 0,
    type: 'root' as ContextType,
    visible: false,
    targetNode: null as Node | null,
    targetDomElement: null as HTMLInputElement | null,
  });
  const keys = reactive({
    ctrl: false,
    shift: false,
  });
  const renaming = ref<Node | null>(null);
  const selectedNodeIds = ref(new Set<string>());

  // - Functions:
  function resetContext() {
    context.visible = false;
    context.targetNode = null;
    context.targetDomElement = null;
  }
  function startRename() {
    renaming.value = context.targetNode;
    context.targetDomElement?.focus();
    context.targetDomElement?.select();
  }
  function finishRename(node: Node, e: Event) {
    const newName = (e.target as HTMLInputElement).value.trim();
    renaming.value = null;
    if (node.text !== newName) {
      node.text = newName;
      // update name here...
    }
  }
  function showRootContext(e: MouseEvent) {
    context.x = e.clientX;
    context.y = e.clientY;
    context.type = 'root';
    context.visible = true;
  }
  function showDirContext(node: Node, e: MouseEvent) {
    context.x = e.clientX;
    context.y = e.clientY;
    context.type = 'dir';
    context.visible = true;
    context.targetNode = node;
    context.targetDomElement = e.currentTarget as HTMLInputElement;
  }
  function showFileContext(node: Node, e: MouseEvent) {
    context.x = e.clientX;
    context.y = e.clientY;
    context.type = 'file';
    context.visible = true;
    context.targetNode = node;
    context.targetDomElement = e.currentTarget as HTMLInputElement;
  }
  function getEmptyDir(): Node {
    const result = {
      id: randomId(),
      type: 'dir',
      text: `Folder ${controller.nextDir}`,
      depth: 0,
      open: true,
      head: null,
      tail: null,
      prev: null,
      next: null,
    } as const;
    controller.nextDir++;
    return result;
  }
  function getEmptyFile(): Node {
    const result = {
      id: randomId(),
      type: 'file',
      text: `File ${controller.nextFile}`,
      depth: 0,
      prev: null,
      next: null,
    } as const;
    controller.nextFile++;
    return result;
  }
  function toggleDirOpen(node: Node) {
    if (node.type !== 'dir') return;
    node.open = !node.open;
  }

  // - Functions whose complexity is important:
  function createRootNode(type: NodeType) {
    // O(1)
    const newNode = type === 'dir' ? getEmptyDir() : getEmptyFile();
    if (!controller.tail) {
      controller.head = newNode;
      controller.tail = newNode;
    } else {
      controller.tail.next = newNode;
      newNode.prev = controller.tail;
      controller.tail = newNode;
    }
  }
  function createDirNode(type: NodeType) {
    // O(1)
    const newNode = type === 'dir' ? getEmptyDir() : getEmptyFile();
    const parent = context.targetNode;
    if (!parent || parent.type !== 'dir') return;
    newNode.depth = parent.depth + 1;
    parent.open = true;
    if (!parent.tail) {
      parent.head = newNode;
      parent.tail = newNode;
    } else {
      parent.tail.next = newNode;
      newNode.prev = parent.tail;
      parent.tail = newNode;
    }
  }
  function _selectNode(node: Node) {
    // O(n)
    selectedNodeIds.value.add(node.id);
    if (node.type === 'dir') {
      let curr = node.head;
      while (curr !== node.tail) {
        _selectNode(curr!);
        curr = curr!.next;
      }
      if (curr) _selectNode(curr);
    }
  }
  function selectNode(node: Node) {
    // O(n)
    if (!keys.ctrl && !keys.shift) selectedNodeIds.value.clear();
    _selectNode(node);
  }
  function flatten(node: Node): Node[] {
    // O(n)
    const result: Node[] = [];
    let iterator: Node | null = node;
    while (iterator) {
      result.push(iterator);
      if (iterator.type === 'dir' && iterator.open && iterator.head) {
        result.push(...flatten(iterator.head));
      }
      iterator = iterator.next;
    }
    return result;
  }

  // - Computed:
  const flattened = computed<Node[]>(() =>
    // O(n)
    controller.head === null ? [] : flatten(controller.head)
  );

  // - Lifecycle hooks:
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
  <div class="tree-container" @click.right="(e) => showRootContext(e)" @click="resetContext">
    <div
      class="context"
      v-if="context.visible"
      :style="{ left: `${context.x}px`, top: `${context.y}px` }"
    >
      <div v-if="context.type === 'root'">
        <div class="context-button" @click="createRootNode('file')">Create a new file</div>
        <div class="context-button" @click="createRootNode('dir')">Create a new folder</div>
      </div>
      <div v-else-if="context.type === 'dir'">
        <div class="context-button" @click="createDirNode('file')">Create a new xxfile</div>
        <div class="context-button" @click="createDirNode('dir')">Create a new xxfolder</div>
        <div class="context-button" @click="startRename">Rename</div>
      </div>
      <div v-else-if="context.type === 'file'">
        <div class="context-button" @click="startRename">Rename</div>
      </div>
    </div>
    <div class="node-row" v-for="node in flattened">
      <div class="padding-container" :style="{ paddingLeft: `${node.depth * 20}px` }">
        <div class="dir-container" v-if="node.type === 'dir'">
          <span v-if="node.open" @click="toggleDirOpen(node)">-</span>
          <span v-else @click="toggleDirOpen(node)">+</span>
          <AutoLengthInput
            type="text"
            :readonly="renaming !== node"
            :value.trim="node.text"
            :class="{ selected: selectedNodeIds.has(node.id) }"
            @click="selectNode(node)"
            @keydown.esc="renaming = null"
            @keydown.enter="(e: KeyboardEvent) => finishRename(node, e)"
            @blur="(e: FocusEvent) => finishRename(node, e)"
            @click.right.stop="(e: MouseEvent) => showDirContext(node, e)"
          />
        </div>
        <AutoLengthInput
          v-else
          type="text"
          :readonly="renaming !== node"
          :value.trim="node.text"
          :class="{ selected: selectedNodeIds.has(node.id) }"
          @click="selectNode(node)"
          @keydown.esc="renaming = null"
          @keydown.enter="(e: KeyboardEvent) => finishRename(node, e)"
          @blur="(e: FocusEvent) => finishRename(node, e)"
          @click.right.stop="(e: MouseEvent) => showFileContext(node, e)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 1px solid red;
    flex-grow: 1;
    overflow: scroll auto;
  }
  .context {
    background-color: #333;
    display: inline-flex;
    flex-direction: column;
    border: 1px solid blue;
    position: fixed;
    white-space: nowrap;
  }
  .context-button {
    padding: 5px;
    cursor: pointer;
  }
  .context-button:hover {
    background-color: #888;
  }

  .node-row {
    /* border: 1px solid blue; */
  }
  .padding-container {
    /* border: 1px solid aqua; */
  }
  .dir-container {
    white-space: nowrap;
    /* border: 1px solid orange; */
  }

  input[type='text'] {
    background-color: transparent;
    line-height: 1rem;
    /* border: 1px solid olive; */
  }
  input[type='text']:not([readonly]) {
    background-color: #313131;
  }
  input[type='text'][readonly] {
    cursor: pointer;
  }
  input[type='text'][readonly]:hover,
  input[type='text'][readonly]:focus {
    background-color: #515151;
  }
  input[type='text'].selected {
    background-color: #404040;
  }
</style>
