<script lang="ts" setup>
  import { reactive, useTemplateRef } from 'vue';

  // --- Types and structures: ---

  type Node =
    | {
        type: 'dir';
      }
    | {
        type: 'file';
      };

  type ContextType = 'root' | 'dir' | 'file';

  const context = reactive({
    type: 'root' as ContextType,
    style: {} as Record<string, string>,
    visible: false,
    targetNode: null as Node | null,
    targetDomElement: null as HTMLInputElement | null,
  });

  const treeContainerRef = useTemplateRef('tree-container');

  // --- Context menu functions: ---

  function computeContextStyle(x: number, y: number) {
    const treeContainer = treeContainerRef.value;
    if (!treeContainer) return;
    const MENU_WIDTH = 150;
    const MENU_HEIGHT = 100;
    const rect = treeContainer.getBoundingClientRect();
    const left = x - rect.left;
    const top = y - rect.top;
    const res = {} as (typeof context)['style'];
    if (left + MENU_WIDTH > rect.width) {
      res['right'] = `${rect.width - left}px`;
    } else {
      res['left'] = `${left}px`;
    }
    if (top + MENU_HEIGHT > rect.height) {
      res['bottom'] = `${rect.height - top}px`;
    } else {
      res['top'] = `${top}px`;
    }
    context['style'] = res;
  }

  function showContext(type: ContextType, e: MouseEvent) {
    context.type = type;
    context.visible = true;
    computeContextStyle(e.clientX, e.clientY);
  }

  // --- Computed properties: ---
</script>

<template>
  <div class="tree-container" ref="tree-container" @click.right="(e) => showContext('root', e)">
    <!-- Context menu -->
    <div v-if="context.visible" class="context-container" :style="context.style">
      <div v-if="context.type === 'root'">
        <div>Create file</div>
        <div>Create folder</div>
      </div>
    </div>
    <!--  -->
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
