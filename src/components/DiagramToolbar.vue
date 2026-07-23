<script setup lang="ts">
defineProps<{
  isRendering: boolean;
  canExport: boolean;
}>();

const emit = defineEmits<{
  exportSvg: [];
  exportPng: [];
  renderNow: [];
}>();
</script>

<template>
  <div class="toolbar">
    <button
      class="btn"
      type="button"
      :disabled="isRendering"
      @click="emit('renderNow')"
    >
      Обновить
    </button>
    <button
      class="btn btn-primary"
      type="button"
      :disabled="!canExport"
      @click="emit('exportSvg')"
    >
      SVG
    </button>
    <button
      class="btn btn-primary"
      type="button"
      :disabled="!canExport"
      @click="emit('exportPng')"
    >
      PNG
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  gap: 10px;
}
</style>
