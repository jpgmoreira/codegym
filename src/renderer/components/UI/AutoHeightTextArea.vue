<script lang="ts" setup>
  import { onMounted, useTemplateRef, watch } from 'vue';
  const props = defineProps({
    minHeight: {
      type: Number,
      required: false,
      default: 100,
    },
    maxHeight: {
      type: Number,
      required: false,
      default: 200,
    },
    modelValue: {
      type: String,
      required: false,
      default: '',
    },
  });
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
  }>();
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
  function onInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    emit('update:modelValue', target.value);
    adjustHeight();
  }
  watch(() => props.modelValue, adjustHeight, { immediate: true });
  onMounted(adjustHeight);
</script>

<template>
  <textarea
    class="autoheight-textarea"
    ref="textarea"
    :value="modelValue"
    @input="onInput"
  ></textarea>
</template>

<style scoped>
  .autoheight-textarea {
    width: 100%;
    resize: none;
    display: block;
  }
</style>
