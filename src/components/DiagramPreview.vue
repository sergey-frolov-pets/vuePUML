<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import DiagramToolbar from "@/components/DiagramToolbar.vue";
import PanelFullscreenButton from "@/components/PanelFullscreenButton.vue";
import type { LayoutEngine } from "@/constants";
import { sanitizeSvgForPreview } from "@/utils/export";

const props = defineProps<{
  svg: string;
  error: string;
  isRendering: boolean;
  canExport: boolean;
  layout: LayoutEngine;
  previewBackground: string;
  diagramDarkMode: boolean;
}>();

const emit = defineEmits<{
  renderNow: [];
  exportSvg: [];
  exportPng: [];
  "update:layout": [value: LayoutEngine];
  "update:previewBackground": [value: string];
  "update:diagramDarkMode": [value: boolean];
}>();

const isFullscreen = ref(false);

const previewMarkup = computed(() => {
  if (!props.svg) {
    return "";
  }
  return sanitizeSvgForPreview(props.svg);
});

function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value;
}

function onFullscreenKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && isFullscreen.value) {
    isFullscreen.value = false;
  }
}

onMounted(() => {
  window.addEventListener("keydown", onFullscreenKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onFullscreenKeydown);
  document.body.style.overflow = "";
});

watch(isFullscreen, (value) => {
  document.body.style.overflow = value ? "hidden" : "";
});
</script>

<template>
  <section
    class="panel preview-panel panel--corner-controls"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <PanelFullscreenButton :active="isFullscreen" @toggle="toggleFullscreen" />

    <header class="panel-header preview-panel__header">
      <h2 class="panel-title">Предпросмотр</h2>
      <div class="preview-header-actions">
        <DiagramToolbar
          :is-rendering="isRendering"
          :can-export="canExport"
          :layout="layout"
          :preview-background="previewBackground"
          :diagram-dark-mode="diagramDarkMode"
          @render-now="emit('renderNow')"
          @export-svg="emit('exportSvg')"
          @export-png="emit('exportPng')"
          @update:layout="emit('update:layout', $event)"
          @update:preview-background="emit('update:previewBackground', $event)"
          @update:diagram-dark-mode="emit('update:diagramDarkMode', $event)"
        />
        <span v-if="isRendering" class="status-pill">Рендеринг…</span>
      </div>
    </header>

    <div class="panel-body">
      <div v-if="error" class="preview-error">{{ error }}</div>
      <div
        v-else-if="previewMarkup"
        class="preview-frame"
        v-html="previewMarkup"
      />
      <div v-else class="preview-placeholder">
        Введите PlantUML-код слева — диаграмма появится здесь.
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview-panel__header {
  align-items: flex-start;
}

.preview-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
}
</style>
