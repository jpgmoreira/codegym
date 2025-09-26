<script lang="ts" setup>
  import TreeView from '@renderer/components/UI/TreeView.vue';
  import SettingsPageHeader from '@renderer/components/Header/custom/SettingsPageHeader.vue';
</script>

<template>
  <SettingsPageHeader />
  <TreeView :checkbox="false" />
</template>
