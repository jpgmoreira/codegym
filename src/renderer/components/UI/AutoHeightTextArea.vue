<script lang="ts" setup>
  import { onMounted, useTemplateRef, watch } from 'vue';

  const props = defineProps({
    minHeight: { type: Number, default: 0 },
    maxHeight: { type: Number, default: 200 },
  });

  const modelValue = defineModel<string>({ default: '' });
  const textareaRef = useTemplateRef('textarea');

  function adjustHeight() {
    if (!textareaRef.value) return;
    textareaRef.value.style.height = 'auto';
    const newHeight = Math.min(
      Math.max(textareaRef.value.scrollHeight, props.minHeight),
      props.maxHeight
    );
    textareaRef.value.style.height = newHeight + 'px';
  }

  watch(modelValue, adjustHeight);
  onMounted(adjustHeight);
</script>

<template>
  <textarea class="autoheight-textarea" ref="textarea" v-model="modelValue"></textarea>
</template>

<style scoped>
  .autoheight-textarea {
    width: 100%;
    resize: none;
    display: block;
  }
</style>
