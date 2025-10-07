<script lang="ts" setup>
  import { computed, onMounted, useTemplateRef, reactive, ref } from 'vue';
  import { useContestsStore } from '@renderer/store/contests.js';
  import { ContestNodeType, ContestsTreeNode } from '@common/schemas/contests.js';
  import { randomId } from '@common/utils/utils.js';
  import './lib/jquery-3.7.1.min.js';
  import './lib/jstree.min.js';
  import './lib/themes/default-dark/style.min.css';

  // --- Variables: ---

  type TreeState = 'loading' | 'empty' | 'not-empty';

  const contestsStore = useContestsStore();
  const treeRef = useTemplateRef('tree');
  const counters = computed(() => contestsStore.contestsTree.counters);
  const jstree = ref<any>(null);
  const treeState = ref<TreeState>('loading');
  const selectionTimer = ref<NodeJS.Timeout | undefined>(undefined);

  // --- Context menu: ---

  type ContextType = 'root' | 'dir' | 'contest';

  const context = reactive({
    style: {} as Record<string, string>,
    visible: false,
    type: 'root' as ContextType,
    currNode: '#',
  });

  function handleContext(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('jstree-anchor')) {
      const li = target.closest('li');
      if (!li) return;
      const node = jstree.value.get_node(li.id);
      context.currNode = li.id;
      context.type = node.type;
    } else {
      context.currNode = '#';
      context.type = 'root';
    }
    const windowHeight = window.innerHeight;
    const style: Record<string, string> = {
      left: `${e.clientX}px`,
    };
    if (e.clientY < windowHeight - 150) style.top = `${e.clientY}px`;
    else style.bottom = `${windowHeight - e.clientY}px`;
    context.style = style;
    context.visible = true;
  }

  // --- Node creation: ---

  function createNode(type: ContestNodeType, parent: string) {
    const parentNode = jstree.value.get_node(parent);
    const newNode: Partial<ContestsTreeNode> = {
      id: randomId(),
      type,
      parent,
      state: { selected: parentNode.state.selected },
    };
    if (type === 'dir') {
      newNode.state!.opened = false;
      newNode.text = `Folder ${counters.value.nextDir}`;
    } else {
      newNode.text = `Contest ${counters.value.nextContest}`;
    }
    jstree.value.create_node(parent, newNode);
    contestsStore.createNode(newNode as ContestsTreeNode);
    if (parentNode.type === 'dir') jstree.value.open_node(parentNode);
    treeState.value = 'not-empty';
  }

  // --- Hooks: ---

  function registerCallbacks($tree: any) {
    $tree.on(
      'select_node.jstree deselect_node.jstree select_all.jstree deselect_all.jstree',
      (e: any, data: any) => {
        const newSelection = jstree.value.get_bottom_selected(true).map((node: any) => node.id);
        clearTimeout(selectionTimer.value);
        setTimeout(() => {
          const eventType = e.type as string;
          let isSelect = true;
          if (eventType === 'deselect_node') isSelect = false;
          if (data.node.type === 'dir') {
            const children = jstree.value.get_node(data.node).children_d;
            if (isSelect) jstree.value.select_node(children);
            else jstree.value.deselect_node(children);
          }
          contestsStore.setSelection(newSelection);
        }, 20);
      }
    );
  }

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
        restore_focus: false,
        check_callback: true,
      },
      types: {
        dir: { icon: 'jstree-folder', valid_children: ['dir', 'contest'] },
        contest: { icon: 'jstree-file', valid_children: [] },
      },
      plugins: ['types', 'dnd'],
    });
    $tree.on('loaded.jstree', () => {
      jstree.value = $tree.jstree(true);
      const root = jstree.value.get_node('#');
      treeState.value = root.children.length === 0 ? 'empty' : 'not-empty';
      registerCallbacks($tree);
    });
  });
</script>

<template>
  <div
    class="tree-container grow flex select-none overflow-hidden"
    ref="tree-container"
    @click.right="handleContext"
    @click="context.visible = false"
  >
    <!-- Context menu -->
    <div
      v-if="context.visible"
      class="context-container fixed whitespace-nowrap"
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
    <div ref="tree" v-show="treeState === 'not-empty'" @scroll="context.visible = false"></div>
    <!-- Placeholder -->
    <div v-if="treeState === 'empty'" class="grow overflow-hidden relative">
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
  .jstree {
    flex-grow: 1;
    overflow: auto;
    padding-bottom: 100px;
  }
</style>
