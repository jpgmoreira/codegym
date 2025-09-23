<script lang="ts" setup>
  import { randomId } from '@common/utils/utils';
  import { reactive, computed, ref } from 'vue';
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
  });

  // - Functions:
  function resetContext() {
    context.visible = false;
    context.targetNode = null;
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
  }
  function showFileContext(node: Node, e: MouseEvent) {
    context.x = e.clientX;
    context.y = e.clientY;
    context.type = 'file';
    context.visible = true;
    context.targetNode = node;
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
  const flattened = computed<Node[]>(() =>
    // O(n)
    controller.head === null ? [] : flatten(controller.head)
  );
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
        <div class="context-button">Rename</div>
      </div>
      <div v-else-if="context.type === 'file'">
        <div class="context-button">Rename</div>
      </div>
    </div>
    <div class="border" v-for="node in flattened">
      <div :style="{ paddingLeft: `${node.depth * 20}px` }">
        <div v-if="node.type === 'dir'">
          <span v-if="node.open" @click="toggleDirOpen(node)">-</span>
          <span v-else @click="toggleDirOpen(node)">+</span>
          <input
            type="text"
            readonly
            :value.trim="node.text"
            @click.right.stop="(e) => showDirContext(node, e)"
          />
        </div>
        <input
          type="text"
          readonly
          :value.trim="node.text"
          v-else
          @click.right.stop="(e) => showFileContext(node, e)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 1px solid red;
    flex-grow: 1;
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
</style>
