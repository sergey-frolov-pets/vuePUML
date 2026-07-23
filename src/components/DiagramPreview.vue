<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import PanelFullscreenButton from "@/components/PanelFullscreenButton.vue";
import { sanitizeSvgForPreview } from "@/utils/export";

const props = defineProps<{
  svg: string;
  error: string;
  isRendering: boolean;
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

    <header class="panel-header">
      <h2 class="panel-title">Предпросмотр</h2>
      <div class="preview-header-actions">
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
.preview-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
