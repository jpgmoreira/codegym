<script lang="ts" setup>
  import { computed, reactive, useTemplateRef } from 'vue';
  import AutoLengthInput from './AutoLengthInput.vue';
  import { randomId } from '@common/utils/utils';

  // --- Types and structures: ---

  type Node =
    | {
        id: string;
        type: 'dir';
        text: string;
        depth: number;
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
  }

  // --- Tree flattening: ---

  function flatten(head: Node | null): Node[] {
    const result: Node[] = [];
    let curr: Node | null = head;
    while (curr) {
      result.push(curr);
      if (curr.type === 'dir') result.push(...flatten(curr.head));
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
        <div>Rename</div>
        <div>Delete</div>
      </div>
    </div>
    <!-- Tree -->
    <div v-for="node in flattened" class="node-row" :key="node.id">
      <div :style="{ paddingLeft: `${node.depth * 40}px` }">
        <div v-if="node.type === 'dir'">
          <span v-if="node.open">-</span>
          <span v-else>+</span>
          <AutoLengthInput
            :value="node.text"
            @click.right.stop="(e: MouseEvent) => showContext('dir', e, node)"
          />
        </div>
        <AutoLengthInput v-else :value="node.text" />
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
</style>
