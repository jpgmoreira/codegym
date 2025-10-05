<script lang="ts" setup>
  import { computed, onMounted, useTemplateRef, reactive, ref } from 'vue';
  import { useContestsStore } from '@renderer/store/contests.js';
  import { ContestNodeType, ContestsTreeNode } from '@common/schemas/contests.js';
  import { randomId } from '@common/utils/utils.js';
  import './lib/jquery-3.7.1.min.js';
  import './lib/jstree.min.js';
  import './lib/themes/default-dark/style.min.css';

  // --- Variables: ---

  const contestsStore = useContestsStore();
  const treeRef = useTemplateRef('tree');
  const treeContainerRef = useTemplateRef('tree-container');
  const counters = computed(() => contestsStore.contestsTree.counters);
  const jstree = ref<any>(null);
  const treeVersion = ref(0);
  const isTreeEmpty = computed(() => {
    treeVersion.value;
    if (!jstree.value) return true;
    const root = jstree.value.get_node('#');
    return root.children.length === 0;
  });

  // --- Context menu: ---

  type ContextType = 'root' | 'dir' | 'contest';

  const context = reactive({
    style: {} as Record<string, string>,
    visible: false,
    type: 'root' as ContextType,
    currNode: '#',
  });

  function computeContextStyle(x: number, y: number) {
    const treeContainer = treeContainerRef.value;
    if (!treeContainer) return;
    const MENU_WIDTH = 100;
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

  function showContext(type: ContextType, e: MouseEvent) {
    computeContextStyle(e.clientX, e.clientY);
    context.type = type;
    context.visible = true;
  }

  function handleRightClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('jstree-anchor')) {
      // Click in a node.
      const li = target.closest('li');
      if (!li) return;
      const node = jstree.value.get_node(li.id);
      context.currNode = li.id;
      showContext(node.type, e);
    } else {
      context.currNode = '#';
      showContext('root', e);
    }
  }

  // --- Node creation: ---

  function createNode(type: ContestNodeType, parent: string) {
    const newNode: Partial<ContestsTreeNode> = {
      id: randomId(),
      type,
      parent,
      state: {
        selected: false,
      },
    };
    if (type === 'dir') {
      newNode.state!.opened = false;
      newNode.text = `Folder ${counters.value.nextDir}`;
      contestsStore.contestsTree.counters.nextDir++;
    } else {
      newNode.text = `Contest ${counters.value.nextContest}`;
      contestsStore.contestsTree.counters.nextContest++;
    }
    const parentNode = jstree.value.get_node(parent);
    jstree.value.create_node(parent, newNode);
    if (parentNode.type === 'dir') jstree.value.open_node(parentNode);
  }

  // --- Hooks: ---

  onMounted(() => {
    const $ = (window as any).jQuery;
    if (!treeRef.value || !$) return;
    const $tree = $(treeRef.value).jstree({
      core: {
        themes: {
          name: 'default-dark',
          dots: true,
          icons: true,
        },
        data: contestsStore.contestsTree.data,
        check_callback: true,
      },
      types: {
        dir: { icon: 'jstree-folder', valid_children: ['dir', 'contest'] },
        contest: { icon: 'jstree-file', valid_children: [] },
      },
      plugins: ['types'],
    });
    $tree.on('loaded.jstree', () => {
      jstree.value = $tree.jstree(true);
      $tree.on('create_node.jstree', () => {
        treeVersion.value++;
      });
    });
  });
</script>

<template>
  <div
    class="tree-container flex relative overflow-auto select-none"
    ref="tree-container"
    @click.right="handleRightClick"
    @click="context.visible = false"
  >
    <!-- Context menu -->
    <div
      v-if="context.visible"
      class="context-container absolute whitespace-nowrap"
      :style="context.style"
    >
      <div v-if="context.type === 'root'">
        <div class="context-option" @click="createNode('contest', '#')">New contest</div>
        <div class="context-option" @click="createNode('dir', '#')">New folder</div>
      </div>
      <div v-if="context.type === 'contest'">CONTEST CONTEXT</div>
      <div v-if="context.type === 'dir'">
        <div class="context-option" @click="createNode('contest', context.currNode)">
          New contest
        </div>
        <div class="context-option" @click="createNode('dir', context.currNode)">New folder</div>
      </div>
    </div>
    <!-- Tree -->
    <div ref="tree" v-show="!isTreeEmpty"></div>
    <!-- Placeholder -->
    <div v-if="isTreeEmpty" class="grow overflow-hidden relative">
      <div
        class="placeholder absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] text-lg opacity-70 whitespace-nowrap select-none"
      >
        Right-click here
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tree-container {
    border: 2px solid red;
  }
  .context-container {
    border: 1px solid #646d72;
    background-color: #4b5458;
    z-index: 2;
    cursor: pointer;
  }
  .context-option {
    padding: 3px;
  }
  .context-option:hover {
    background-color: #47778b;
  }
  .placeholder {
    z-index: 0;
  }
</style>
