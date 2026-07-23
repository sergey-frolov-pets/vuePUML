<script setup lang="ts">
import ActionIcon from "@/components/icons/ActionIcon.vue";
import FileBadgeIcon from "@/components/icons/FileBadgeIcon.vue";

const props = defineProps<{
  isRendering: boolean;
  canExport: boolean;
  previewBackground: string;
  diagramDarkMode: boolean;
}>();

const emit = defineEmits<{
  exportSvg: [];
  exportPng: [];
  renderNow: [];
  "update:previewBackground": [value: string];
  "update:diagramDarkMode": [value: boolean];
}>();

function toggleDiagramTheme(): void {
  emit("update:diagramDarkMode", !props.diagramDarkMode);
}
</script>

<template>
  <div class="preview-toolbar">
    <label
      class="preview-toolbar__color-field"
      title="Фон предпросмотра"
    >
      <span class="sr-only">Фон предпросмотра</span>
      <input
        class="preview-toolbar__color"
        type="color"
        :value="previewBackground"
        @input="
          emit(
            'update:previewBackground',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
    </label>

    <button
      class="btn btn-icon"
      type="button"
      :aria-pressed="diagramDarkMode"
      :title="
        diagramDarkMode
          ? 'Переключить на светлую тему диаграммы'
          : 'Переключить на тёмную тему диаграммы'
      "
      :aria-label="
        diagramDarkMode
          ? 'Переключить на светлую тему диаграммы'
          : 'Переключить на тёмную тему диаграммы'
      "
      @click="toggleDiagramTheme"
    >
      <ActionIcon :name="diagramDarkMode ? 'sun' : 'moon'" />
    </button>

    <button
      class="btn btn-icon"
      type="button"
      title="Обновить"
      aria-label="Обновить"
      :disabled="isRendering"
      @click="emit('renderNow')"
    >
      <ActionIcon name="refresh" />
    </button>

    <button
      class="btn btn-icon btn-primary"
      type="button"
      title="Экспорт SVG"
      aria-label="Экспорт SVG"
      :disabled="!canExport"
      @click="emit('exportSvg')"
    >
      <FileBadgeIcon format="SVG" />
    </button>

    <button
      class="btn btn-icon btn-primary"
      type="button"
      title="Экспорт PNG"
      aria-label="Экспорт PNG"
      :disabled="!canExport"
      @click="emit('exportPng')"
    >
      <FileBadgeIcon format="PNG" />
    </button>
  </div>
</template>

<style scoped>
.preview-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.preview-toolbar__color-field {
  display: inline-flex;
  margin: 0;
}

.preview-toolbar__color {
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
