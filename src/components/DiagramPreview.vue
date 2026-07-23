<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import DiagramToolbar from "@/components/DiagramToolbar.vue";
import PanelFullscreenButton from "@/components/PanelFullscreenButton.vue";
import { sanitizeSvgForPreview } from "@/utils/export";

const props = defineProps<{
  svg: string;
  error: string;
  isRendering: boolean;
  canExport: boolean;
  previewBackground: string;
  diagramDarkMode: boolean;
}>();

const emit = defineEmits<{
  renderNow: [];
  exportSvg: [];
  exportPng: [];
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
          :preview-background="previewBackground"
          :diagram-dark-mode="diagramDarkMode"
          @render-now="emit('renderNow')"
          @export-svg="emit('exportSvg')"
          @export-png="emit('exportPng')"
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
  align-items: center;
  flex-wrap: nowrap;
}

.preview-header-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
  flex-shrink: 0;
}

.preview-header-actions .status-pill {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
